import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  getMovie, getTVShow, getSeason,
  getSimilarMovies, getSimilarTV, img
} from '../services/tmdbService';
import {
  isWishlisted, addToWishlist, removeFromWishlist,
  getHistory
} from '../services/storageService';

import ContentCard from '../components/cards/ContentCard';
import VideoPlayer from '../components/content/VideoPlayer';
import { useToast } from '../context/ToastContext';

export default function Detail({ type }) {
  const { id } = useParams();
  const { addToast } = useToast();
  const playerRef  = useRef(null);

  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [similar,     setSimilar]     = useState([]);
  const [season,      setSeason]      = useState(null);
  const [selSeason,   setSelSeason]   = useState(1);
  const [playing,     setPlaying]     = useState(null);
  const [wishlisted,  setWishlisted]  = useState(false);
  const [overflowExp, setOverflowExp] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [bgMuted, setBgMuted] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);
  const bgIframeRef = useRef(null);

  const mediaId = parseInt(id);
  const isMovie  = type === 'movie';
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setLoading(true); setPlaying(null);
    const fetchDetail = isMovie ? getMovie(mediaId) : getTVShow(mediaId);
    const fetchSimilar = isMovie ? getSimilarMovies(mediaId) : getSimilarTV(mediaId);
    const fetchStatus = isWishlisted(mediaId, type);
    const fetchHist   = getHistory();

    Promise.all([fetchDetail, fetchSimilar, fetchStatus, fetchHist]).then(([d, s, w, h]) => {
      setDetail(d);
      setSimilar((s.results || []).slice(0, 12));
      setWishlisted(w);
      setHistory(h);
      if (!isMovie && d.number_of_seasons) getSeason(mediaId, 1).then(setSeason);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, type, isMovie, mediaId]);

  const trailerVideo = detail?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  // Safety fallback for background trailer loading
  useEffect(() => {
    if (!trailerVideo) {
      setBgLoaded(false);
      return;
    }
    const timer = setTimeout(() => {
      setBgLoaded(true);
    }, 4000); // 4s fallback
    return () => clearTimeout(timer);
  }, [trailerVideo]);



  const handleSeasonChange = (num) => {
    setSelSeason(num);
    getSeason(mediaId, num).then(setSeason);
  };

  const handleWatchNow = () => {
    if (isMovie) {
      setPlaying({ type: 'movie' });
      setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById('episode-list')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEpisodePlay = (ep) => {
    setPlaying({ season: selSeason, episode: ep.episode_number, title: ep.name });
    if (!bgMuted) toggleBgMute(); // Auto-mute background when playing manually
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleBgMute = () => {
    if (!bgIframeRef.current || !bgIframeRef.current.contentWindow) return;
    const nextMuted = !bgMuted;
    bgIframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: nextMuted ? 'mute' : 'unMute' }), 
      '*'
    );
    setBgMuted(nextMuted);
  };

  const handleWishlist = () => {
    if (!detail) return;
    const itemData = {
      id: mediaId, type,
      title: detail.title || detail.name,
      poster: img(detail.poster_path),
      rating: detail.vote_average,
      year: (detail.release_date || detail.first_air_date || '').split('-')[0]
    };
    if (wishlisted) {
      removeFromWishlist(mediaId, type);
      setWishlisted(false);
      addToast('> Removed from Watchlist', 'info');
    } else {
      addToWishlist(itemData);
      setWishlisted(true);
      addToast('Added to Watchlist ✓', 'success');
    }
  };


  const isEpWatched = (epNum) =>
    history.some(h => h.id === mediaId && h.season === selSeason && h.episode === epNum);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
      <div style={{
          width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 1s infinite linear'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!detail) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px' }}>
        Content not available.
      </div>
    </div>
  );

  const title   = detail?.title || detail?.name;
  const year    = (detail?.release_date || detail?.first_air_date || '').split('-')[0];
  const runtime = detail?.runtime
    ? `${detail.runtime}m`
    : detail?.number_of_seasons
      ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? 's' : ''}`
      : '';
  const genres  = detail?.genres || [];


  const btnStyle = (primary = false) => ({
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px',
    padding: '12px 28px', cursor: 'pointer', borderRadius: '30px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: primary ? 'var(--white)' : 'rgba(255,255,255,0.05)',
    color:      primary ? 'var(--black)' : 'var(--white)',
    border:     primary ? '1px solid var(--white)' : '1px solid var(--glass-border)',
    backdropFilter: primary ? 'none' : 'blur(10px)',
    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
  });

  return (
    <>
      <style>{`
        .detail-info-panel {
          display: flex; gap: 48px; flex-wrap: wrap;
          padding: clamp(32px, 8vw, 64px) var(--page-x, 5vw) 0;
          position: relative; z-index: 4;
        }
        .detail-poster {
          width: clamp(160px, 25vw, 280px); flex-shrink: 0;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          border: 1px solid var(--glass-border);
        }
        .detail-meta { 
            flex: 1; min-width: min(320px, 100%); 
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(25px);
            padding: clamp(24px, 4vw, 40px);
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 30px 60px rgba(0,0,0,0.6);
        }
        .detail-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 32px; }
        .ep-card {
          display: flex; align-items: center; gap: 20px;
          padding: 16px 20px; border-bottom: 1px solid var(--glass-border);
          transition: all 0.25s; cursor: pointer;
        }
        .ep-card:hover { background: rgba(255,255,255,0.03); }
        .ep-card.active { background: rgba(42, 133, 255, 0.08); border-left: 4px solid var(--accent); }
        .ep-thumb-container {
          width: 140px; aspect-ratio: 16/9; overflow: hidden;
          border-radius: 8px; flex-shrink: 0; background: #1a1a1a;
          border: 1px solid var(--glass-border);
        }
        @media (max-width: 768px) {
          .detail-info-panel { flex-direction: column; align-items: center; text-align: center; gap: 32px; }
          .detail-actions { justify-content: center; width: 100%; }
          .ep-thumb-container { width: 100px; }
          .detail-meta-row { justify-content: center; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', paddingBottom: '100px', background: '#000' }}>
        {/* BACKDROP SYSTEM */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', zIndex: 0, overflow: 'hidden' }}>
          {trailerVideo && (
            <>
              {!bgLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid rgba(255,0,0,0.2)', borderTopColor: 'var(--accent)', animation: 'spin 1.2s infinite cubic-bezier(0.5, 0, 0.5, 1)' }} />
                </div>
              )}
              <iframe
                ref={bgIframeRef}
                src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerVideo.key}&enablejsapi=1`}
                title={`${title} - Background Trailer`}
                style={{
                  width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh',
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  opacity: bgLoaded ? 1 : 0, transition: 'opacity 1.5s ease',
                  zIndex: 5, // Above backdrop image and gradients
                  border: 'none',
                  filter: 'contrast(1.1) brightness(1.1)'
                }}
                onLoad={() => setBgLoaded(true)}
                frameBorder="0" allow="autoplay; encrypted-media"
              />


            </>
          )}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${img(detail.backdrop_path, 'w1280')})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
            filter: 'brightness(0.2) saturate(0.8)', opacity: trailerVideo && bgLoaded ? 0 : 0.6,
            transition: 'opacity 1.5s ease', zIndex: 1
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.7) 30%, transparent 100%)', zIndex: 3 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.4) 40%, transparent 100%)', zIndex: 3 }} />

        </div>

        {/* INFO PANEL */}
        <div className="detail-info-panel">
          <div className="detail-poster">
            <img src={img(detail.poster_path, 'w500')} alt={title} style={{ width: '100%', display: 'block' }} />
          </div>

          <div className="detail-meta">
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              color: 'var(--accent)', fontFamily: "'Inter', sans-serif", fontSize: '12px', 
              fontWeight: 700, letterSpacing: '2px', marginBottom: '16px' 
            }}>
              {type.toUpperCase()} <span style={{ opacity: 0.3 }}>|</span> {year}
            </div>

            <h1 style={{ 
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 5vw, 48px)', 
              color: 'var(--white)', marginBottom: '16px', letterSpacing: '-0.8px' 
            }}>{title}</h1>

            <div className="detail-meta-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ 
                color: '#FFB400', fontSize: '14px', fontWeight: 700, 
                display: 'flex', alignItems: 'center', gap: '4px' 
              }}>★ {detail.vote_average?.toFixed(1)}</span>
              {runtime && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{runtime}</span>}
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                {detail.original_language?.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {genres.map(g => (
                <span key={g.id} style={{ 
                  fontSize: '12px', fontWeight: 600, color: 'var(--white)', 
                  background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '20px' 
                }}>{g.name}</span>
              ))}
            </div>

            <p style={{ 
              fontSize: '16px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', 
              maxWidth: '800px', display: overflowExp ? 'block' : '-webkit-box',
              WebkitLineClamp: overflowExp ? 'unset' : 4, WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>{detail.overview}</p>
            {detail.overview?.length > 300 && (
              <button onClick={() => setOverflowExp(e => !e)} style={{ 
                background: 'none', border: 'none', color: 'var(--accent)', 
                fontSize: '13px', fontWeight: 600, marginTop: '8px', cursor: 'pointer' 
              }}>
                {overflowExp ? 'Show Less' : 'Read More...'}
              </button>
            )}

            <div className="detail-actions">
              <button onClick={handleWatchNow} style={btnStyle(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Watch Now
              </button>
              {trailerVideo && bgLoaded && (
                <button onClick={toggleBgMute} style={btnStyle()}>
                  {bgMuted ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> Unmute</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Mute</>
                  )}
                </button>
              )}
              {trailerVideo && (
                <button onClick={() => setShowTrailerModal(true)} style={btnStyle()}>
                  Trailer
                </button>
              )}
              <button onClick={handleWishlist} style={{ ...btnStyle(), color: wishlisted ? 'var(--accent)' : 'var(--white)' }}>
                {wishlisted ? '✓ In Watchlist' : '+ Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* PLAYER SECTION */}
        <div ref={playerRef} style={{ position: 'relative', zIndex: 3, padding: '0 var(--page-x, 5vw)', marginTop: '48px' }}>
          {playing && (
            <VideoPlayer
              tmdbId={mediaId} type={isMovie ? 'movie' : 'tv'}
              season={playing.season} episode={playing.episode}
              episodeTitle={playing.title} poster={img(detail.poster_path)}
              title={title} mediaType={type} year={year}
            />
          )}
        </div>

        {/* TV SPECIFIC: EPISODES */}
        {!isMovie && (
          <div id="episode-list" style={{ position: 'relative', zIndex: 3, padding: '64px var(--page-x, 5vw) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: "'Outfit'", fontSize: '24px', fontWeight: 700, color: 'var(--white)' }}>Episodes</h2>
              <select 
                value={selSeason} 
                onChange={e => handleSeasonChange(parseInt(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  color: 'var(--white)', padding: '8px 20px', borderRadius: '20px', fontSize: '14px',
                  fontWeight: 600, outline: 'none', cursor: 'pointer'
                }}
              >
                {Array.from({ length: detail.number_of_seasons || 1 }).map((_, i) => (
                  <option key={i + 1} value={i + 1} style={{ background: '#111' }}>Season {i + 1}</option>
                ))}
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
              {(season?.episodes || []).map((ep) => {
                const isPlaying = playing?.season === selSeason && playing?.episode === ep.episode_number;
                const watched   = isEpWatched(ep.episode_number);
                return (
                  <div key={ep.id} onClick={() => handleEpisodePlay(ep)} className={`ep-card ${isPlaying ? 'active' : ''}`}>
                    <div style={{ width: '40px', textAlign: 'center' }}>
                      {isPlaying ? (
                        <div style={{ width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%', margin: '0 auto', animation: 'pulse 1s infinite' }} />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 700, opacity: watched ? 0.3 : 0.6 }}>{ep.episode_number}</span>
                      )}
                    </div>
                    <div className="ep-thumb-container">
                      <img src={img(ep.still_path, 'w300')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: isPlaying ? 'var(--accent)' : 'var(--white)', fontSize: '15px' }}>{ep.name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.overview || 'No description.'}</div>
                    </div>
                    {watched && <div style={{ color: 'var(--accent)', fontSize: '14px' }}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SIMILAR CONTENT */}
        {similar.length > 0 && (
          <div style={{ position: 'relative', zIndex: 3, padding: '80px var(--page-x, 5vw) 0' }}>
            <h2 style={{ fontFamily: "'Outfit'", fontSize: '24px', fontWeight: 700, color: 'var(--white)', marginBottom: '24px' }}>More Like This</h2>
            <div className="scroll-row">
              {similar.map(item => (
                <ContentCard key={item.id} item={{ ...item, _type: type }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 
          0% { transform: scale(0.9); opacity: 0.5; } 
          50% { transform: scale(1.1); opacity: 1; } 
          100% { transform: scale(0.9); opacity: 0.5; } 
        }
      `}</style>

      {/* TRAILER MODAL */}
      {showTrailerModal && trailerVideo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(30px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vw'
        }} onClick={() => setShowTrailerModal(false)}>
          <div style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
             <iframe src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&modestbranding=1`} title={`${title} - Trailer`} frameBorder="0" allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      )}
    </>
  );
}
