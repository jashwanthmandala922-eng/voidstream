import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTrending, getPopMovies, getPopSeries,
  getAnime, getNowPlaying, getTopRated
} from '../services/tmdbService';
import { getHistory } from '../services/storageService';

import ContentCard from '../components/cards/ContentCard';
import Hero from '../components/content/Hero';
import { useAuth } from '../context/AuthContext';

// ── CONTENT ROW ───────────────────────────────────────────────────
function ContentRow({ title, items, type, loading: rowLoading }) {
  const skeletons = Array(8).fill(null);
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      setTimeout(checkScroll, 500);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [items, rowLoading]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const cw = scrollRef.current.clientWidth * 0.9;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cw : cw, behavior: 'smooth' });
  };

  return (
    <section style={{ marginBottom: '64px' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px',
        marginBottom: '32px', paddingLeft: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'var(--accent)', boxShadow: 'var(--glow-sm)' }} />
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
            fontSize: '24px', color: 'var(--white)',
            letterSpacing: '1px'
          }}>
            {title}
          </h2>
        </div>
        <div className="letter-spaced" style={{ marginLeft: '16px' }}>T O D A Y</div>
      </div>

      {/* PHYSICAL THREE-COLUMN LAYOUT */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'stretch', 
        position: 'relative',
        minHeight: '280px'
      }}>
        {/* LEFT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showLeft ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderRight: showLeft ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {!rowLoading && items?.length > 4 && (
            <button
              onClick={() => scroll('left')}
              className="nav-arrow-shield"
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                opacity: showLeft ? 1 : 0,
                pointerEvents: showLeft ? 'auto' : 'none',
                boxShadow: showLeft ? '0 0 20px rgba(0,0,0,0.5)' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
        </div>

        {/* CENTRAL SCROLL ZONE */}
        <div style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
          <div className="scroll-row" ref={scrollRef} style={{ padding: '40px 0' }}>
            {rowLoading
              ? skeletons.map((_, i) => <SkeletonCard key={i} />)
              : (items || []).map(item => (
                <ContentCard
                  key={item.id}
                  item={{ ...item, _type: type || item.media_type || (item.title ? 'movie' : 'tv') }}
                />
              ))
            }
          </div>
        </div>

        {/* RIGHT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showRight ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeft: showRight ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {!rowLoading && items?.length > 4 && (
            <button
              onClick={() => scroll('right')}
              className="nav-arrow-shield"
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: showRight ? 1 : 0,
                pointerEvents: showRight ? 'auto' : 'none',
                boxShadow: showRight ? '0 0 20px rgba(0,0,0,0.5)' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── TOP 10 ROW ────────────────────────────────────────────────────
function Top10Row({ items, loading }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      setTimeout(checkScroll, 500);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [items, loading]);
  
  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '40px', paddingLeft: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'var(--accent)' }} />
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '24px', color: 'var(--white)' }}>
            TOP 10
          </h2>
        </div>
        <div className="letter-spaced" style={{ marginLeft: '16px' }}>C O N T E N T</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', minHeight: '340px' }}>
        {/* LEFT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showLeft ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderRight: showLeft ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {items?.length > 4 && (
            <button
              onClick={() => {
                if (scrollRef.current) {
                  const cw = scrollRef.current.clientWidth * 0.9;
                  scrollRef.current.scrollBy({ left: -cw, behavior: 'smooth' });
                }
              }}
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                opacity: showLeft ? 1 : 0,
                pointerEvents: showLeft ? 'auto' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
        </div>

        {/* CENTRAL SCROLL ZONE */}
        <div style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
          <div className="scroll-row" ref={scrollRef} style={{ paddingBottom: '40px' }}>
            {items?.slice(0, 10).map((item, i) => (
              <div key={item.item_id || item.id} style={{ position: 'relative', flexShrink: 0 }}>
                <div className="outline-text" style={{
                  position: 'absolute', left: '-40px', bottom: '-10px',
                  fontSize: '180px', zIndex: 0, opacity: 0.8,
                  pointerEvents: 'none'
                }}>
                  {i + 1}
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <ContentCard item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showRight ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeft: showRight ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {items?.length > 4 && (
            <button
              onClick={() => {
                if (scrollRef.current) {
                  const cw = scrollRef.current.clientWidth * 0.9;
                  scrollRef.current.scrollBy({ left: cw, behavior: 'smooth' });
                }
              }}
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: showRight ? 1 : 0,
                pointerEvents: showRight ? 'auto' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      width: 'var(--card-w, 200px)', aspectRatio: '2/3', flexShrink: 0,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite linear',
      borderRadius: '12px'
    }} />
  );
}

// ── BRAND CARDS ──────────────────────────────────────────────────
/*
function BrandCards() {
  const brands = [
    { name: 'disney',   img: 'https://placehold.co/400x225/000814/white?text=DISNEY+' },
    { name: 'pixar',    img: 'https://placehold.co/400x225/001D3D/white?text=PIXAR' },
    { name: 'marvel',   img: 'https://placehold.co/400x225/C1121F/white?text=MARVEL' },
    { name: 'starwars', img: 'https://placehold.co/400x225/000000/white?text=STAR+WARS' },
    { name: 'natgeo',   img: 'https://placehold.co/400x225/FFC300/black?text=NAT+GEO' }
  ];

  if (getSettings().uiTheme !== 'hotstar') return null;

  return (
    <div style={{ display: 'flex', gap: '16px', margin: '40px 0', overflowX: 'auto', paddingBottom: '20px' }}>
      {brands.map(b => (
        <div key={b.name} className="brand-card" style={{
          flex: 1, minWidth: '160px', aspectRatio: '16/9', borderRadius: '10px',
          overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          background: '#1a1c22', position: 'relative', transition: 'all 0.3s ease'
        }}>
          <img src={b.img} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
      <style>{`.brand-card:hover { transform: scale(1.05); border-color: var(--white); box-shadow: 0 10px 40px rgba(0,0,0,0.8); }`}</style>
    </div>
  );
}
*/


// ── CONTINUE WATCHING ROW ─────────────────────────────────────────
function ContinueWatchingRow({ history, setHistory }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  useAuth();

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Filter out completely watched items (if we correctly set progress to 100 later)
  const activeHistory = history.filter(item => item.progress !== 100);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      setTimeout(checkScroll, 500);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [history]);

  if (!activeHistory.length) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const cw = scrollRef.current.clientWidth * 0.9;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cw : cw, behavior: 'smooth' });
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();
    import('../services/storageService').then(({ removeFromHistory }) => {
      removeFromHistory(item.id, item.type);
      setHistory(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
    });
  };

  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingLeft: '60px' }}>
        <div style={{ width: '3px', height: '24px', background: 'var(--cyan)', boxShadow: '0 0 12px var(--cyan)' }} />
        <h2 style={{
          fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--white)', letterSpacing: '0.5px'
        }}>
          CONTINUE WATCHING
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', minHeight: '240px' }}>
        {/* LEFT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showLeft ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderRight: showLeft ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {activeHistory.length > 0 && (
            <button
              onClick={() => scroll('left')}
              className="nav-arrow-shield"
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                opacity: showLeft ? 1 : 0,
                pointerEvents: showLeft ? 'auto' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
        </div>

        {/* CENTRAL SCROLL ZONE */}
        <div style={{ flex: 1, overflow: 'visible', position: 'relative' }}>
          <div className="scroll-row" ref={scrollRef} style={{ padding: '20px 0' }}>
            {activeHistory.map(item => (
              <div
                key={`${item.id}-${item.season}-${item.episode}`}
                className="clip-md"
                style={{
                  width: 'var(--card-w, 200px)', flexShrink: 0, position: 'relative',
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  cursor: 'pointer', overflow: 'hidden',
                  transition: 'all 0.2s',
                  aspectRatio: '16/10',
                  display: 'flex', flexDirection: 'column'
                }}
                onClick={() => navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`)}
              >
                <button
                  onClick={(e) => handleRemove(e, item)}
                  style={{
                    position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                    background: 'rgba(0,0,0,0.6)', border: '1px solid var(--dim)', color: 'var(--dim)',
                    width: '24px', height: '24px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '10px'
                  }}
                >
                  ✕
                </button>
                <img src={item.poster} alt={item.title} style={{ width: '100%', flex: 1, objectFit: 'cover' }} />
                <div style={{ height: '3px', background: 'rgba(0,212,255,0.2)' }}>
                  <div style={{ height: '100%', background: 'var(--cyan)', width: `${item.progress || 5}%`, boxShadow: '0 0 6px var(--cyan)' }} />
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.85)' }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '12px', color: 'var(--white)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: 'var(--cyan)' }}>▶ RESUME</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT ARROW COLUMN - THE NAVIGATION PILLAR */}
        <div style={{ 
          width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          background: showRight ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderLeft: showRight ? '1px solid rgba(255,255,255,0.1)' : 'none',
          transition: 'all 0.3s'
        }}>
          {activeHistory.length > 0 && (
            <button
              onClick={() => scroll('right')}
              className="nav-arrow-shield"
              style={{
                width: '48px', height: '120px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: showRight ? 1 : 0,
                pointerEvents: showRight ? 'auto' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState({
    trending: [], movies: [], series: [], anime: [], nowPlaying: [], topRated: []
  });
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory().then(setHistory).catch(e => console.error(e));

    Promise.all([
      getTrending(), getPopMovies(), getPopSeries(),
      getAnime(), getNowPlaying(), getTopRated()
    ]).then(([tr, mv, sv, an, np, tp]) => {
      setData({
        trending: tr.results || [], movies: mv.results || [],
        series: sv.results || [], anime: an.results || [],
        nowPlaying: np.results || [], topRated: tp.results || []
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Hero items={data.trending} />
      <div style={{ padding: '0 var(--page-x, 8vw) 80px' }}>
        <ContinueWatchingRow history={history} setHistory={setHistory} />
        <Top10Row items={data.trending} loading={loading} />
        <ContentRow title="TRENDING"            items={data.trending}   loading={loading} />
        <ContentRow title="IN THEATERS"         items={data.nowPlaying} type="movie" loading={loading} />
        <ContentRow title="POPULAR MOVIES"       items={data.movies}     type="movie" loading={loading} />
        <ContentRow title="LATEST SERIES"       items={data.series}     type="tv"    loading={loading} />
        <ContentRow title="ANIME COLLECTION"     items={data.anime}      type="anime" loading={loading} />
        <ContentRow title="MASTERPIECES"        items={data.topRated}   type="movie" loading={loading} />
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
