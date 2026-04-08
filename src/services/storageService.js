import { executeQuery, executeMutation, getDataConnect } from 'firebase/data-connect';
import app, { auth } from '../config/firebase';

const KEYS = {
  SETTINGS: 'voidflix_settings',
  GUEST:    'voidflix_guest',
  USERNAME: 'voidflix_username',
  WISHLIST: 'voidflix_wishlist',
  HISTORY:  'voidflix_history'
};

/**
 * Robust Singleton for Firebase Data Connect.
 */
let dc = null;
const getDC = () => {
    if (!dc) {
        dc = getDataConnect(app, {
            service: 'voidflix',
            location: 'asia-southeast1',
            connector: 'watch'
        });
    }
    return dc;
};

export const setGuestMode = (v = 'true') => localStorage.setItem(KEYS.GUEST, v);
export const exitGuestMode = () => {
    localStorage.removeItem(KEYS.GUEST);
    localStorage.removeItem(KEYS.WISHLIST);
    localStorage.removeItem(KEYS.HISTORY);
    window.location.reload();
};

// ── UTILS ──────────────────────────────────────────────
export const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{"uiTheme": "hotstar", "navStyle": "sidebar", "trailerOnHover": true}');
  } catch {
    return { uiTheme: 'hotstar', navStyle: 'sidebar', trailerOnHover: true };
  }
};

export const saveSettings = (s) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
export const resetSettings = () => {
  const defaults = { uiTheme: 'hotstar', navStyle: 'sidebar', trailerOnHover: true };
  saveSettings(defaults);
  return defaults;
};

export const isGuest = () => localStorage.getItem(KEYS.GUEST) === 'true';
export const setGuest = (v) => localStorage.setItem(KEYS.GUEST, v);

// ── WISHLIST ───────────────────────────────
export const getWishlist = async () => {
  if (isGuest()) {
    try {
      return JSON.parse(localStorage.getItem('voidflix_wishlist') || '[]');
    } catch { return []; }
  }
  if (!auth || !auth.currentUser) return [];
  try {
    const instance = getDC();
    const { data } = await executeQuery(instance, 'GetWishlist');
    return data.watchlistItems.map(item => {
      const core = item.movieId || item.animeId;
      return {
        ...core,
        id: core.tmdbId || core.malId,
        title: core.title,
        poster: core.posterUrl,
        year: core.releaseYear,
        type: item.mediaType
      };
    });
  } catch (e) {
    console.error('Wishlist Error:', e);
    return [];
  }
};

export const addToWishlist = async (item) => {
  if (isGuest()) {
    const list = JSON.parse(localStorage.getItem('voidflix_wishlist') || '[]');
    if (!list.find(i => String(i.id) === String(item.id))) {
      list.push(item);
      localStorage.setItem('voidflix_wishlist', JSON.stringify(list));
    }
    return true;
  }
  if (!auth || !auth.currentUser) return false;
  try {
    const instance = getDC();
    await executeMutation(instance, 'AddToWishlist', {
      mediaType: item.type,
      tmdbId: (item.type === 'movie') ? String(item.id) : null,
      malId: (item.type === 'tv' || item.type === 'anime' || item.type === 'series') ? String(item.id) : null,
      title: item.title,
      posterUrl: item.poster,
      releaseYear: item.year ? parseInt(item.year) : null
    });
    return true;
  } catch (e) {
    console.error('AddToWishlist Error:', e);
    return false;
  }
};

export const removeFromWishlist = async (id, type) => {
  if (isGuest()) {
    const list = JSON.parse(localStorage.getItem('voidflix_wishlist') || '[]');
    localStorage.setItem('voidflix_wishlist', JSON.stringify(list.filter(i => String(i.id) !== String(id))));
    return;
  }
  if (!auth || !auth.currentUser) return;
  try {
    const instance = getDC();
    const vars = {
      mediaType: type,
      movieId: type === 'movie' ? { tmdbId: String(id) } : null,
      animeId: (type === 'tv' || type === 'anime' || type === 'series') ? { malId: String(id) } : null
    };
    await executeMutation(instance, 'RemoveFromWishlist', vars);
  } catch (e) {
    console.error('RemoveFromWishlist Error:', e);
  }
};

export const isWishlisted = async (id, type) => {
  const list = await getWishlist();
  return list.some(i => String(i.id) === String(id));
};

