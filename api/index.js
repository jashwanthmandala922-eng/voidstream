const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 'loopback');

// 1. RATE LIMITING
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10000, // Temporarily high for verification
  message: { error: 'Too many requests, please try again after 30 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter); // Apply rate limiting in production
} else {
  app.use('/api', (req, res, next) => next()); // Skip limiter during local dev
}

// 2. SECRET MANAGEMENT (TMDB Proxy)
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY;

if (TMDB_KEY) {
    console.log(`> TMDB_KEY CONFIGURATION DETECTED`);
} else {
    console.error('CRITICAL: TMDB_API_KEY is missing from environment variables');
}

const requireTmdbKey = (req, res, next) => {
  if (!TMDB_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY is missing from environment' });
  }
  next();
};

app.use('/api/tmdb', requireTmdbKey);

app.get(/^\/api\/tmdb\/(.*)/, async (req, res) => {
  try {
    const endpoint = req.params[0];
    const isV4 = TMDB_KEY?.length > 100;
    
    const https = require('https');
    const agent = new https.Agent({ family: 4 });

    const config = {
      params: { ...req.query },
      headers: { 'Accept': 'application/json' },
      httpsAgent: agent
    };

    if (isV4) {
      config.headers.Authorization = `Bearer ${TMDB_KEY}`;
    } else {
      config.params.api_key = TMDB_KEY;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, config);

    res.json(response.data);
  } catch (error) {
    console.error(`! Proxy Error:`, error.message);
    res.status(error.response?.status || 500).json({ error: 'Proxy Error' });
  }
});


// For Vercel, we export the app instead of calling listen()
module.exports = app;
