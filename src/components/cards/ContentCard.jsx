import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { img, getVideos } from '../../services/tmdbService';
import {
  isWishlisted, addToWishlist, removeFromWishlist, getSettings
} from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

// Only apply 3D tilt on fine-pointer devices that don't prefer reduced motion
const canTilt = () =>
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ContentCard({ item, size = 'normal' }) {
  const cardRef  = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { id, title, name, poster_path, vote_average,
          release_date, first_air_date, media_type } = item;

  const type  = item._type || media_type || (title ? 'movie' : 'tv');

  useEffect(() => {
    isWishlisted(item.id, type)
      .then(setWishlisted);
  }, [item.id, type]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [edgeShift, setEdgeShift] = useState(0);
  const hoverTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  const displayTitle = title || name;
  const year  = (release_date || first_air_date || '').split('-')[0];
  const route = type === 'movie' ? '/movie' : type === 'anime' ? '/anime' : '/series';

  // ── 3D TILT via CSS custom properties (no layout thrash) ────────
  const rafId = useRef(null);

  const isExpanded = isHovered && iframeLoaded;

  const checkBounds = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const margin = 20; 
    const isExpanded = isHovered && iframeLoaded;
    const expansionWidth = isExpanded ? rect.width * 1.6 : rect.width * 1.2;
    
    let shift = 0;
    const leftBound = rect.left - (expansionWidth - rect.width) / 2;
    const rightBound = rect.right + (expansionWidth - rect.width) / 2;

    if (leftBound < margin) {
      shift = margin - leftBound;
    } else if (rightBound > window.innerWidth - margin) {
      shift = (window.innerWidth - margin) - rightBound;
    }
    setEdgeShift(shift);
   }, [isHovered, iframeLoaded]);
 
   useEffect(() => {
     if (isHovered) {
       checkBounds();
       // Listen for resize to update bounds if window changes
       window.addEventListener('resize', checkBounds);
       return () => window.removeEventListener('resize', checkBounds);
     }
   }, [isHovered, isExpanded, checkBounds]);

   const handleMouseMove = useCallback((e) => {
    if (!canTilt()) return;
    const card = cardRef.current;
    if (!card) return;

    // Use rAF for buttery smooth 60fps performance
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.setProperty('--rx', `${y * -18}deg`);
      card.style.setProperty('--ry', `${x * 18}deg`);
      card.style.setProperty('--tz', '16px');
      const shine = card.querySelector('[data-shine]');
      if (shine) {
        shine.style.background =
          `radial-gradient(circle at ${x * 100 + 50}% ${y * 100 + 50}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`;
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    
    setIsHovered(false);
    setTrailerKey(null);
    setIframeLoaded(false);
    setIsMuted(true);
    setEdgeShift(0);
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--tz', '0px');
    const shine = card.querySelector('[data-shine]');
    if (shine) shine.style.background = 'transparent';
  }, []);

  const handleMouseEnter = useCallback((e) => {
    setIsHovered(true);
    if (getSettings().trailerOnHover) {
      // Immediate fetch (preloading strategy)
      // Intelligent preloading with fallback
      const fetchTrailer = async () => {
        const tryFetch = async (targetType) => {
          try {
            const resp = await getVideos(id, targetType);
            return resp?.results?.sort((a, b) => (b.size || 0) - (a.size || 0)).find(v => 
              (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Opening' || v.type === 'Clip') && 
              v.site === 'YouTube'
            );
          } catch { return null; }
        };

        // 1. Initial attempt based on detected type
        const primaryType = (type === 'tv' || type === 'anime' || type === 'series') ? 'tv' : 'movie';
        let trailer = await tryFetch(primaryType);

        // 2. Fallback attempt (TV <-> MOVIE crossover) if nothing found
        if (!trailer) {
          const fallbackType = primaryType === 'tv' ? 'movie' : 'tv';
          trailer = await tryFetch(fallbackType);
        }

        if (trailer) {
          hoverTimeoutRef.current = setTimeout(() => {
            setTrailerKey(trailer.key);
          }, 150);
        }
      };
      fetchTrailer();
    }
  }, [id, type]);

  const toggleMute = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    const nextMuted = !isMuted;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: nextMuted ? 'mute' : 'unMute' }), 
      '*'
    );
    setIsMuted(nextMuted);
    
    // Pulse feedback
    const btn = e.currentTarget;
    btn.style.background = 'rgba(255, 255, 255, 0.7)';
    setTimeout(() => { btn.style.background = 'rgba(0,0,0,0.6)'; }, 150);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const itemData = { id, type, title: displayTitle, poster: img(poster_path), rating: vote_average, year };
    
    if (wishlisted) {
      removeFromWishlist(id, type);
      setWishlisted(false);
      addToast('> REMOVED FROM WATCHLIST', 'info');
    } else {
      addToWishlist(itemData);
      setWishlisted(true);
      addToast('> ADDED TO WATCHLIST ✓', 'success');
    }

    // Pulse feedback
    const btn = e.currentTarget;
    btn.style.background = 'rgba(255, 255, 255, 0.7)';
    setTimeout(() => { btn.style.background = 'rgba(0,0,0,0.6)'; }, 150);
  };

  // Reposition logic based on hover index (for pushing effect)
  // Since we use flexbox, changing the width already handles pushing.
  // We just need to handle the viewport boundaries for the expanded card.

  return (
    <div
      ref={cardRef}
      className={`content-card-root ${isHovered ? 'hovered' : ''} ${isExpanded ? 'expanded' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`${route}/${id}`)}
      onMouseEnter={handleMouseEnter}
      style={{
        position:       'relative',
        width:          'var(--card-w)',
        height:         'calc(var(--card-w) * 1.5)',
        flexShrink:     0,
        zIndex:         isHovered ? 100 : 1,
        cursor:         'pointer',
        transition:     'z-index 0.3s step-end'
      }}
    >
      {/* EXPANDING CONTAINER (LAYOUT STABLE) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: isExpanded ? 'calc(var(--card-w) * 2.66)' : '100%',
        height: '100%',
        transform: `translateX(calc(-50% + ${edgeShift}px)) ${!isExpanded && isHovered ? 'scale(1.2)' : 'scale(1)'}`,
        borderRadius:   'var(--radius)',
        transition:     'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:      isHovered ? 'var(--shadow-lg), 0 0 40px var(--accent)' : 'none',
        willChange:     'width, transform, box-shadow',
        transformStyle: 'preserve-3d',
        zIndex: 1
      }}>
        {/* STATIC INNER CARD (CLIPPED) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius)',
          background: '#000', 
          border: isHovered ? '2px solid var(--accent)' : '1px solid var(--border)',
          transition: 'border 0.4s ease, transform 0.1s ease-out', overflow: 'hidden',
          transform: `perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px))`,
          zIndex: 1,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}>
        {/* SKELETON while image loads */}
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            zIndex: 1
          }} />
        )}

        {/* POSTER */}
        <img
          src={img(poster_path, 'w342')}
          alt={displayTitle}
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', transform: 'translateZ(5px)',
            opacity: loaded && !iframeLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 2
          }}
          loading="lazy"
          decoding="async"
        />

        {/* TRAILER IFRAME (Integrated) */}
        {trailerKey && isHovered && (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}&enablejsapi=1&origin=${window.location.origin}`}
            title="Trailer"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            onLoad={() => setIframeLoaded(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', transform: 'translateZ(2px)',
              pointerEvents: 'none',
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            }}
          />
        )}

        {/* VIGNETTE EDGE BLACKOUT */}
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: isHovered && !iframeLoaded ? 'inset 0 0 40px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.4)' : 'none',
          pointerEvents: 'none',
          transition: 'box-shadow 0.3s ease',
          zIndex: 3, transform: 'translateZ(6px)'
        }} />

        {/* GRADIENT OVERLAY */}
        <div style={{
          position:   'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 100%)',
          transform:  'translateZ(10px)',
          zIndex: 4
        }} />

        {/* HOLOGRAPHIC SHINE */}
        <div data-shine style={{
          position: 'absolute', inset: 0,
          transition: 'background 0.1s ease',
          transform: 'translateZ(55px)',
          pointerEvents: 'none',
          zIndex: 5
        }} />

        {/* TYPE BADGE */}
        <div style={{
          position:      'absolute', top: '12px', left: '12px',
          background:    'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          border:        '1px solid var(--accent)', borderRadius: '4px',
          color:         'var(--white)',
          fontSize:      '9px',
          fontFamily:    "'Montserrat', sans-serif",
          fontWeight:    900,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          padding:       '4px 8px',
          zIndex:        10
        }}>
          {type === 'movie' ? 'MOVIE' : type === 'anime' ? 'ANIME' : 'SERIES'}
        </div>

        {/* BOTTOM INFO */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding:  '12px', transform: 'translateZ(25px)',
          zIndex: 10
        }}>
          <div style={{
            fontFamily:       "'Inter', sans-serif",
            fontWeight:       600, fontSize: '14px',
            color:            'var(--white)', lineHeight: 1.2,
            marginBottom:     '6px',
            overflow:         isHovered ? 'visible' : 'hidden',
            display:          isHovered ? 'block' : '-webkit-box',
            WebkitLineClamp:  isHovered ? 'unset' : 2,
            WebkitBoxOrient:  'vertical',
            transition:       'all 0.2s ease',
            zIndex: 10, position: 'relative'
          }}>
            {displayTitle}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              background:  'var(--accent)', borderRadius: '4px',
              color:       'var(--white)', fontSize: '11px',
              padding:     '2px 6px', fontWeight: 900,
              fontFamily:  "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '2px'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              {vote_average?.toFixed(1) || 'N/A'}
            </span>
            <span style={{ color: '#fff', fontSize: '12px', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
              {year}
            </span>
          </div>
        </div>

        {/* PLAY & BLUR OVERLAY */}
        <div style={{
          position:   'absolute', inset: 0,
          display:    'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          opacity:    isHovered && !iframeLoaded ? 1 : 0, 
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5) 100%)',
          transition: 'all 0.3s ease',
          zIndex: 30, padding: '20px', textAlign: 'center',
          pointerEvents: 'none'
        }}>
          {/* CENTERED PLAY ICON */}
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--accent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-md)', marginBottom: '16px',
            transform: isHovered ? 'scale(1)' : 'scale(0.8)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none" style={{ marginLeft: '4px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
        </div> {/* END STATIC INNER CARD */}
        {/* ACTIONS ROW (Pinned to card corner, unaffected by 3D tilt) */}
        {isHovered && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            display: 'flex', gap: '8px', zIndex: 9999,
            pointerEvents: 'auto',
            transform: `translateX(${edgeShift}px)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {iframeLoaded && (
              <button
                onClick={toggleMute}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  color: 'var(--white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--black)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = 'var(--white)'; }}
              >
                {isMuted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                )}
              </button>
            )}
            <button
              onClick={toggleWishlist}
              style={{
                width:      '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                border:     `1px solid rgba(255,255,255,0.1)`,
                color:      wishlisted ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                display:    'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow:  wishlisted ? '0 0 10px rgba(255,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.5)',
                transition: 'all 0.2s', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--black)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = wishlisted ? 'var(--accent)' : 'rgba(255,255,255,0.7)'; }}
            >
              {wishlisted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              )}
            </button>
          </div>
        )}
      </div> {/* END EXPANDING CONTAINER */}
    </div>
  );
}
