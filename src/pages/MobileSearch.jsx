import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAll, img } from '../services/tmdbService';
import { useIsMobile } from '../hooks/useResponsive';
import { Mic, X, Search, Flame, Star, Clapperboard, TrendingUp } from 'lucide-react';

function MobileSearchResult({ item }) {
  const navigate = useNavigate();
  const route = item.media_type === 'movie' ? '/movie' : '/series';
  return (
    <button className="pms-card" onClick={() => navigate(`${route}/${item.id}`)} role="link" aria-label={`View details for ${item.title || item.name}`}>
      <img src={item.poster_path ? img(item.poster_path, 'w185') : 'https://placehold.co/185x278/141414/007AFF?text=NO+IMAGE'} alt="" loading="lazy" />
      <div className="pms-info">
        <div className="pms-type">{item.media_type === 'movie' ? 'FILM' : 'SERIES'}</div>
        <h4>{item.title || item.name}</h4>
        <div className="pms-meta">
          {item.vote_average && <span className="pms-rating"><Star size={10} fill="currentColor" /> {item.vote_average.toFixed(1)}</span>}
          {(item.release_date || item.first_air_date) && <span>{((item.release_date || item.first_air_date) || '').split('-')[0]}</span>}
        </div>
      </div>
    </button>
  );
}

