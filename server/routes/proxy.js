const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/stream', async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            headers: {
                'Origin': 'https://videostr.net',
                'Referer': 'https://videostr.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });

        // Forward status and headers
        res.status(response.status);
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t');
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
        if (response.headers['accept-ranges']) res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
        
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Error fetching stream');
    }
});

// Proxy for .m3u8 files to rewrite segment URLs
router.get('/m3u8', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL required');

    try {
        const response = await axios.get(url, {
            headers: {
                'Origin': 'https://videostr.net',
                'Referer': 'https://videostr.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });

        let content = response.data;
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        // Rewrite segment and manifest URLs
        content = content.replace(/^(?!#)(.*)$/gm, (match) => {
            const trimmed = match.trim();
            if (!trimmed) return match;
            const fullUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).toString();
            const proxyPath = fullUrl.includes('.m3u8') ? '/api/proxy/m3u8' : '/api/proxy/stream';
            return `${proxyPath}?url=${encodeURIComponent(fullUrl)}`;
        });

        // Rewrite encryption key URLs
        content = content.replace(/URI="(.*?)"/g, (match, p1) => {
            const fullUrl = p1.startsWith('http') ? p1 : new URL(p1, baseUrl).toString();
            return `URI="/api/proxy/stream?url=${encodeURIComponent(fullUrl)}"`;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(content);
    } catch (error) {
        res.status(500).send('Error proxying m3u8');
    }
});

module.exports = router;