export const clearWishlist = async () => {
  if (isGuest()) {
    localStorage.removeItem(KEYS.WISHLIST);
    return;
  }
  if (!auth || !auth.currentUser) return;
  try {
    const instance = getDC();
    await executeMutation(instance, 'ClearWishlist');
  } catch (e) {
    console.error('ClearWishlist Error:', e);
  }
};

// ── HISTORY ───────────────────────────────
export const getHistory = async () => {
  if (isGuest()) {
    try {
      return JSON.parse(localStorage.getItem('voidflix_history') || '[]');
    } catch { return []; }
  }
  if (!auth || !auth.currentUser) return [];
  try {
    const instance = getDC();
    const { data } = await executeQuery(instance, 'GetHistory');
    return data.watchHistories.map(item => {
      const core = item.movieId || item.animeId;
      return {
        ...core,
        id: core.tmdbId || core.malId,
        title: core.title,
        poster: core.posterUrl,
        year: core.releaseYear,
        type: item.mediaType,
        watchedAt: item.watchedAt
      };
    });
  } catch (e) {
    console.error('History Error:', e);
    return [];
  }
};

export const addToHistory = async (item) => {
  if (isGuest()) {
    const hist = JSON.parse(localStorage.getItem('voidflix_history') || '[]');
    const idx = hist.findIndex(i => String(i.id) === String(item.id));
    if (idx !== -1) hist.splice(idx, 1);
    hist.unshift(item);
    localStorage.setItem('voidflix_history', JSON.stringify(hist.slice(0, 20)));
    return;
  }
  if (!auth || !auth.currentUser) return;
  try {
    const instance = getDC();
    await executeMutation(instance, 'AddToHistory', {
      mediaType: item.type,
      tmdbId: (item.type === 'movie') ? String(item.id) : null,
      malId: (item.type === 'tv' || item.type === 'anime' || item.type === 'series') ? String(item.id) : null,
      title: item.title,
      posterUrl: item.poster,
      releaseYear: item.year ? parseInt(item.year) : null
    });
  } catch (e) {
    console.error('AddToHistory Error:', e);
  }
};

export const removeFromHistory = async (id, type) => {
  if (isGuest()) {
    const hist = JSON.parse(localStorage.getItem('voidflix_history') || '[]');
    localStorage.setItem('voidflix_history', JSON.stringify(hist.filter(i => String(i.id) !== String(id))));
    return;
  }
  if (!auth || !auth.currentUser) return;
  try {
    const instance = getDC();
    await executeMutation(instance, 'RemoveFromHistory', {
      mediaType: type,
      movieId: type === 'movie' ? { tmdbId: String(id) } : null,
      animeId: (type === 'tv' || type === 'anime' || type === 'series') ? { malId: String(id) } : null
    });
  } catch (e) {
    console.error('RemoveFromHistory Error:', e);
  }
};

export const clearHistory = async () => {
  if (isGuest()) {
    localStorage.removeItem('voidflix_history');
    return;
  }
  if (!auth || !auth.currentUser) return;
  try {
    const instance = getDC();
    await executeMutation(instance, 'ClearHistory');
  } catch (e) {
    console.error('ClearHistory Error:', e);
  }
};

// ── UTILITIES ───────────────────────────────────────────
export const getStorageSize = () => {
  let size = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      size += (localStorage[key].length + key.length) * 2;
    }
  }
  const kb = (size / 1024).toFixed(2);
  const mb = (size / 1024 / 1024).toFixed(2);
  const percent = Math.min(((size / 1024) / 5120) * 100, 100).toFixed(1);
  return { kb, mb, percent };
};

export const exportHistory = async () => {
  const data = await getHistory();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voidflix_history.json';
  a.click();
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.href = '';
  }, 100);
};

export const exportWishlist = async () => {
  const data = await getWishlist();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voidflix_wishlist.json';
  a.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.href = '';
  }, 100);
};

/**
 * Parses and validates imported data. Accepts a File, JSON string, or already-parsed object.
 * Returns the validated array. Callers are responsible for persisting the items.
 */
export const importData = async (data) => {
  let text;
  if (data instanceof File) {
    text = await data.text();
  } else if (typeof data === 'string') {
    text = data;
  } else {
    text = JSON.stringify(data);
  }
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: expected an array of items');
  }
  return parsed;
};
