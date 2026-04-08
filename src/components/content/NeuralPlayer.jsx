import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Satellite, Maximize, Minimize
} from 'lucide-react';

const SOURCES = [
  { id: 'neural', label: 'NEURAL (ULTRA HD)', buildUrl: (t, id, s, e) => `/player.html?id=${encodeURIComponent(id)}&type=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}&e=${encodeURIComponent(e)}` },
  { id: 'vidsrc_to', label: 'VIDSRC.TO (BEST)', buildUrl: (t, id, s, e) => t === 'movie' ? `https://vidsrc.to/embed/movie/${encodeURIComponent(id)}` : `https://vidsrc.to/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(s)}/${encodeURIComponent(e)}` },
  { id: 'vidlink', label: 'VIDLINK (FAST)', buildUrl: (t, id, s, e) => t === 'movie' ? `https://vidlink.pro/movie/${encodeURIComponent(id)}?primaryColor=007AFF` : `https://vidlink.pro/tv/${encodeURIComponent(id)}/${encodeURIComponent(s)}/${encodeURIComponent(e)}?primaryColor=007AFF` },
  { id: 'embedsu', label: 'EMBED.SU', buildUrl: (t, id, s, e) => t === 'movie' ? `https://embed.su/embed/movie/${encodeURIComponent(id)}` : `https://embed.su/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(s)}/${encodeURIComponent(e)}` },
  { id: 'vidsrc_me', label: 'VIDSRC.ME', buildUrl: (t, id, s, e) => t === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${encodeURIComponent(id)}` : `https://vidsrc.me/embed/tv?tmdb=${encodeURIComponent(id)}&season=${encodeURIComponent(s)}&episode=${encodeURIComponent(e)}` },
];

const NeuralPlayer = ({ tmdbId, type, season, episode, poster, title, mediaType, src: providedSrc }) => {
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [activeSourceIdx, setActiveSourceIdx] = useState(0); // Neural Premium by default
  const [src, setSrc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef(null);
  const inactivityTimer = useRef(null);
  const showServerMenuRef = useRef(showServerMenu);

  // Keep ref in sync
  useEffect(() => {
    showServerMenuRef.current = showServerMenu;
  }, [showServerMenu]);

  // Sync Source
  useEffect(() => {
    if (!providedSrc && tmdbId) {
      const url = SOURCES[activeSourceIdx].buildUrl(type || mediaType, tmdbId, season || 1, episode || 1);
      setSrc(url);
    } else if (providedSrc) {
      setSrc(providedSrc);
    }
  }, [tmdbId, type, season, episode, mediaType, providedSrc, activeSourceIdx]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Show/Hide Controls Logic
  const triggerControls = useCallback(() => {
    setShowControls(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    
    // Auto-hide after 5 seconds of no activity
    inactivityTimer.current = setTimeout(() => {
      if (!showServerMenuRef.current) {
        setShowControls(false);
      }
    }, 5000);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = () => triggerControls();
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [triggerControls]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const enter = containerRef.current.requestFullscreen || containerRef.current.webkitRequestFullscreen;
        if (enter) await enter.call(containerRef.current);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden group/player ${isFullscreen ? 'h-screen' : 'aspect-video rounded-2xl bg-black shadow-2xl'}`}
      onMouseMove={triggerControls}
    >
      {/* 1. Subtle Ambient Glow */}
      <div 
        className={`absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-all duration-1000 z-0 ${isFullscreen ? 'opacity-30' : ''} ${showControls ? 'scale-110 opacity-30' : 'scale-100 opacity-10'}`}
        style={{
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Video Iframe */}
      <div className="relative w-full h-full z-10">
        <iframe
          src={src}
          className="w-full h-full border-0"
          title={title}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </div>

      {/* 2. Top-Right UI Layer - Responsive to showControls */}
      <div 
        className={`absolute top-6 right-6 z-50 flex items-center gap-3 transition-all duration-700 ease-out ${
          showControls || showServerMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
        }`}
      >
        {/* Server Toggle Button */}
        <div className="relative">
          <button 
            onClick={() => setShowServerMenu(!showServerMenu)}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shadow-2xl backdrop-blur-3xl ${
              showServerMenu 
              ? 'bg-neon-blue border-neon-blue text-white shadow-[0_0_25px_rgba(30,122,255,0.5)]' 
              : 'bg-black/40 border-white/10 text-white/80 hover:bg-black/80 hover:text-white hover:border-white/20'
            }`}
          >
            <Satellite size={18} className={showServerMenu ? 'animate-pulse' : ''} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] hidden sm:inline">Servers</span>
          </button>

          {/* Server Dropdown */}
          <div 
            className={`absolute top-[calc(100%+12px)] right-0 w-64 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-3 shadow-[0_40px_80px_rgba(0,0,0,0.9)] transition-all duration-300 ${
              showServerMenu ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">
              Uplink Sources
            </div>
            <div className="space-y-1">
              {SOURCES.map((s, idx) => (
                <button 
                  key={s.id}
                  onClick={() => {
                    setActiveSourceIdx(idx);
                    setShowServerMenu(false);
                    triggerControls();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    activeSourceIdx === idx 
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-xs font-black uppercase">{s.label}</span>
                  {activeSourceIdx === idx && <div className="w-2 h-2 bg-neon-blue rounded-full shadow-[0_0_8px_#007AFF]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Fullscreen Button */}
        <button 
          onClick={toggleFullscreen}
          className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white/80 hover:bg-black/80 hover:text-white hover:border-white/20 backdrop-blur-3xl transition-all shadow-2xl"
          title={isFullscreen ? "Exit Fullscreen" : "Neural Fullscreen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Invisible Global Hover Layer - Minimal top strip to trigger controls without blocking iframe */}
      <div className="absolute inset-x-0 top-0 h-16 z-40 pointer-events-none group-hover/player:pointer-events-auto" />
    </div>
  );
};

export default NeuralPlayer;
