import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending, getPopMovies, getPopSeries, getOnTheAir, getAnime, getNowPlaying, getTopRated } from '../services/tmdbService';
import { getHistory } from '../services/storageService';
import ContentCard from '../components/cards/ContentCard';
import Hero from '../components/content/Hero';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

function ContentRow({ title, items, type, loading: rowLoading }) {
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
    const cw = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cw : cw, behavior: 'smooth' });
  };

  return (
    <section className="premium-row">
      <div className="premium-row-header">
        <h2>{title}</h2>
      </div>

      <div className="premium-row-body">
        <div className={`premium-row-arrow premium-row-arrow-left ${showLeft ? 'visible' : ''}`} onClick={() => scroll('left')}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </div>

        <div className="premium-row-scroll-wrap">
          <div className="premium-row-scroll" ref={scrollRef}>
            {rowLoading
              ? Array(6).fill(null).map((_, i) => <div key={i} className="premium-skeleton-card" />)
              : (items || []).map(item => (
                  <ContentCard
                    key={item.id}
                    item={{ ...item, _type: type || item.media_type || (item.title ? 'movie' : 'tv'), media_type: item.media_type || type || (item.title ? 'movie' : 'tv') }}
                  />
                ))
            }
          </div>
        </div>

        <div className={`premium-row-arrow premium-row-arrow-right ${showRight ? 'visible' : ''}`} onClick={() => scroll('right')}>
          <ChevronRight size={24} strokeWidth={2.5} />
        </div>
      </div>
    </section>
  );
}

