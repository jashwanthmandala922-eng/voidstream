import axios from 'axios';

const BASE = 'http://localhost:5000/api/tmdb';
const IMG  = 'https://image.tmdb.org/t/p';

// Build full image URL — returns placeholder if no path
export const img = (path, size = 'w342') =>
  path
    ? `${IMG}/${size}${path}`
    : `https://placehold.co/${
        size === 'w342' ? '342x513' : '1280x720'
      }/030508/00FF41?text=NO+IMAGE`;

// Check if the key is missing from the server
export const isApiKeyMissing = () => false; // Handled by server error response now

// Axios instance with interceptor – returns empty results on auth errors
const api = axios.create({ baseURL: BASE });
api.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status;
    if (status === 401 || status === 403 || status === 429) {
      // 429 is the rate limit error from our Express proxy
      return Promise.resolve({ data: { results: [], total_pages: 0 } });
    }
    return Promise.reject(err);
  }
);

const get = (endpoint, params = {}) =>
  api.get(endpoint, { params }) // No API key passed here!
     .then(r => r.data);


// HOME ROWS
export const getTrending   = () => get('/trending/all/week');
export const getPopMovies  = () => get('/movie/popular');
export const getPopSeries  = () => get('/tv/popular');
export const getNowPlaying = () => get('/movie/now_playing');
export const getTopRated   = () => get('/movie/top_rated');
export const getTopRatedTV = () => get('/tv/top_rated');

// DISCOVER (with filters)
export const discoverMovies = (params) =>
  get('/discover/movie', { sort_by: 'popularity.desc', ...params });

export const discoverTV = (params) =>
  get('/discover/tv', { sort_by: 'popularity.desc', ...params });

export const getAnime = (params) =>
  get('/discover/tv', {
    with_genres: 16,
    sort_by: 'popularity.desc',
    ...params
  });

// DETAIL
export const getMovie = (id) =>
  get(`/movie/${id}`, { append_to_response: 'videos,credits' });

export const getTVShow = (id) =>
  get(`/tv/${id}`, { append_to_response: 'videos,credits' });

export const getSeason = (id, season) =>
  get(`/tv/${id}/season/${season}`);

export const getVideos = (id, type) =>
  get(`/${type}/${id}/videos`);

// SIMILAR
export const getSimilarMovies = (id) => get(`/movie/${id}/similar`);
export const getSimilarTV     = (id) => get(`/tv/${id}/similar`);

// SEARCH
export const searchAll    = (query, page = 1) =>
  get('/search/multi',  { query, page });
export const searchMovies = (query, page = 1) =>
  get('/search/movie',  { query, page });
export const searchTV     = (query, page = 1) =>
  get('/search/tv',     { query, page });

// GENRES
export const getMovieGenres = () => get('/genre/movie/list');
export const getTVGenres    = () => get('/genre/tv/list');
