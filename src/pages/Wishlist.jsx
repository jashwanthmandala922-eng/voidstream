import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWishlist, removeFromWishlist, clearWishlist
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ContentCard from '../components/cards/ContentCard';

// Count-up hook
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(t); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return value;
}

function StatCard({ label, value, color = 'var(--accent)' }) {
  const count = useCountUp(value);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
      padding: '24px', flex: 1, minWidth: '160px',
      borderRadius: '20px', textAlign: 'center', backdropFilter: 'blur(10px)',
      boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '36px', color: 'var(--white)', marginBottom: '8px', letterSpacing: '-1px' }}>
        {count}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ width: '20px', height: '2px', background: color, margin: '12px auto 0', borderRadius: '1px' }} />
    </div>
  );
}

export default function Wishlist() {
  const { isGuest } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [wishlist,   setWishlist]   = useState([]);
  const [filter,     setFilter]     = useState('ALL');
  const [sort,       setSort]       = useState('dateAdded');
  const [removing,   setRemoving]   = useState(new Set());
  const [showModal,  setShowModal]  = useState(false);

  const refetch = useCallback(async () => {
    const data = await getWishlist();
    setWishlist(data);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filtered = (wishlist || [])
    .filter(i => filter === 'ALL' || i.type?.toUpperCase() === filter.toLowerCase() ||
      (filter === 'SERIES' && i.type === 'tv'))
    .sort((a, b) => {
      if (sort === 'title')     return (a.title || '').localeCompare(b.title || '');
      if (sort === 'rating')    return (b.rating || 0) - (a.rating || 0);
      return (b.addedAt || 0) - (a.addedAt || 0);
    });

  const counts = {
    total:  wishlist.length,
    movies: wishlist.filter(i => i.type === 'movie').length,
    series: wishlist.filter(i => i.type === 'tv' || i.type === 'series').length,
    anime:  wishlist.filter(i => i.type === 'anime').length
  };

  const handleRemove = async (id, type) => {
    setRemoving(prev => new Set([...prev, `${id}_${type}`]));
    await new Promise(r => setTimeout(r, 400));
    await removeFromWishlist(id, type);
    await refetch();
    setRemoving(prev => { const s = new Set(prev); s.delete(`${id}_${type}`); return s; });
    addToast('Removed from Watchlist', 'info');
  };

  const handleClearAll = async () => {
    await clearWishlist();
    await refetch();
    setShowModal(false);
    addToast('Watchlist cleared successfully', 'warning');
  };

  const FILTERS = ['ALL', 'MOVIES', 'SERIES', 'ANIME'];
  const SORTS   = [
    { v: 'dateAdded', l: 'Date Added' },
    { v: 'title',     l: 'Title' },
    { v: 'rating',    l: 'Rating' }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: 'calc(var(--nav-h) + 64px) var(--page-x) 140px' }}>
      <style>{`
        @keyframes cardFadeOut {
          to { opacity: 0; transform: scale(0.9) translateY(10px); }
        }
        .wishlist-card-exit { animation: cardFadeOut 0.4s forwards cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ 
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 6vw, 36px)', 
          color: 'var(--white)', letterSpacing: '-0.5px' 
        }}>
          My Watchlist
        </h1>
        <div style={{ width: '40px', height: '4px', background: 'var(--accent)', borderRadius: '2px', marginTop: '12px' }} />
      </div>

      {/* GUEST BANNER */}
      {isGuest && (
        <div style={{
          background: 'rgba(255,180,0,0.05)', border: '1px solid rgba(255,180,0,0.2)',
          padding: '12px 20px', marginBottom: '32px', borderRadius: '12px',
          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#FFB400',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45L20.27 19H3.73L12 5.45zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg>
          Guest Mode: Your watchlist is only saved on this device.
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        <StatCard label="Total Items"  value={counts.total} />
        <StatCard label="Movies"       value={counts.movies} color="var(--white)"  />
        <StatCard label="TV Series"    value={counts.series} color="var(--accent)" />
        <StatCard label="Anime"        value={counts.anime}  color="#FFB400"      />
      </div>

      {/* CONTROLS */}
      {wishlist.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background:  filter === f ? 'var(--white)' : 'transparent',
                color:       filter === f ? 'var(--black)' : 'var(--white)',
                fontFamily:  "'Inter', sans-serif", fontWeight: 600, fontSize: '12px',
                padding:     '8px 20px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '24px'
              }}>{f}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
              color: 'var(--white)', padding: '10px 20px', borderRadius: '20px', fontSize: '13px',
              fontWeight: 600, outline: 'none', cursor: 'pointer'
            }}>
              {SORTS.map(s => <option key={s.v} value={s.v} style={{ background: '#111' }}>Sort by: {s.l}</option>)}
            </select>
            
            <button onClick={() => setShowModal(true)} style={{
              background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)',
              color: '#ff4444', fontFamily: "'Inter', sans-serif", fontSize: '12px',
              padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600
            }}>Clear All</button>
          </div>
        </div>
      )}

      {/* LIST */}
      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.2 }}>🔖</div>
          <p style={{ fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px', marginBottom: '32px' }}>
            Your watchlist is empty. Add titles to see them here.
          </p>
          <button onClick={() => navigate('/movies')} style={{
            background: 'var(--white)', color: 'var(--black)',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '14px', 
            padding: '14px 36px', borderRadius: '30px', cursor: 'pointer'
          }}>
            Browse Content
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-w, 200px), 1fr))', gap: 'clamp(16px, 3vw, 32px)', justifyContent: 'center' }}>
          {filtered.map(item => {
            const key   = `${item.id}_${item.type}`;
            const isRem = removing.has(key);
            return (
              <div key={key} className={isRem ? 'wishlist-card-exit' : ''} style={{ position: 'relative' }}>
                <ContentCard item={{ ...item, _type: item.type }} />
                <button
                  onClick={() => handleRemove(item.id, item.type)}
                  style={{
                    position:   'absolute', top: '12px', right: '12px',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                    border:     '1px solid rgba(255,255,255,0.1)',
                    color:      'var(--white)', width: '32px', height: '32px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize:   '16px', cursor: 'pointer', zIndex: 10,
                    transition: 'all 0.2s', padding: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.borderColor = '#ff4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{
            background: '#111', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔖</div>
            <h3 style={{ fontFamily: "'Outfit'", fontSize: '24px', color: 'var(--white)', marginBottom: '12px' }}>Clear Watchlist?</h3>
            <p style={{ fontFamily: "'Inter'", color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              This will permanently remove all <strong>{counts.total} items</strong> from your watchlist. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'var(--white)', padding: '14px', borderRadius: '16px', fontWeight: 600, cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleClearAll} style={{
                flex: 1, background: '#ff4444', color: '#fff', border: 'none',
                padding: '14px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer'
              }}>Clear Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