export default function MobileSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(!searchParams.get('q'));
  const [isListening, setIsListening] = useState(false);
  const isMobile = useIsMobile();
  const recognitionRef = useRef(null);

  const trendingSearches = [
    { icon: Flame, label: 'Trending', query: 'action 2026' },
    { icon: Star, label: 'Top Rated', query: 'top rated movies' },
    { icon: Clapperboard, label: 'New Releases', query: 'new movies' },
    { icon: TrendingUp, label: 'Popular Series', query: 'popular tv series' },
  ];

  const recentSearches = (() => { try { return JSON.parse(localStorage.getItem('vs_recent_searches') || '[]'); } catch { return []; } })();
  const q = searchParams.get('q') || '';

  useEffect(() => { setLocalQuery(q); setShowSuggestions(!q); }, [q]);

  const saveRecentSearch = (query) => {
    try {
      const recent = JSON.parse(localStorage.getItem('vs_recent_searches') || '[]');
      localStorage.setItem('vs_recent_searches', JSON.stringify([query, ...recent.filter(r => r !== query)].slice(0, 8)));
    } catch {}
  };

  const fetchData = useCallback(async () => {
    if (!q) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await searchAll(q, page);
      const results = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
      if (page === 1) setItems(results); else setItems(prev => [...prev, ...results]);
      setTotalPgs(Math.min(data.total_pages || 1, 500));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, q]);

  useEffect(() => { setPage(1); }, [q]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isMobile) return null;

  const handleSearch = (query) => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    setSearchParams({ q: query.trim() });
    setShowSuggestions(false);
  };

  const initVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (e) => setLocalQuery(Array.from(e.results).map(r => r[0].transcript).join(''));
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    return r;
  };

  const handleVoice = () => {
    if (!recognitionRef.current) recognitionRef.current = initVoice();
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); if (localQuery) handleSearch(localQuery); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  return (
    <div className="pms-root">
      <div className="pms-header">
        <div className={`pms-bar ${isListening ? 'listening' : ''}`}>
          <Search size={18} className="pms-icon" />
          <input value={localQuery} onChange={e => setLocalQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(localQuery); }} onFocus={() => !q && setShowSuggestions(true)} placeholder="Search films, series..." className="pms-input" autoFocus aria-label="Search content" />
          {localQuery && <button onClick={() => { setLocalQuery(''); setSearchParams({}); setShowSuggestions(true); }} className="pms-clear" aria-label="Clear search"><X size={16} /></button>}
          <button onClick={handleVoice} className={`pms-mic ${isListening ? 'active' : ''}`} aria-label={isListening ? "Stop voice search" : "Start voice search"} aria-pressed={isListening}><Mic size={18} /></button>
        </div>
      </div>

      {showSuggestions && !q && (
        <div className="pms-suggestions">
          {recentSearches.length > 0 && (
            <div className="pms-section">
              <span className="pms-label">Recent</span>
              <div className="pms-chips">{recentSearches.map(s => <button key={s} className="pms-chip" onClick={() => handleSearch(s)}>{s}</button>)}</div>
            </div>
          )}
          <div className="pms-section">
            <span className="pms-label">Trending</span>
            <div className="pms-trending">{trendingSearches.map(t => { const Icon = t.icon; return <button key={t.label} className="pms-trending-item" onClick={() => handleSearch(t.query)}><Icon size={18} /><span>{t.label}</span></button>; })}</div>
          </div>
        </div>
      )}

      {q && (
        <div className="pms-results">
          {items.length === 0 && !loading && <div className="pms-empty"><Search size={36} style={{ opacity: 0.15 }} /><p>No results for "{q}"</p></div>}
          <div className="pms-list">
            {items.map(item => <MobileSearchResult key={`${item.id}-${item.media_type}`} item={item} />)}
            {loading && Array(4).fill(null).map((_, i) => <div key={i} className="pms-skeleton"><div className="pms-sk-img" /><div className="pms-sk-info"><div className="pms-sk-line w60" /><div className="pms-sk-line w40" /></div></div>)}
          </div>
          {!loading && page < totalPgs && items.length > 0 && <button className="pms-load-more" onClick={() => setPage(p => p + 1)}>Load More</button>}
        </div>
      )}

      <style>{`
        .pms-root { min-height: 100vh; background: var(--black); padding-bottom: 80px; }
        .pms-header { position: sticky; top: 0; z-index: 100; padding: 10px 16px; background: rgba(10,10,10,0.9); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
        .pms-bar { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0 12px; }
        .pms-bar.listening { border-color: var(--accent); }
        .pms-icon { color: rgba(255,255,255,0.35); flex-shrink: 0; }
        .pms-input { flex: 1; background: none; border: none; color: white; font-family: 'Inter', sans-serif; font-size: 15px; padding: 12px 0; outline: none; }
        .pms-input::placeholder { color: rgba(255,255,255,0.3); }
        .pms-clear { background: none; border: none; color: rgba(255,255,255,0.4); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .pms-mic { background: none; border: none; color: rgba(255,255,255,0.4); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .pms-mic.active { color: var(--accent); }
        .pms-suggestions { padding: 16px; }
        .pms-section { margin-bottom: 24px; }
        .pms-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); margin-bottom: 10px; display: block; letter-spacing: 0.5px; }
        .pms-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .pms-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); padding: 7px 14px; border-radius: 20px; font-family: 'Inter', sans-serif; font-size: 13px; cursor: pointer; }
        .pms-trending { display: flex; flex-direction: column; gap: 2px; }
        .pms-trending-item { display: flex; align-items: center; gap: 12px; background: none; border: none; color: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; text-align: left; }
        .pms-trending-item:active { background: rgba(255,255,255,0.03); }
        .pms-trending-item svg { color: var(--accent); }
        .pms-results { padding: 16px; }
        .pms-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; text-align: center; }
        .pms-empty p { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.5); margin: 0; }
        .pms-list { display: flex; flex-direction: column; gap: 10px; }
        .pms-card { display: flex; gap: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; overflow: hidden; cursor: pointer; }
        .pms-card:active { background: rgba(255,255,255,0.04); }
        .pms-card img { width: 70px; height: 100px; object-fit: cover; flex-shrink: 0; }
        .pms-info { flex: 1; padding: 10px 10px 10px 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; overflow: hidden; }
        .pms-type { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; color: var(--accent); letter-spacing: 1px; background: rgba(0,122,255,0.08); padding: 2px 6px; border-radius: 4px; align-self: flex-start; }
        .pms-info h4 { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: white; margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pms-meta { display: flex; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.4); }
        .pms-rating { color: #FFB400; font-weight: 600; display: flex; align-items: center; gap: 3px; }
        .pms-skeleton { display: flex; gap: 12px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.02); }
        .pms-sk-img { width: 70px; height: 100px; border-radius: 8px; background: rgba(255,255,255,0.03); flex-shrink: 0; }
        .pms-sk-info { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
        .pms-sk-line { height: 10px; border-radius: 5px; background: rgba(255,255,255,0.03); }
        .w60 { width: 60%; } .w40 { width: 40%; }
        .pms-load-more { width: 100%; margin-top: 20px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; }
      `}</style>
    </div>
  );
}
