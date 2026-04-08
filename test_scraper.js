const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config();

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const TMDB_KEY = process.env.TMDB_API_KEY;
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function test() {
    const imdbId = 'tt15327088';
    
    try {
        // 1. Visit main page for cookies
        console.log('Visiting vidlink.pro...');
        await client.get('https://vidlink.pro/', {
            headers: { 'User-Agent': CHROME_UA }
        });

        // 2. Convert to TMDB
        const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
        const findResp = await axios.get(findUrl);
        const tmdbId = findResp.data.tv_results?.[0]?.id;
        console.log('TMDB ID:', tmdbId);
        
        if (!tmdbId) throw new Error('TMDB ID not found');

        // 3. Try VidLink API
        const vidlinkUrl = `https://vidlink.pro/api/source/tv/${tmdbId}/1/1`;
        console.log('VidLink URL:', vidlinkUrl);
        
        const vidlinkResp = await client.get(vidlinkUrl, {
            headers: {
                'Referer': `https://vidlink.pro/tv/${imdbId}/1/1`,
                'User-Agent': CHROME_UA,
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://vidlink.pro',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Dest': 'empty'
            }
        });
        
        console.log('VidLink Response Status:', vidlinkResp.status);
        console.log('VidLink Data:', JSON.stringify(vidlinkResp.data).slice(0, 500));
        
    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', typeof e.response.data === 'string' ? e.response.data.slice(0, 500) : e.response.data);
        }
    }
}

test();
