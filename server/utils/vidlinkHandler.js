const CryptoJS = require('crypto-js');
const axios = require('axios');

async function decryptVidLink(encryptedData) {
    if (!encryptedData) return null;

    // List of known keys for VidLink
    const keys = [
        'bfbe24ce88d234a9749591e3264b3ef1',
        '46d9766e4a691370215714f331904791',
        '6adc621481b76428af4a0346394fedf2'
    ];

    // Try basic Base64 first
    try {
        const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
        if (decoded.includes('http')) return decoded;
    } catch (e) {}

    // Try AES decryption with different keys
    for (const key of keys) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, key);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted && decrypted.includes('http')) {
                return decrypted;
            }
        } catch (e) {}
    }

    console.error("Failed to decrypt VidLink source with known keys.");
    return null;
}

async function getVidLinkSources(id, type = 'movie', season = '', episode = '') {
    const baseUrl = 'https://vidlink.pro/api/source';
    const url = type === 'movie' ? `${baseUrl}/movie/${id}` : `${baseUrl}/tv/${id}/${season}/${episode}`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://vidlink.pro/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const data = response.data;
        if (data && data.file) {
            const decryptedFile = await decryptVidLink(data.file);
            if (decryptedFile) {
                return {
                    ...data,
                    file: decryptedFile
                };
            }
        }
        
        // If data is already decrypted or no file field
        return data;
    } catch (error) {
        console.error(`Error fetching VidLink sources:`, error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        }
        throw error;
    }
}

module.exports = { getVidLinkSources, decryptVidLink };
