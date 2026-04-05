import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { img } from '../../services/tmdbService';
import { getSettings } from '../../services/storageService';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

export default function Hero({ items }) {
  const navigate = useNavigate();
  const settings = getSettings();
  const isHotstar = settings.uiTheme === 'hotstar';

  const [idx, setIdx] = useState(0);
  const DURATION = 8000;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoTimerRef = useRef(null);

  const resetAutoTimer = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % Math.min(6, items.length));
    }, DURATION);
  };

  useEffect(() => {
    if (!items?.length) return;
    autoTimerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % Math.min(6, items.length));
    }, DURATION);
    return () => { clearInterval(autoTimerRef.current); };
  }, [items]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      const max = Math.min(6, items.length);
      setIdx(i => diff > 0 ? (i + 1) % max : (i - 1 + max) % max);
      resetAutoTimer();
    }
  };

  const goNext = () => {
    setIdx(i => (i + 1) % Math.min(6, items.length));
    resetAutoTimer();
  };

  const goPrev = () => {
    const max = Math.min(6, items.length);
    setIdx(i => (i - 1 + max) % max);
    resetAutoTimer();
  };

  if (!items?.length) return null;

  const item = items[idx];
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const route = type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;

  return (
    <div
      className={`hero-root ${isHotstar ? 'hotstar-billboard' : 'cineby-hero'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* BACKDROP */}
      <div className="hero-backdrop-container">
        <img src={img(item.backdrop_path, 'original')} alt="" className="hero-backdrop-img" key={item.backdrop_path} />
        <div className="hero-vignette" />
      </div>

      {/* DESKTOP ARROWS */}
      {!isHotstar && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={goPrev} aria-label="Previous">
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <button className="hero-arrow hero-arrow-right" onClick={goNext} aria-label="Next">
            <ChevronRight size={28} strokeWidth={2} />
          </button>
        </>
      )}

      {/* CONTENT */}
      <div className="hero-content">
        <div className="hero-meta">
          <h1 className="hero-title">{title}</h1>

          <div className="hero-metadata">
            <div className="hero-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB400" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{item.vote_average ? item.vote_average.toFixed(1) : '—'}</span>
            </div>
            <span className="hero-meta-dot">&bull;</span>
            <span className="hero-year">{year}</span>
            <span className="hero-meta-dot">&bull;</span>
            <div className="hero-genres">
              {item.genre_ids?.slice(0, 2).map((gid, i) => (
                <span key={gid} className="hero-genre-tag">
                  {i > 0 && <span className="hero-genre-sep">, </span>}
                  {gid === 28 ? 'Action' : gid === 12 ? 'Adventure' : gid === 16 ? 'Animation' : gid === 35 ? 'Comedy' : gid === 80 ? 'Crime' : gid === 99 ? 'Doc' : gid === 18 ? 'Drama' : gid === 10751 ? 'Family' : gid === 14 ? 'Fantasy' : gid === 36 ? 'History' : gid === 27 ? 'Horror' : gid === 10402 ? 'Music' : gid === 9648 ? 'Mystery' : gid === 10749 ? 'Romance' : gid === 878 ? 'Sci-Fi' : gid === 53 ? 'Thriller' : gid === 10770 ? 'TV Movie' : gid === 10752 ? 'War' : gid === 37 ? 'Western' : gid === 10759 ? 'Action & Adv' : gid === 10762 ? 'Kids' : gid === 10765 ? 'Sci-Fi & Fan' : gid === 10766 ? 'Soap' : gid === 10767 ? 'Talk' : 'Genre'}
                </span>
              ))}
            </div>
          </div>

          <p className="hero-overview cineby-overview">{item.overview}</p>

          <div className="hero-actions">
            <button className="hero-btn-play" onClick={() => navigate(route)}>
              <Play size={20} fill="currentColor" />
              <span>Play</span>
            </button>
            <button className="hero-btn-info" onClick={() => navigate(route)}>
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-root {
          position: relative;
          height: 85vh;
          width: 100%;
          background: #0a0a0a;
          overflow: hidden;
        }

        .hero-backdrop-container {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-backdrop-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%;
          transition: transform 1.2s ease, opacity 0.8s ease;
        }

        /* Cinematic Gradient Overlay */
        .hero-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(10, 10, 10, 1) 0%,
            rgba(10, 10, 10, 0.8) 15%,
            rgba(10, 10, 10, 0.4) 40%,
            transparent 80%
          ),
          linear-gradient(
            to right,
            rgba(10, 10, 10, 0.7) 0%,
            transparent 50%
          );
          z-index: 1;
        }

        .hero-content {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          padding: 0 var(--page-x, 5vw);
        }

        .hero-meta {
          max-width: 680px;
          animation: fadeSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: clamp(40px, 6vw, 84px);
          color: white;
          margin-bottom: 20px;
          line-height: 1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }

        .hero-metadata {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #fff;
        }

        .hero-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #FFB400;
        }

        .hero-meta-dot {
          color: rgba(255, 255, 255, 0.3);
        }

        .hero-genre-tag {
          color: rgba(255, 255, 255, 0.8);
        }

        .cineby-overview {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: #B3B3B3;
          margin-bottom: 32px;
          max-width: 580px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hero-btn-play {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 36px;
          background: white;
          color: black;
          border-radius: 100px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .hero-btn-play:hover {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.9);
        }

        .hero-btn-info {
          padding: 12px 32px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: white;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hero-btn-info:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .hero-root { height: 75vh; }
          .hero-title { font-size: 48px; }
          .hero-content { padding-bottom: 64px; align-items: flex-end; }
          .hero-actions { width: 100%; }
          .hero-btn-play, .hero-btn-info { flex: 1; justify-content: center; padding: 12px 20px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
