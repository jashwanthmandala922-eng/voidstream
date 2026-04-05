import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '../components/cards/ContentCard';
import Hero from '../components/content/Hero';
import { useIsMobile } from '../hooks/useResponsive';
import { Play, Clock } from 'lucide-react';

function MobileContinueWatching({ history, setHistory }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const activeHistory = (history || []).filter(item => item.progress !== 100);
  if (!activeHistory.length) return null;

  const handleRemove = async (e, item) => {
    e.stopPropagation();
    const { removeFromHistory } = await import('../services/storageService');
    await removeFromHistory(item.id, item.type);
    setHistory(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
  };

  return (
    <section className="pmh-section">
      <div className="pmh-section-header">
        <Clock size={16} className="pmh-section-icon" />
        <h3>Continue Watching</h3>
      </div>
      <div className="pmh-cw-scroll" ref={scrollRef}>
        {activeHistory.map(item => (
          <div key={`${item.id}-${item.season}-${item.episode}`} className="pmh-cw-card" onClick={() => navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`)}>
            <div className="pmh-cw-img">
              <img src={item.poster} alt={item.title} />
              <div className="pmh-cw-play"><Play size={16} fill="white" /></div>
              <button className="pmh-cw-remove" onClick={(e) => handleRemove(e, item)}>×</button>
            </div>
            <div className="pmh-cw-info">
              <span className="pmh-cw-title">{item.title}</span>
              <div className="pmh-cw-track"><div className="pmh-cw-fill" style={{ width: `${item.progress || 5}%` }} /></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileContentRow({ title, items, type }) {
  const scrollRef = useRef(null);
  if (!items?.length) return null;
  return (
    <section className="pmh-section">
      <h3 className="pmh-section-title">{title}</h3>
      <div className="pmh-row-scroll" ref={scrollRef}>
        {items.map(item => (
          <ContentCard key={item.id} item={{ ...item, _type: type || item.media_type || (item.title ? 'movie' : 'tv'), media_type: item.media_type || type || (item.title ? 'movie' : 'tv') }} />
        ))}
      </div>
    </section>
  );
}

function MobileSkeletonRow() {
  return (
    <section className="pmh-section">
      <div className="pmh-skeleton-title" />
      <div className="pmh-skeleton-scroll">
        {Array(5).fill(null).map((_, i) => <div key={i} className="pmh-skeleton-card" />)}
      </div>
    </section>
  );
}

function MobileStudioLogos({ onNavigate }) {
  const studios = [
    { label: 'Hotstar Specials', color: '#007AFF' },
    { label: 'Disney+', color: '#0063e5' },
    { label: 'HBO', color: '#b535f6' },
    { label: 'Paramount', color: '#0064ff' },
    { label: 'Marvel', color: '#ed1d24' },
    { label: 'Pixar', color: '#00a3e0' },
    { label: 'Nat Geo', color: '#ffc300' },
  ];

  return (
    <section className="pmh-section">
      <h3 className="pmh-section-title">Studios</h3>
      <div className="pmh-studio-scroll">
        {studios.map(s => (
          <button key={s.label} className="pmh-studio-card" onClick={() => onNavigate(`/search?q=${encodeURIComponent(s.label)}`)}>
            <div className="pmh-studio-icon"><span style={{ color: s.color, fontSize: '10px', fontWeight: 600 }}>{s.label}</span></div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function MobileHome({ data, loading, history, setHistory }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  if (loading) {
    return (
      <div className="pmh-root" style={{ padding: '16px' }}>
        {Array(3).fill(null).map((_, i) => <MobileSkeletonRow key={i} />)}
        <style>{`
          .pmh-skeleton-title { width: 100px; height: 16px; border-radius: 8px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite linear; margin-bottom: 12px; }
          .pmh-skeleton-scroll { display: flex; gap: 10px; overflow: hidden; }
          .pmh-skeleton-card { flex-shrink: 0; width: var(--card-w, 140px); aspect-ratio: 2/3; border-radius: var(--radius); background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite linear; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pmh-root">
      <Hero items={data?.trending ?? []} />
      <div className="pmh-content">
        <MobileContinueWatching history={history} setHistory={setHistory} />
        {(data?.trending?.length > 0) && <MobileContentRow title="Trending Now" items={data.trending} />}
        {(data?.movies?.length > 0) && <MobileContentRow title="Popular Films" items={data.movies} type="movie" />}
        {(data?.series?.length > 0) && <MobileContentRow title="TV Shows" items={data.series} type="tv" />}
        {(data?.nowPlaying?.length > 0) && <MobileContentRow title="Now Playing" items={data.nowPlaying} type="movie" />}
        <MobileStudioLogos onNavigate={(path) => navigate(path)} />
        {(data?.anime?.length > 0) && <MobileContentRow title="Anime" items={data.anime} type="anime" />}
        <div style={{ height: '100px' }} />
      </div>

      <style>{`
        .pmh-root { background: var(--black); min-height: 100vh; }
        .pmh-content { position: relative; z-index: 10; padding: 20px 0 0 16px; }
        .pmh-section { margin-bottom: 28px; padding-right: 16px; }
        .pmh-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .pmh-section-icon { color: var(--accent); }
        .pmh-section-header h3, .pmh-section-title { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 16px; color: white; margin: 0; }
        .pmh-row-scroll, .pmh-cw-scroll, .pmh-studio-scroll { display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; padding: 4px 0; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
        .pmh-row-scroll::-webkit-scrollbar, .pmh-cw-scroll::-webkit-scrollbar, .pmh-studio-scroll::-webkit-scrollbar { display: none; }
        .pmh-cw-card { flex-shrink: 0; width: 260px; scroll-snap-align: start; cursor: pointer; }
        .pmh-cw-img { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; }
        .pmh-cw-img img { width: 100%; height: 100%; object-fit: cover; }
        .pmh-cw-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: white; border: 1px solid rgba(255,255,255,0.06); }
        .pmh-cw-remove { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .pmh-cw-info { padding: 8px 2px; }
        .pmh-cw-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.75); display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pmh-cw-track { height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; margin-top: 6px; overflow: hidden; }
        .pmh-cw-fill { height: 100%; background: var(--accent); border-radius: 1px; }
        .pmh-studio-card { flex-shrink: 0; background: none; border: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .pmh-studio-icon { width: 90px; height: 48px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; }
        .pmh-studio-card:active .pmh-studio-icon { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