function ContinueWatchingRow({ history, setHistory }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const activeHistory = history.filter(item => item.progress !== 100);
  if (!activeHistory.length) return null;

  const handleRemove = (e, item) => {
    e.stopPropagation();
    import('../services/storageService').then(({ removeFromHistory }) => {
      removeFromHistory(item.id, item.type);
      setHistory(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
    });
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--rx', `${y * -20}deg`);
    card.style.setProperty('--ry', `${x * 20}deg`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <section className="premium-row">
      <div className="premium-row-header">
        <h2>Continue Watching</h2>
      </div>
      <div className="premium-cw-scroll" ref={scrollRef}>
        {activeHistory.map(item => (
          <div
            key={`${item.id}-${item.season}-${item.episode}`}
            className="premium-cw-card"
            onClick={() => navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="premium-cw-img">
              <img src={item.poster} alt={item.title} />
              <div className="premium-cw-play"><Play size={20} fill="white" /></div>
              <button className="premium-cw-remove" onClick={(e) => handleRemove(e, item)}>×</button>
            </div>
            <div className="premium-cw-info">
              <span className="premium-cw-title">{item.title}</span>
              <div className="premium-cw-track">
                <div className="premium-cw-fill" style={{ width: `${item.progress || 5}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Top10Row({ items, loading: rowLoading }) {
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
    const cw = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cw : cw, behavior: 'smooth' });
  };

  const top10 = (items || []).slice(0, 10);
  if (!top10.length && !rowLoading) return null;

  return (
    <section className="top10-section">
      <h2 className="top10-heading">TOP 10 CONTENT TODAY</h2>
      <div className="top10-container">
        <div className={`top10-arrow left ${showLeft ? 'visible' : ''}`} onClick={() => scroll('left')}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </div>
        
        <div className="top10-scroll" ref={scrollRef}>
          {rowLoading
            ? Array(10).fill(0).map((_, i) => (
                <div key={i} className="top10-item">
                  <div className="top10-number-skeleton" />
                  <div className="top10-card-skeleton" />
                </div>
              ))
            : top10.map((item, idx) => (
                  <div key={item.id} className="top10-item">
                    <span className="top10-rank">{idx + 1}</span>
                    <ContentCard item={{ ...item, _type: item.media_type || (item.title ? 'movie' : 'tv') }} />
                  </div>
                ))
          }
        </div>

        <div className={`top10-arrow right ${showRight ? 'visible' : ''}`} onClick={() => scroll('right')}>
          <ChevronRight size={24} strokeWidth={2.5} />
        </div>
      </div>

      <style jsx>{`
        .top10-section {
          padding: 48px 0 24px var(--page-x, 5vw);
          position: relative;
          z-index: 5;
          margin-bottom: 24px;
        }

        .top10-heading {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: white;
          letter-spacing: 2.5px;
          margin-bottom: 24px;
          opacity: 0.9;
        }

        .top10-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .top10-scroll {
          display: flex;
          gap: 60px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 80px 40px 40px 0;
          margin-top: -60px;
          scroll-behavior: smooth;
        }

        .top10-scroll::-webkit-scrollbar { display: none; }

        .top10-item {
          display: flex;
          align-items: center;
          position: relative;
          flex-shrink: 0;
        }

        .top10-rank {
          font-family: 'Georgia', serif;
          font-weight: 900;
          font-size: 160px;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 2px rgba(255, 255, 255, 0.4);
          margin-right: -45px;
          margin-top: 10px;
          letter-spacing: -10px;
          pointer-events: none;
          z-index: 10;
          user-select: none;
        }

        .top10-arrow, .premium-row-arrow {
          position: absolute;
          top: calc(50% + 40px); transform: translateY(-50%);
          width: 52px; height: 52px;
          background: rgba(10, 10, 10, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.8); opacity: 0; pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 999; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .top10-container:hover .top10-arrow.visible, .premium-row:hover .premium-row-arrow.visible {
          opacity: 1; pointer-events: auto;
        }

        .top10-arrow:hover, .premium-row-arrow:hover {
          background: rgba(10, 10, 10, 0.9);
          color: white; transform: translateY(-50%) scale(1.1);
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }

        .top10-arrow.left, .premium-row-arrow-left { left: 20px; }
        .top10-arrow.right, .premium-row-arrow-right { right: 20px; }

        @media (max-width: 768px) {
          .top10-rank { font-size: 100px; margin-right: -30px; letter-spacing: -5px; }
          .top10-scroll { gap: 32px; padding-right: 20px; }
          .top10-arrow, .premium-row-arrow { display: none; }
        }
      `}</style>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState({
    trending: [], movies: [], series: [], anime: [], nowPlaying: [], topRated: [], popSeries: []
  });
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory().then(setHistory).catch(e => console.error(e));

    async function fetchHomeData() {
      try {
        // Load trending first, then use it to dedupe movie/series fetches
        const tr = await getTrending();
        const trendingResults = tr.results || [];
        setData(prev => ({ ...prev, trending: trendingResults }));

        // Now fetch movies, series, and independent data
        const [mv, sv, an, np, tp, ps] = await Promise.all([
          getPopMovies().catch(err => { console.error('Failed to fetch popular movies:', err); return { results: [] }; }),
          getOnTheAir().catch(err => { console.error('Failed to fetch series:', err); return { results: [] }; }),
          getAnime().catch(err => { console.error('Failed to fetch anime:', err); return { results: [] }; }),
          getNowPlaying().catch(err => { console.error('Failed to fetch now playing:', err); return { results: [] }; }),
          getTopRated().catch(err => { console.error('Failed to fetch top rated:', err); return { results: [] }; }),
          getPopSeries().catch(err => { console.error('Failed to fetch popular series:', err); return { results: [] }; })
        ]);

        const filterItems = (items, type) => {
          const results = (items.results || []).filter(item => 
            !trendingResults.some(t => t.id === item.id && t.media_type === type)
          );
          return results.length < 10 ? (items.results || []) : results;
        };

        setData(prev => ({
          ...prev,
          movies: filterItems(mv, 'movie'), // Recommended Movies
          series: filterItems(sv, 'tv'),    // Latest Series
          popSeries: filterItems(ps, 'tv'), // Recommended Series
          anime: (an.results || []),
          nowPlaying: filterItems(np, 'movie'), // Latest Movies
          topRated: (tp.results || [])
        }));
      } catch (err) {
        console.error('Failed to fetch primary home data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  return (
    <div className="premium-home">
      <Hero items={data.trending} />
      <div className="premium-home-content">
        <ContinueWatchingRow history={history} setHistory={setHistory} />
        <Top10Row items={data.trending} loading={loading} />
        <ContentRow title="Latest Movies" items={data.nowPlaying} type="movie" loading={loading} />
        <ContentRow title="Latest Series" items={data.series} type="tv" loading={loading} />
        <ContentRow title="Recommended Movies" items={data.movies} type="movie" loading={loading} />
        <ContentRow title="Recommended Series" items={data.popSeries} type="tv" loading={loading} />
        <ContentRow title="Anime" items={data.anime} type="tv" loading={loading} />
        <ContentRow title="Top Rated" items={data.topRated} type="movie" loading={loading} />
      </div>

      <style>{`
        .premium-home {
          min-height: 100vh;
          background: var(--black);
        }

        .premium-home-content {
          padding: 0 var(--page-x, 5vw) 80px;
          margin-top: -80px;
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .premium-home-content { margin-top: -40px; gap: 10px; }
        }

        .premium-row {
          margin-bottom: 40px;
        }

        @media (max-width: 768px) {
          .premium-row { margin-bottom: 24px; }
        }

        .premium-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .premium-row-header h2 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 20px;
          color: var(--white);
          letter-spacing: -0.01em;
        }

        .premium-row-body {
          position: relative;
        }

        .premium-row-scroll-wrap {
          flex: 1;
          overflow: visible;
          position: relative;
        }

        .premium-row-scroll {
          display: flex;
          gap: clamp(16px, 3vw, 24px);
          overflow-x: auto;
          overflow-y: visible;
          padding: 150px 0 30px;
          margin-top: -120px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .premium-row-scroll::-webkit-scrollbar { display: none; }

        .premium-skeleton-card {
          flex-shrink: 0;
          width: var(--card-w);
          aspect-ratio: 2/3;
          border-radius: var(--radius);
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }

        .premium-cw-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 4px 0;
        }

        .premium-cw-scroll::-webkit-scrollbar { display: none; }

        .premium-cw-card {
          flex-shrink: 0;
          width: 300px;
          scroll-snap-align: start;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
        }

        .premium-cw-card:hover {
          transform: translateY(-8px) scale(1.04) perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          z-index: 10;
        }

        .premium-cw-img {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          transform-style: preserve-3d;
        }

        .premium-cw-card:hover .premium-cw-img {
          border-color: rgba(0, 122, 255, 0.8);
          box-shadow: 
            0 20px 50px rgba(0,0,0,0.8),
            0 0 35px rgba(0, 122, 255, 0.45),
            0 0 10px rgba(0, 122, 255, 0.3),
            0 0 0 2px rgba(0, 122, 255, 0.5);
        }

        .premium-cw-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .premium-cw-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .premium-cw-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .premium-cw-info {
          padding: 10px 2px;
        }

        .premium-cw-title {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.75);
          display: block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .premium-cw-track {
          height: 2px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 1px;
          margin-top: 8px;
          overflow: hidden;
        }

        .premium-cw-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 1px;
        }

      `}</style>
    </div>
  );
}
