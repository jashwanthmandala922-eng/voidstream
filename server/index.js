const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 'loopback');
const PORT = process.env.PORT || 5000;

// 1. RATE LIMITING (The "30-minute fix")
// Prevents brute-force and billing drain on public proxy endpoints
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
// The API Key is appended here ON THE SERVER, never exposed to the client
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const tmdbAgent = new (require('https').Agent)({ family: 4, keepAlive: true });

const TMDB_KEY = process.env.TMDB_API_KEY;
if (TMDB_KEY) {
    console.log(`> TMDB_KEY LOADED: ${TMDB_KEY.slice(0, 5)}... (Length: ${TMDB_KEY.length})`);
} else {
    console.error('CRITICAL: TMDB_API_KEY is missing from .env');
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
    
    const config = {
      params: { ...req.query },
      headers: { 'Accept': 'application/json' },
      httpsAgent: tmdbAgent,
      timeout: 15000
    };


    if (isV4) {
      config.headers.Authorization = `Bearer ${TMDB_KEY}`;
    } else {
      config.params.api_key = TMDB_KEY;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, config);

    res.json(response.data);
  } catch (error) {
    console.error(`! Proxy Error calling TMDB:`, error);
    if (error.response) {
      console.error(`  status: ${error.response.status}`);
      console.error(`  data:`, error.response.data);
    }
    res.status(error.response?.status || 500).json({ error: 'Proxy Error' });
  }
});


const startApp = (port) => {
  const server = app.listen(port, () => {
    console.log(`Security Proxy running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`FATAL: Port ${port} is already in use. React proxy expects http://localhost:5000 by default.`);
      console.error(`Set PORT to a free port or run 'npm run server:alt' (5001), and adjust your client proxy if needed.`);
      console.error(`You can set PORT with environment variable or ensure server script is changed accordingly.`);
    } else {
      console.error(`Failed to start server on port ${port}:`, err);
    }
    process.exit(1);
  });
};

startApp(PORT);

