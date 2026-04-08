const axios = require('axios');
const CryptoJS = require('crypto-js');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY;

// High-quality User-Agent spoofing
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Convert IMDB ID to TMDB ID
 */
async function convertImdbToTmdb(imdbId, type = 'movie') {
    if (!imdbId.startsWith('tt')) return imdbId;
    
    try {
        console.log(`[TMDB] Converting IMDB ID ${imdbId} to TMDB ID...`);
        const response = await axios.get(`${TMDB_BASE_URL}/find/${imdbId}`, {
            params: {
                api_key: TMDB_KEY,
                external_source: 'imdb_id'
            }
        });
        
        const key = type === 'movie' ? 'movie_results' : 'tv_results';
        const results = response.data[key];
        
        if (results && results.length > 0) {
            console.log(`[TMDB] Success: ${imdbId} -> ${results[0].id}`);
            return results[0].id.toString();
        }
        return null;
    } catch (error) {
        console.error(`[TMDB] Error:`, error.message);
        return null;
    }
}

/**
 * Decryption Utility
 */
function decryptSource(encrypted, method = 'aes') {
    if (!encrypted) return null;
    
    // Attempt 1: Base64 + Reverse (Common fallback)
    try {
        const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
        if (decoded.includes('http')) return decoded;
        
        const reversed = decoded.split('').reverse().join('');
        if (reversed.includes('http')) return reversed;
    } catch (e) {}

    // Attempt 2: AES Decryption (Multiple Keys)
    const keys = [
        'bfbe24ce88d234a9749591e3264b3ef1', // VidLink Key 1
        '46d9766e4a691370215714f331904791', // VidLink Key 2
        '6adc621481b76428af4a0346394fedf2'  // General Key
    ];

    for (const key of keys) {
        try {
            const bytes = CryptoJS.AES.decrypt(encrypted, key);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted && decrypted.includes('http')) return decrypted;
        } catch (e) {}
    }

    return null;
}

/**
 * Resilience logic for getting sources
 */
async function getResilientSources(id, type = 'movie', season = '1', episode = '1') {
    // 1. Ensure we have the right IDs
    let tmdbId = id;
    if (id.startsWith('tt')) {
        tmdbId = await convertImdbToTmdb(id, type);
    }
    
    const providers = [
        {
            name: 'VidLink',
            buildUrl: (tid) => type === 'movie' ? `https://vidlink.pro/api/source/movie/${tid}` : `https://vidlink.pro/api/source/tv/${tid}/${season}/${episode}`,
            headers: { 'Referer': 'https://vidlink.pro/', 'User-Agent': CHROME_UA }
        },
        {
            name: 'Vidsrc.to',
            buildUrl: (tid) => `https://vidsrc.to/ajax/embed/source/${tid}`,
            headers: { 'Referer': 'https://vidsrc.to/', 'User-Agent': CHROME_UA }
        },
        {
            name: 'Embed.su',
            buildUrl: (tid) => `https://embed.su/api/source/${tid}`,
            headers: { 'Referer': 'https://embed.su/', 'User-Agent': CHROME_UA }
        }
    ];

    for (const provider of providers) {
        const url = provider.buildUrl(tmdbId || id);
        console.log(`[Discovery] Trying ${provider.name}: ${url}`);
        
        try {
            const response = await axios.get(url, { 
                headers: provider.headers,
                timeout: 8000 
            });
            
            const data = response.data;
            if (data && (data.file || data.url)) {
                const encrypted = data.file || data.url;
                const decrypted = decryptSource(encrypted);
                
                if (decrypted) {
                    console.log(`[Discovery] Successfully found stream from ${provider.name}`);
                    return {
                        ...data,
                        file: decrypted,
                        provider: provider.name
                    };
                }
            }
        } catch (error) {
            console.warn(`[Discovery] ${provider.name} failed (${error.response?.status || error.message})`);
            // Continue to next provider
        }
    }

    throw new Error("No resilient streams found across all providers.");
}

module.exports = { getResilientSources, convertImdbToTmdb };
