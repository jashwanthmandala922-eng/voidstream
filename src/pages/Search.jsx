import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAll, img } from '../services/tmdbService';
import MobileSearch from './MobileSearch';
import { useIsMobile } from '../hooks/useResponsive';

function SearchListItem({ item }) {
  const navigate = useNavigate();
  const route = item.media_type === 'movie' ? '/movie' : '/series';
  
  return (
    <div
      onClick={() => navigate(`${route}/${item.id}`)}
      style={{
        display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border)',
        cursor: 'pointer', overflow: 'hidden', height: '140px',
        borderRadius: '8px', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <img
        src={img(item.poster_path, 'w185')}
        alt={item.title || item.name}
        style={{ width: '92px', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            background: 'var(--accent)', color: 'var(--white)',
            fontSize: '9px', fontWeight: 900, padding: '3px 8px', 
            fontFamily: "'Montserrat', sans-serif", borderRadius: '4px',
            letterSpacing: '1px'
          }}>
            {item.media_type === 'movie' ? 'MOVIE' : 'SERIES'}
          </div>
          <div style={{ 
            fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '18px', 
            color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.title || item.name}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: 'var(--dim)' }}>
          <span style={{ color: 'var(--accent)' }}>★ {item.vote_average?.toFixed(1) || 'N/A'}</span>
          <span>{((item.release_date || item.first_air_date) || '').split('-')[0]}</span>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const navigate = useNavigate();
  const searchQ = searchParams.get('q') || '';
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    if (isMobile || !searchQ) {
      setItems([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await searchAll(searchQ, page);
      const mediaResults = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
      if (page === 1) setItems(mediaResults);
      else setItems(prev => [...prev, ...mediaResults]);
      setTotalPgs(Math.min(data.total_pages || 1, 500));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, searchQ]);

  useEffect(() => { setPage(1); }, [searchQ]);
  useEffect(() => { fetchData(); }, [fetchData, isMobile]);

  if (isMobile) {
    return <MobileSearch />;
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'calc(var(--nav-h, 60px) + 64px) var(--page-x, 5vw) 120px' }}>
      
      <div style={{ 
        maxWidth: '1000px', margin: '0 auto', textAlign: 'center',
        paddingBottom: '80px', borderBottom: '1px solid var(--border)'
      }}>
        <div className="letter-spaced" style={{ marginBottom: '16px', opacity: 0.5 }}>T Y P E  T O  F I N D</div>
        <input
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') navigate(`/search?q=${encodeURIComponent(e.target.value)}`); }}
          defaultValue={searchQ}
          placeholder="SEARCH ANYTHING..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: "'Montserrat', sans-serif", fontWeight: 950,
            fontSize: 'clamp(32px, 8vw, 72px)', color: 'var(--white)',
            textAlign: 'center', width: '100%', letterSpacing: '-2px'
          }}
        />
      </div>

      {!searchQ && (
        <div style={{ textAlign: 'center', paddingTop: '100px', fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px' }}>
          Explore movies and shows by typing in the search bar above.
        </div>
      )}

      {searchQ && items.length === 0 && !loading && (
        <div style={{ textAlign: 'center', paddingTop: '100px', fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px' }}>
          No matches found for "{searchQ}".
        </div>
      )}

      {searchQ && (items.length > 0 || loading) && (
        <div style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {items.map(item => (
              <SearchListItem key={`${item.id}-${item.media_type}`} item={item} />
            ))}
            {loading && Array(4).fill(null).map((_, i) => (
              <div key={i} style={{
                height: '140px', background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px', border: '1px solid var(--border)',
                animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%',
                backgroundImage: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)'
              }} />
            ))}
          </div>

          {!loading && page < totalPgs && (
            <div style={{ textAlign: 'center', marginTop: '64px' }}>
              <button
                onClick={() => setPage(p => p + 1)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                  color: 'var(--white)', fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800, fontSize: '15px', padding: '16px 48px', cursor: 'pointer',
                  borderRadius: '32px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#fff'; e.target.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--white)'; e.target.style.transform = 'scale(1)'; }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
