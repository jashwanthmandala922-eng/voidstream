const axios = require('axios');

const BASE = '/api/tmdb';
const api = axios.create({ baseURL: BASE });

console.log('Testing Axios URL generation:');
console.log('baseURL:', BASE);
console.log('path: /trending/all/week');

// Mocking the internal request to see the final URL
const request = api.get('/trending/all/week').catch(err => {
    // It will fail because there's no server, but we can see the config
    console.log('Config URL:', err.config.url);
    console.log('Config baseURL:', err.config.baseURL);
});
