import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { img, getVideos } from '../../services/tmdbService';
import { isWishlisted, addToWishlist, removeFromWishlist, getSettings } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { Star, Plus, Check, Volume2, VolumeX } from 'lucide-react';

const canTilt = () =>
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobileDevice = () => !window.matchMedia('(pointer: fine)').matches;

export default function ContentCard({ item, size = 'normal' }) {
  const cardRef = useRef(null);
  const posterRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { id, title, name, poster_path, vote_average, release_date, first_air_date, media_type } = item;
  const type = item._type || media_type || (title ? 'movie' : 'tv');

  useEffect(() => {
    isWishlisted(item.id, type).then(setWishlisted);
  }, [item.id, type]);

  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const hoverTimerRef = useRef(null);
  const iframeRef = useRef(null);
  const rafId = useRef(null);
  const isHoveredRef = useRef(false);

  const displayTitle = title || name;
  const year = (release_date || first_air_date || '').split('-')[0];
  const route = type === 'movie' ? '/movie' : type === 'anime' ? '/anime' : '/series';
  const isMobile = isMobileDevice();

  const handleMouseMove = useCallback((e) => {
    if (!isMobile) {
      if (!canTilt()) return;
      const poster = posterRef.current;
      if (!poster) return;
      const rect = poster.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      poster.style.setProperty('--rx', `${y * -28}deg`); // Brisk 28-degree tilt
      poster.style.setProperty('--ry', `${x * 28}deg`);
      const shine = poster.querySelector('[data-shine]');
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x * 100 + 50}% ${y * 100 + 50}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
      }
    }
  }, [isMobile]);

  const clearAll = useCallback(() => {
    isHoveredRef.current = false;
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setShowTrailer(false);
    setTrailerKey(null);
    setIsMuted(true);
    const poster = posterRef.current;
    if (!poster) return;
    poster.style.setProperty('--rx', '0deg');
    poster.style.setProperty('--ry', '0deg');
    const shine = poster.querySelector('[data-shine]');
    if (shine) shine.style.background = 'transparent';
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    isHoveredRef.current = true;
    hoverTimerRef.current = setTimeout(async () => {
      if (!getSettings().trailerOnHover) return;
      if (!isHoveredRef.current) return;
      const tryFetch = async (targetType) => {
        try {
          const resp = await getVideos(id, targetType);
          return resp?.results?.sort((a, b) => (b.size || 0) - (a.size || 0)).find(v =>
            (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
          );
        } catch { return null; }
      };
      const primaryType = (type === 'tv' || type === 'anime') ? 'tv' : 'movie';
      let trailer = await tryFetch(primaryType);
      if (!trailer) trailer = await tryFetch(primaryType === 'tv' ? 'movie' : 'tv');
      
      if (!isHoveredRef.current) return;

      if (trailer) {
        setTrailerKey(trailer.key);
        setShowTrailer(true);
      }
    }, 400); // 400ms delay to ensure intentional hover
  }, [id, type, isMobile]);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!iframeRef.current?.contentWindow) return;
    const next = !isMuted;
    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute' }), '*');
    setIsMuted(next);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    const data = { id, type, title: displayTitle, poster: img(poster_path), rating: vote_average, year };
    if (wishlisted) {
      removeFromWishlist(id, type);
      setWishlisted(false);
      addToast('Removed from Watchlist', 'info');
    } else {
      addToWishlist(data);
      setWishlisted(true);
      addToast('Added to Watchlist', 'success');
    }
  };

  return (
    /* Slot: Takes up original card space in the scroll row */
    <div className="premium-card-slot">
      {/* Hover wrapper: Wider area that captures mouse for card + overlay */}
      <div
        ref={cardRef}
        className="premium-card-hover"
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseEnter={!isMobile ? handleMouseEnter : undefined}
        onMouseLeave={!isMobile ? clearAll : undefined}
      >
        {/* Poster */}
        <div ref={posterRef} className="premium-card-poster" onClick={() => navigate(`${route}/${id}`)}>
          {!loaded && <div className="premium-card-skeleton" />}
          <img
            src={img(poster_path, isMobile ? 'w185' : 'w342')}
            alt={displayTitle}
            onLoad={() => setLoaded(true)}
            className={`premium-card-img ${loaded ? 'loaded' : ''}`}
            loading="lazy"
          />
          <div className="premium-card-gradient" />
          <div data-shine className="premium-card-shine" />

          <div className="premium-card-type">
            {type === 'movie' ? 'MOVIE' : type === 'anime' ? 'ANIME' : 'SERIES'}
          </div>

          {vote_average > 0 && (
            <div className="premium-card-rating">
              <Star size={10} fill="currentColor" />
              {vote_average.toFixed(1)}
            </div>
          )}

          <div className="premium-card-info">
            <span className="premium-card-title">{displayTitle}</span>
            {year && <span className="premium-card-year">{year}</span>}
          </div>
        </div>

        {/* Trailer overlay — above poster */}
        {showTrailer && trailerKey && (
          <div className="premium-card-overlay">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}&enablejsapi=1&origin=${window.location.origin}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&widget_referrer=${window.location.origin}`}
              title="Trailer"
              frameBorder="0"
              allow="autoplay; encrypted-media"
            />
            <div className="premium-card-controls">
              <button onClick={(e) => { e.stopPropagation(); toggleMute(e); }} className="premium-card-ctrl-btn">
                {isMuted ? <VolumeX size={14} strokeWidth={1.5} /> : <Volume2 size={14} strokeWidth={1.5} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleWishlist(e); }} className={`premium-card-ctrl-btn ${wishlisted ? 'active' : ''}`}>
                {wishlisted ? <Check size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Slot: Original card footprint in the scroll row */
        .premium-card-slot {
          width: var(--card-w);
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          position: relative;
        }

        /* Hover wrapper: Wider, centered, tall enough for overlay + poster */
        .premium-card-hover {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: calc(var(--card-w) * 1.9 + 48px);
          height: calc(var(--card-w) * 0.6667 + var(--card-w) * 1.9 * 0.5625);
          z-index: 1;
        }

        .premium-card-slot:hover .premium-card-hover {
          z-index: 100;
        }

        /* Poster: anchored to bottom-center of hover wrapper */
        .premium-card-poster {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: var(--card-w);
          aspect-ratio: 2 / 3;
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--card-bg);
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease;
          transform: translateX(-50%) perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          transform-style: preserve-3d;
          will-change: transform;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .premium-card-slot:hover .premium-card-poster {
          box-shadow: 
            0 30px 90px rgba(0, 0, 0, 1),
            0 0 35px rgba(0, 122, 255, 0.45),
            0 0 10px rgba(0, 122, 255, 0.3),
            0 0 0 2px rgba(0, 122, 255, 0.5);
          border-color: rgba(0, 122, 255, 0.8);
          transform: translateX(-50%) scale(1.02) perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        }

        .premium-card-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          z-index: 1;
        }

        .premium-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 2;
        }

        .premium-card-img.loaded { opacity: 1; }

        .premium-card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.3) 35%, transparent 60%);
          z-index: 4;
          pointer-events: none;
        }

        .premium-card-shine {
          position: absolute;
          inset: 0;
          transition: background 0.1s ease;
          z-index: 5;
          pointer-events: none;
        }

        .premium-card-type {
          position: absolute;
          top: 10px;
          left: 10px;
          font-family: 'Montserrat', sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(0, 122, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 6px;
          z-index: 10;
        }

        .premium-card-rating {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 3px 8px;
          border-radius: 20px;
          z-index: 10;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .premium-card-rating svg { color: #FFB400; }

        .premium-card-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 12px 12px;
          z-index: 6;
        }

        .premium-card-title {
          display: block;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13px;
          color: var(--white);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        .premium-card-year {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
          display: block;
        }

        /* ── TRAILER OVERLAY (above poster) ── */
        .premium-card-overlay {
          position: absolute;
          bottom: calc(var(--card-w) * 0.6667);
          left: 50%;
          transform: translateX(-50%);
          width: calc(var(--card-w) * 1.9);
          aspect-ratio: 16 / 9;
          border-radius: var(--radius);
          overflow: hidden;
          background: #000;
          z-index: 200;
          box-shadow: 
            0 40px 100px rgba(0, 0, 0, 1),
            0 0 50px rgba(0, 122, 255, 0.4),
            0 0 15px rgba(0, 122, 255, 0.25),
            0 0 0 2px rgba(0, 122, 255, 0.6);
          animation: overlayIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(0, 122, 255, 0.75);
        }

        @keyframes overlayIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.92); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .premium-card-overlay iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
          transform: scale(1.35);
        }

        /* ── CONTROLS ── */
        .premium-card-controls {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          z-index: 300;
          animation: ctrlIn 0.3s cubic-bezier(0, 0, 0.2, 1) 0.15s both;
          pointer-events: auto;
        }

        @keyframes ctrlIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .premium-card-ctrl-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .premium-card-ctrl-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .premium-card-ctrl-btn.active {
          color: var(--accent);
          border-color: rgba(0, 122, 255, 0.35);
          background: rgba(0, 122, 255, 0.12);
        }
      `}</style>
    </div>
  );
}
