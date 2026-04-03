import { useEffect, useRef, useState, useCallback } from 'react';
import { addToHistory } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { throttle } from '../../services/performanceService';

const SOURCES = [
  {
    id: 'vidlink',
    label: 'VIDLINK',
    buildUrl: (type, id, season, episode) =>
      type === 'movie'
        ? `https://vidlink.pro/movie/${id}?primaryColor=ffffff&secondaryColor=2a85ff&iconColor=ffffff&autoplay=true`
        : `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=ffffff&secondaryColor=2a85ff&iconColor=ffffff&autoplay=true`,
  },
  {
    id: 'vidapi',
    label: 'VIDAPI.RU',
    buildUrl: (type, id, season, episode) =>
      type === 'movie'
        ? `https://vidapi.ru/embed/movie/${id}`
        : `https://vidapi.ru/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidsrc',
    label: 'VIDSRC.ME',
    buildUrl: (type, id, season, episode) =>
      type === 'movie'
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    id: 'embedsu',
    label: 'EMBED.SU',
    buildUrl: (type, id, season, episode) =>
      type === 'movie'
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
];

  export default function VideoPlayer({
    tmdbId, type, season, episode,
    episodeTitle, poster, title, mediaType, year
  }) {
    const { addToast } = useToast();
    const savedRef        = useRef(false);
    const containerRef    = useRef(null);
    const iframeRef       = useRef(null);
    const dropdownRef     = useRef(null);
    const controlsTimeout = useRef(null);
    const lastMoveTime    = useRef(0);
    const cachedRect      = useRef(null);

    const [srcIdx,       setSrcIdx]       = useState(0);
    const [theatre,      setTheatre]      = useState(false);
    const [ifrLoaded,    setIfrLoaded]    = useState(false);
    const [serverOpen,   setServerOpen]   = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const source  = SOURCES[srcIdx];
    const ifrSrc  = source.buildUrl(type, tmdbId, season, episode);

    // Toggle Visibility Timer
    const triggerControls = useCallback(() => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        // Don't hide if server menu is open
        setServerOpen(current => {
          if (!current) setShowControls(false);
          return current;
        });
      }, 3000);
    }, []);

    // Performance-optimized Global Mouse Detection
    useEffect(() => {
      const updateRect = throttle(() => {
        if (containerRef.current) cachedRect.current = containerRef.current.getBoundingClientRect();
      }, 100);

      const onGlobalMouseMove = throttle((e) => {
        if (!cachedRect.current) updateRect();
        const rect = cachedRect.current;
        if (!rect) return;

        if (
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        ) {
          triggerControls();
        }
      }, 100);

      window.addEventListener('mousemove', onGlobalMouseMove, { passive: true });
      window.addEventListener('resize', updateRect, { passive: true });
      window.addEventListener('scroll', updateRect, { passive: true, capture: true });
      
      return () => {
        window.removeEventListener('mousemove', onGlobalMouseMove);
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
      };
    }, [triggerControls]);

    // Click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setServerOpen(false);
        }
      };
      if (serverOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [serverOpen]);

    // Fullscreen listener
    useEffect(() => {
      const handleFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
        // Wait for animation frame then update rect
        requestAnimationFrame(() => {
          if (containerRef.current) cachedRect.current = containerRef.current.getBoundingClientRect();
        });
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);
    useEffect(() => {
      if (savedRef.current) return;
      savedRef.current = true;
      addToHistory({
        id: tmdbId, title,
        type: type === 'movie' ? 'movie' : mediaType === 'anime' ? 'anime' : 'series',
        poster, season: season || null, episode: episode || null,
        episodeTitle: episodeTitle || null, progress: 0,
        year: year || null
      });
      addToast('> STREAM STARTED — SAVED TO HISTORY ✓', 'success');
    }, [tmdbId, season, episode, title, type, mediaType, poster, episodeTitle, addToast, year]);

  // Reset load state on source change with safety fallback
  useEffect(() => { 
    setIfrLoaded(false); 
    setServerOpen(false);
    triggerControls();

    const timer = setTimeout(() => {
      setIfrLoaded(true); // Safety fallback if iframe onLoad fails
    }, 8000);

    return () => clearTimeout(timer);
  }, [ifrSrc, triggerControls]);

  const switchSource = useCallback((idx) => {
    if (idx === srcIdx) return;
    setIfrLoaded(false);
    setSrcIdx(idx);
    addToast(`> SOURCE: ${SOURCES[idx].label}`, 'info');
  }, [srcIdx, addToast]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        addToast(`FULLSCREEN ERROR: ${err.message}`, 'error');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const episodeLabel = type !== 'movie'
    ? `S${String(season).padStart(2,'0')}E${String(episode).padStart(2,'0')}${episodeTitle ? ` — "${episodeTitle}"` : ''}`
    : null;

  /* ─────────────────────────  PLAYER SHELL  ───────────────────── */
  return (
    <div 
      ref={containerRef}
      style={{
        marginTop:    theatre && !isFullscreen ? 0 : '48px',
        position:     theatre || isFullscreen ? 'fixed' : 'relative',
        inset:        theatre || isFullscreen ? 0 : 'auto',
        zIndex:       theatre || isFullscreen ? 9990 : 'auto',
        background:   '#000000',
        display:      'flex', flexDirection:'column',
        borderRadius: theatre || isFullscreen ? 0 : '12px',
        overflow:     'hidden',
        boxShadow:    '0 0 60px rgba(0,0,0,1)',
        transition:   'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor:       showControls ? 'auto' : 'none',
        // Responsive size adjustment
        maxWidth:     theatre || isFullscreen ? 'none' : '1200px',
        width:        theatre || isFullscreen ? '100%' : '90%',
        margin:       theatre || isFullscreen ? '0' : '48px auto 0',
      }}
    >
      {/* ── TOP OVERLAY (CLEAN) ─────────────────────────────────── */}
      <div style={{
        position:       'absolute', top: 0, left: 0, right: 0,
        background:     'transparent',
        padding:        '24px 32px',
        display:        'flex', justifyContent: 'flex-end', alignItems: 'center',
        zIndex:         100,
        opacity:        showControls ? 1 : 0,
        pointerEvents:  showControls ? 'auto' : 'none',
        transition:     'opacity 0.5s ease, transform 0.5s ease',
        transform:      showControls ? 'translateY(0)' : 'translateY(-20px)'
      }}>
        {/* CONTROLS (Only Right side now, per cleanup) */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* PLAYER STATUS INDICATOR (Mini) */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'rgba(0,0,0,0.4)', padding: '8px 14px', borderRadius: '20px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
             <div style={{
               width: '6px', height: '6px', borderRadius: '50%',
               background: ifrLoaded ? 'var(--accent)' : '#FFB400',
               boxShadow: ifrLoaded ? '0 0 15px var(--accent)' : '0 0 10px #FFB400',
               animation: 'glowPulse 2s infinite',
             }} />
             <span style={{ fontFamily: "'Inter'", fontWeight: 800, fontSize: '10px', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>
               {ifrLoaded ? 'STABLE' : 'WAITING'}
             </span>
          </div>

          {/* SERVER SELECTOR */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setServerOpen(o => !o)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border:     '1px solid rgba(255,255,255,0.1)',
                color:      'var(--white)',
                fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 800,
                padding:    '10px 20px',
                borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <span>{source.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: serverOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {serverOpen && (
              <div style={{
                position:   'absolute', top: 'calc(100% + 12px)', right: 0,
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(40px)',
                border:     '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                minWidth:   '200px',
                zIndex:     1001, padding: '8px'
              }}>
                <div style={{ padding: '8px 14px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, letterSpacing: '1.5px' }}>CHOOSE SERVER</div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {SOURCES.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); switchSource(i); setServerOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'left',
                        background:  i === srcIdx ? 'var(--accent)' : 'transparent',
                        color:       i === srcIdx ? 'var(--black)' : 'var(--white)',
                        fontFamily:  "'Montserrat', sans-serif", fontSize: '11px', fontWeight: 800,
                        padding:     '12px 16px',
                        borderRadius: '4px', display: 'block', margin: '4px 0',
                        transition:  'all 0.2s ease',
                        textTransform: 'uppercase', letterSpacing: '1px'
                      }}
                      onMouseEnter={e => { if(i !== srcIdx) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if(i !== srcIdx) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* THEATRE TOGGLE */}
          <button
            onClick={() => setTheatre(t => !t)}
            style={{
              background: theatre ? 'var(--white)' : 'rgba(255,255,255,0.1)',
              border:     '1px solid rgba(255,255,255,0.2)',
              color:      theatre ? 'var(--black)' : 'var(--white)',
              width:      '42px', height: '42px',
              borderRadius:'50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
          </button>

          {/* FULLSCREEN TOGGLE */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: isFullscreen ? 'var(--white)' : 'rgba(255,255,255,0.1)',
              border:     '1px solid rgba(255,255,255,0.2)',
              color:      isFullscreen ? 'var(--black)' : 'var(--white)',
              width:      '42px', height: '42px',
              borderRadius:'50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {isFullscreen 
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            }
          </button>
        </div>
      </div>

      {/* ── IFRAME AREA ─────────────────────────────────────────── */}
      <div style={{
        position:    'relative',
        width:       '100%',
        aspectRatio: theatre || isFullscreen ? 'auto' : '16/9',
        flex:        theatre || isFullscreen ? 1 : 'auto',
        background:  '#000',
      }}>
        {/* Loading skeleton */}
        {!ifrLoaded && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '24px',
            background: '#000000',
          }}>
            {poster && (
              <div style={{ position: 'relative' }}>
                <img src={poster} alt="" style={{ height: '220px', opacity: 0.1, objectFit: 'contain', filter: 'blur(4px)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 0%, #0a0a0a 100%)' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontFamily: "'Montserrat'", fontSize: '12px', color: 'var(--white)', fontWeight: 900, letterSpacing: '6px', opacity: 0.9 }}>VOIDSTREAM V1.0</div>
              <div style={{ width: '220px', height: '2px', background: 'rgba(255, 0, 0, 0.1)', overflow: 'hidden', borderRadius: '1px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 20px var(--accent)', animation: 'loadBar 2s cubic-bezier(0.65, 0, 0.35, 1) infinite' }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, letterSpacing: '2px', opacity: 0.6 }}>CONNECTING TO {source.label}...</div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={ifrSrc}
          src={ifrSrc}
          title={title}
          width="100%"
          height="100%"
          style={{ 
            position: 'absolute', inset: 0, border: 'none', display: 'block',
            pointerEvents: 'auto'
          }}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          onLoad={() => setIfrLoaded(true)}
        />
      </div>

      <style>{`
        @keyframes loadBar {
          0%   { width: 0; transform: translateX(-100%); }
          50%  { width: 70%; }
          100% { width: 0; transform: translateX(300%); }
        }
        @keyframes glowPulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
