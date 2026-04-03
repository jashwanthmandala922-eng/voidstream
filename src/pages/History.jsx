import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHistory, removeFromHistory, clearHistory, exportHistory
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)   return 'Just Now';
  if (min < 60)  return `${min}m ago`;
  if (hr  < 24)  return `${hr}h ago`;
  if (day < 7)   return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function groupByDate(items) {
  const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Earlier': [] };
  const now = Date.now();
  items.forEach(item => {
    const diff = now - (item.watchedAt || 0);
    if (diff < 86400000)       groups['Today'].push(item);
    else if (diff < 172800000) groups['Yesterday'].push(item);
    else if (diff < 604800000) groups['This Week'].push(item);
    else                       groups['Earlier'].push(item);
  });
  return groups;
}

function calcStreak(history) {
  if (!history.length) return 0;
  const days = new Set(history.map(h => {
    const d = new Date(h.watchedAt);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function History() {
  const { isGuest } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [history,   setHistory]   = useState([]);
  const [view,      setView]      = useState('grid'); 
  const [removing,  setRemoving]  = useState(new Set());
  const [showModal, setShowModal] = useState(false);

  const refetch = useCallback(async () => {
    const data = await getHistory();
    setHistory(data);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const thisWeek = history.filter(h => Date.now() - (h.watchedAt || 0) < 604800000);
  const hours    = Math.round(history.length * 1.8);
  const streak   = calcStreak(history);

  const handleRemove = async (id, type) => {
    const key = `${id}_${type}`;
    setRemoving(prev => new Set([...prev, key]));
    // Brief animation delay
    await new Promise(r => setTimeout(r, 400));
    await removeFromHistory(id, type);
    await refetch();
    setRemoving(prev => { const s = new Set(prev); s.delete(key); return s; });
    addToast('Removed from history', 'info');
  };

  const handleClearAll = async () => {
    await clearHistory();
    await refetch();
    setShowModal(false);
    addToast('History cleared successfully', 'warning');
  };

  const grouped = groupByDate(history);

  return (
    <div style={{ minHeight: '100vh', padding: 'calc(var(--nav-h) + 64px) var(--page-x) 140px' }}>
      <style>{`
        @keyframes cardFadeOut {
          to { opacity: 0; transform: scale(0.9) translateY(10px); }
        }
        .history-card-exit { animation: cardFadeOut 0.4s forwards cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ 
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 6vw, 36px)', 
          color: 'var(--white)', letterSpacing: '-0.5px' 
        }}>
          Watch History
        </h1>
        <div style={{ width: '40px', height: '4px', background: 'var(--accent)', borderRadius: '2px', marginTop: '12px' }} />
      </div>

      {isGuest && (
        <div style={{
          background: 'rgba(255,180,0,0.05)', border: '1px solid rgba(255,180,0,0.2)',
          padding: '12px 20px', marginBottom: '32px', borderRadius: '12px',
          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#FFB400',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45L20.27 19H3.73L12 5.45zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg>
          Guest Mode: Viewing history is only saved on this device.
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        <StatCard label="Total Watched" value={history.length} />
        <StatCard label="Recent (7d)"   value={thisWeek.length} color="var(--white)" />
        <StatCard label="Watch Time (h)" value={hours}           color="var(--accent)" />
        <StatCard label="Current Streak" value={streak}          color="#FFB400" />
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.2 }}>🎬</div>
          <p style={{ fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px', marginBottom: '32px' }}>
            Your history is empty. Start exploring to keep track of your journey.
          </p>
          <button onClick={() => navigate('/')} style={{
            background: 'var(--white)', color: 'var(--black)',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '14px', 
            padding: '14px 36px', borderRadius: '30px', cursor: 'pointer'
          }}>
            Browse Content
          </button>
        </div>
      ) : (
        <>
          {/* CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
              {[['grid', 'Grid'], ['timeline', 'Timeline']].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)} style={{
                  background:  view === v ? 'var(--white)' : 'transparent',
                  color:       view === v ? 'var(--black)' : 'var(--white)',
                  fontFamily:  "'Inter', sans-serif", fontWeight: 600, fontSize: '12px',
                  padding:     '8px 20px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '24px'
                }}>{l}</button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={exportHistory} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '12px',
                padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600
              }}>Export Data</button>
              <button onClick={() => setShowModal(true)} style={{
                background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)',
                color: '#ff4444', fontFamily: "'Inter', sans-serif", fontSize: '12px',
                padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600
              }}>Clear All</button>
            </div>
          </div>

          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
              {history.map((item) => {
                const key   = `${item.id}_${item.type}`;
                const isRem = removing.has(key);
                return (
                  <div key={key} className={isRem ? 'history-card-exit' : ''} style={{ position: 'relative' }}>
                    <div style={{
                      background:  'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                      borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                      transition:  'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      onClick={() => navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`)}
                    >
                      <img src={item.poster} alt={item.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                      
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${item.progress || 10}%`, background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                      </div>

                      <div style={{ padding: '16px' }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--white)', marginBottom: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        {item.episode && (
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '8px' }}>
                            Season {item.season} • Episode {item.episode}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                            {relativeTime(item.watchedAt)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleRemove(item.id, item.type); }}
                            style={{
                              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                              color: 'rgba(255,255,255,0.4)', fontSize: '10px', padding: '4px 8px',
                              cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.target.style.background = 'rgba(255,0,0,0.1)'; e.target.style.color = '#ff4444'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'rgba(255,255,255,0.4)'; }}
                          >Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '48px' }}>
              {/* TIMELINE STEM */}
              <div style={{
                position:   'absolute', left: '20px', top: '10px', bottom: '10px',
                width:      '2px', background: 'linear-gradient(to bottom, var(--accent), transparent)',
                borderRadius: '1px'
              }} />

              {Object.entries(grouped).map(([label, items]) =>
                items.length === 0 ? null : (
                  <div key={label} style={{ marginBottom: '48px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      marginBottom: '24px', position: 'relative'
                    }}>
                      <div style={{ position: 'absolute', left: '-33px', width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%', border: '4px solid #000' }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--white)' }}>
                        {label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {items.map((item, i) => (
                        <div key={`${item.id}-${i}`} style={{
                          display: 'flex', gap: '20px', padding: '12px',
                          borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--glass-border)', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onClick={() => navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`)}
                        >
                          <img src={item.poster} alt="" style={{ width: '56px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--white)', marginBottom: '4px' }}>
                              {item.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 500 }}>
                              {item.episode && <span>S{item.season}E{item.episode}</span>}
                              <span>{relativeTime(item.watchedAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* CONFIRM MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{
            background: '#111', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🗑️</div>
            <h3 style={{ fontFamily: "'Outfit'", fontSize: '24px', color: 'var(--white)', marginBottom: '12px' }}>Clear History?</h3>
            <p style={{ fontFamily: "'Inter'", color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
              This will permanently delete your viewing history of <strong>{history.length} items</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'var(--white)', padding: '14px', borderRadius: '16px', fontWeight: 600, cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleClearAll} style={{
                flex: 1, background: '#ff4444', color: '#fff', border: 'none',
                padding: '14px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer'
              }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
