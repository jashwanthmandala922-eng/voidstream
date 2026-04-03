const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_KEY = '7db74daa5388798a3632bfc81ff7323d';

async function test() {
    try {
        const url = `${TMDB_BASE_URL}/movie/popular`;
        console.log(`Fetching ${url}...`);
        const res = await axios.get(url, {
            params: { api_key: TMDB_KEY },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Success!', res.data.results.length, 'results');
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
             console.error('Code:', err.code);
             console.error('Stack:', err.stack);
        }
    }
}

test();
