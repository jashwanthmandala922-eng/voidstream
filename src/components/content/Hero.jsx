import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { img } from '../../services/tmdbService';
import { addToWishlist, removeFromWishlist, getSettings } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { Play, Plus } from 'lucide-react';
import './Hero.css';

export default function Hero({ items }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const settings = getSettings();
  const isHotstar = settings.uiTheme === 'hotstar';

  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const DURATION = 8000;

  useEffect(() => {
    if (!items?.length) return;
    
    const slideTimer = setInterval(() => {
      setIdx(i => (i + 1) % Math.min(6, items.length));
      setProgress(0);
    }, DURATION);

    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(100, p + (100 / (DURATION / 50))));
    }, 50);

    return () => {
      clearInterval(slideTimer);
      clearInterval(progressTimer);
    };
  }, [items, idx]);

  if (!items?.length) return null;

  const item  = items[idx];
  const title = item.title || item.name;
  const year  = (item.release_date || item.first_air_date || '').split('-')[0];
  const type  = item.media_type || (item.title ? 'movie' : 'tv');
  const route = type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;

  const handleWatchlist = (e) => {
    e.stopPropagation();
    const data = { id: item.id, type, title, poster: img(item.poster_path), rating: item.vote_average, year };
    if (addToWishlist(data)) {
      addToast('> ADDED TO WATCHLIST ✓', 'success');
    } else {
      removeFromWishlist(item.id, type);
      addToast('> REMOVED FROM WATCHLIST', 'info');
    }
  };

  return (
    <div className={`hero-root ${isHotstar ? 'hotstar-billboard' : 'cineby-hero'}`}>
      {/* BACKDROP IMAGE */}
      <div className="hero-backdrop-container">
        <img 
          src={img(item.backdrop_path, 'original')} 
          alt="" 
          className="hero-backdrop-img"
          key={item.backdrop_path}
        />
        <div className="hero-vignette" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="hero-content">
        <div className="hero-meta">
          <span className="hero-type-badge">
            {type === 'movie' ? 'Movie' : 'Series'} • {year} • {item.original_language?.toUpperCase()}
          </span>
          
          <h1 className="hero-title">{title}</h1>
          
          <div className="hero-stats">
            <div className="hero-rating">
              <span className="star">★</span> {item.vote_average?.toFixed(1)}
            </div>
            <span className="hero-genre-list">Action • Sci-Fi • Adventure</span>
          </div>

          <p className="hero-overview">{item.overview}</p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate(route)}>
              <Play size={24} fill="currentColor" />
              <span>Watch Now</span>
            </button>
            <button className="btn-secondary" onClick={handleWatchlist}>
              <Plus size={24} />
              <span>Watchlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* THUMBNAIL NAVIGATION (Hotstar Signature) */}
      {isHotstar && (
        <div className="hero-thumbnails">
          {items.slice(0, 6).map((thumb, i) => (
            <div 
              key={thumb.id}
              className={`hero-thumb-item ${i === idx ? 'active' : ''}`}
              onClick={() => { setIdx(i); setProgress(0); }}
            >
              <img src={img(thumb.backdrop_path, 'w300')} alt="" />
              {i === idx && (
                <div className="thumb-progress">
                  <div className="thumb-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROGRESS BAR (Bottom - Cineby style indicator) */}
      {!isHotstar && (
        <div className="hero-bottom-progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
