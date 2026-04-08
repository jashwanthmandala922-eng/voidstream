import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMovie, getTVShow, getSeason, getSimilarMovies, getSimilarTV, img } from '../services/tmdbService';
import { isWishlisted, addToWishlist, removeFromWishlist, getHistory } from '../services/storageService';
import ContentCard from '../components/cards/ContentCard';
import NeuralPlayer from '../components/content/NeuralPlayer';
import { useToast } from '../context/ToastContext';
import { Play, Plus, Check, Star, Clock, Globe } from 'lucide-react';

export default function Detail({ type }) {
  const { id } = useParams();
  const { addToast } = useToast();
  const playerRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [season, setSeason] = useState(null);
  const [selSeason, setSelSeason] = useState(1);
  const [playing, setPlaying] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [overflowExp, setOverflowExp] = useState(false);
  const [showInlineTrailer, setShowInlineTrailer] = useState(false);

  const mediaId = parseInt(id);
  const isMovie = type === 'movie';
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setLoading(true); setPlaying(null);
    const fetchDetail = isMovie ? getMovie(mediaId) : getTVShow(mediaId);
    const fetchSimilar = isMovie ? getSimilarMovies(mediaId) : getSimilarTV(mediaId);
    const fetchStatus = isWishlisted(mediaId, type);
    const fetchHist = getHistory();

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

  const handleSeasonChange = async (num) => {
    setSelSeason(num);
    try {
      const data = await getSeason(mediaId, num);
      setSeason(data);
    } catch (err) {
      console.error('Failed to fetch season data:', err);
      setSeason(null);
    }
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
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleWishlist = () => {
    if (!detail) return;
    const data = { id: mediaId, type, title: detail.title || detail.name, poster: img(detail.poster_path), rating: detail.vote_average, year: (detail.release_date || detail.first_air_date || '').split('-')[0] };
    if (wishlisted) { removeFromWishlist(mediaId, type); setWishlisted(false); addToast('Removed from Watchlist', 'info'); }
    else { addToWishlist(data); setWishlisted(true); addToast('Added to Watchlist', 'success'); }
  };

  const isEpWatched = (epNum) => history.some(h => h.id === mediaId && h.season === selSeason && h.episode === epNum);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s infinite linear' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!detail) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '16px', fontWeight: 300 }}>Content not available.</div>
    </div>
  );

  const title = detail?.title || detail?.name;
  const year = (detail?.release_date || detail?.first_air_date || '').split('-')[0];
  const runtime = detail?.runtime ? `${detail.runtime}m` : detail?.number_of_seasons ? `${detail.number_of_seasons} Season${detail.number_of_seasons > 1 ? 's' : ''}` : '';
  const genres = detail?.genres || [];

  return (
    <>
      <div className="detail-root">
        {/* BACKDROP */}
        <div className="detail-backdrop">
          <div className="detail-backdrop-img" style={{ backgroundImage: `url(${img(detail.backdrop_path, 'w1280')})` }} />
          <div className="detail-backdrop-gradient" />
        </div>

        {/* INFO PANEL */}
        <div className="detail-panel">
          <div className="detail-poster">
            <img src={img(detail.poster_path, 'w500')} alt={title} />
          </div>

          <div className="detail-info">
            <div className="detail-type">
              {type.toUpperCase()} <span className="detail-type-sep">·</span> {year}
            </div>

            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta-row">
              <div className="detail-rating-pill">
                <Star size={12} fill="#FFB400" color="#FFB400" />
                {detail.vote_average?.toFixed(1)}
              </div>
              {runtime && (
                <div className="detail-meta-item">
                  <Clock size={12} />
                  {runtime}
                </div>
              )}
              <div className="detail-meta-item">
                <Globe size={12} />
                {detail.original_language?.toUpperCase()}
              </div>
            </div>

            <div className="detail-genres">
              {genres.map(g => (
                <span key={g.id} className="detail-genre-pill">{g.name}</span>
              ))}
            </div>

            <p className={`detail-overview ${overflowExp ? 'expanded' : ''}`}>{detail.overview}</p>
            {detail.overview?.length > 250 && (
              <button className="detail-read-more" onClick={() => setOverflowExp(e => !e)}>
                {overflowExp ? 'Show Less' : 'Read More'}
              </button>
            )}

            <div className="detail-actions">
              <button className="detail-btn-primary" onClick={handleWatchNow}>
                <Play size={16} fill="currentColor" />
                Watch Now
              </button>
              {trailerVideo && (
                <button 
                  className="detail-btn-secondary"
                  onClick={() => setShowInlineTrailer(p => !p)}
                >
                  {showInlineTrailer ? 'Hide Trailer' : 'Trailer'}
                </button>
              )}
              <button className="detail-btn-secondary" onClick={handleWishlist}>
                {wishlisted ? <><Check size={14} strokeWidth={2} /> Watchlisted</> : <><Plus size={14} strokeWidth={2} /> Watchlist</>}
              </button>
            </div>
          </div>
        </div>

        {/* INLINE TRAILER */}
        {showInlineTrailer && trailerVideo && (
          <div className="detail-inline-trailer">
            <div className="detail-inline-trailer-header">
              <h3>Trailer</h3>
              <button className="detail-inline-trailer-close" onClick={() => setShowInlineTrailer(false)}>×</button>
            </div>
            <div className="detail-inline-trailer-wrap">
              <iframe
                src={`https://www.youtube.com/embed/${trailerVideo.key}`}
                title="Trailer"
                frameBorder="0"
                allowFullScreen
                className="detail-inline-trailer-iframe"
              />
            </div>
          </div>
        )}

        {/* PLAYER */}
        <div ref={playerRef} className="detail-player-wrap">
          {playing && (
            <NeuralPlayer 
              tmdbId={mediaId} 
              type={isMovie ? 'movie' : 'tv'} 
              season={playing.season} 
              episode={playing.episode} 
              episodeTitle={playing.title} 
              poster={img(detail.poster_path)} 
              title={title} 
              mediaType={type} 
              year={year} 
            />
          )}
        </div>

        {/* EPISODES */}
        {!isMovie && (
          <div id="episode-list" className="detail-episodes">
            <div className="detail-episodes-header">
              <h2>Episodes</h2>
              <select value={selSeason} onChange={e => handleSeasonChange(parseInt(e.target.value))} className="detail-season-select">
                {Array.from({ length: detail.number_of_seasons || 1 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="detail-episodes-list">
              {(season?.episodes || []).map((ep) => {
                const isPlaying = playing?.season === selSeason && playing?.episode === ep.episode_number;
                const watched = isEpWatched(ep.episode_number);
                return (
                  <div key={ep.id} className={`detail-ep-card ${isPlaying ? 'active' : ''}`} onClick={() => handleEpisodePlay(ep)}>
                    <div className="detail-ep-num">{isPlaying ? <div className="detail-ep-dot" /> : <span>{ep.episode_number}</span>}</div>
                    <div className="detail-ep-thumb">
                      <img src={img(ep.still_path, 'w300')} alt="" />
                    </div>
                    <div className="detail-ep-info">
                      <div className="detail-ep-title">{ep.name}</div>
                      <div className="detail-ep-desc">{ep.overview || 'No description.'}</div>
                    </div>
                    {watched && <div className="detail-ep-watched">✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SIMILAR */}
        {similar.length > 0 && (
          <div className="detail-similar">
            <h2>More Like This</h2>
            <div className="scroll-row">
              {similar.map(item => (
                <ContentCard key={item.id} item={{ ...item, _type: type }} />
              ))}
            </div>
          </div>
        )}
      </div>


      <style>{`
        .detail-root {
          min-height: 100vh;
          background: #0a0a0a;
          padding-bottom: 100px;
        }

        .detail-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 100vh;
          z-index: 0;
          overflow: hidden;
        }

        .detail-backdrop-img {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center top;
          filter: brightness(0.3) saturate(0.7);
          z-index: 1;
        }

        .detail-backdrop-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.7) 30%, transparent 70%);
          z-index: 3;
        }

        .detail-panel {
          display: flex;
          gap: 40px;
          flex-wrap: wrap;
          padding: clamp(40px, 8vw, 80px) var(--page-x, 5vw) 0;
          position: relative;
          z-index: 4;
        }

        .detail-poster {
          width: clamp(140px, 20vw, 240px);
          flex-shrink: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        }

        .detail-poster img {
          width: 100%;
          display: block;
        }

        .detail-info {
          flex: 1;
          min-width: min(320px, 100%);
          padding: clamp(16px, 3vw, 32px);
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(30px) saturate(150%);
          -webkit-backdrop-filter: blur(30px) saturate(150%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .detail-type {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 12px;
        }

        .detail-type-sep { opacity: 0.3; }

        .detail-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: clamp(24px, 4vw, 40px);
          color: var(--white);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .detail-meta-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .detail-rating-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }

        .detail-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.4);
        }

        .detail-genres {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .detail-genre-pill {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .detail-overview {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.55);
          max-width: 700px;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .detail-overview.expanded {
          -webkit-line-clamp: unset;
          line-clamp: unset;
          overflow: visible;
        }

        .detail-read-more {
          background: none;
          border: none;
          color: var(--accent);
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          margin-top: 6px;
          margin-bottom: 20px;
          cursor: pointer;
          padding: 4px 0;
        }

        .detail-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .detail-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.85), rgba(0, 100, 220, 0.9));
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 6px 24px rgba(0, 122, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .detail-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(0, 122, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .detail-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.35s ease;
        }

        .detail-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .detail-player-wrap {
          position: relative;
          z-index: 4;
          padding: 40px var(--page-x, 5vw) 0;
        }

        .detail-episodes {
          position: relative;
          z-index: 4;
          padding: 48px var(--page-x, 5vw) 0;
        }

        .detail-episodes-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .detail-episodes-header h2 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 20px;
          color: var(--white);
          letter-spacing: -0.01em;
        }

        .detail-season-select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--white);
          padding: 8px 16px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        .detail-episodes-list {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          overflow: hidden;
        }

        .detail-ep-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: background 0.25s ease;
        }

        .detail-ep-card:hover { background: rgba(255, 255, 255, 0.02); }
        .detail-ep-card:last-child { border-bottom: none; }
        .detail-ep-card.active { background: rgba(0, 122, 255, 0.06); border-left: 3px solid var(--accent); }

        .detail-ep-num {
          width: 32px;
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }

        .detail-ep-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          margin: 0 auto;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .detail-ep-thumb {
          width: 120px;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.03);
        }

        .detail-ep-thumb img {
          width: 100%; height: 100%;
          object-fit: cover;
        }

        .detail-ep-info { flex: 1; min-width: 0; }

        .detail-ep-title {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: var(--white);
          margin-bottom: 4px;
        }

        .detail-ep-card.active .detail-ep-title { color: var(--accent); }

        .detail-ep-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.35);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .detail-ep-watched {
          color: var(--accent);
          font-size: 14px;
          flex-shrink: 0;
        }

        .detail-similar {
          position: relative;
          z-index: 4;
          padding: 56px var(--page-x, 5vw) 0;
        }

        .detail-similar h2 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 20px;
          color: var(--white);
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }

        .detail-trailer-modal {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5vw;
          animation: modalFadeIn 0.3s ease;
        }

        .detail-trailer-inner {
          width: 100%;
          max-width: 1100px;
          aspect-ratio: 16/9;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
        }

        .detail-trailer-iframe {
          width: 100%;
          height: 100%;
        }

        .detail-inline-trailer {
          position: relative;
          z-index: 4;
          margin: 0 var(--page-x, 5vw) 40px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          overflow: hidden;
          animation: trailerSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes trailerSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .detail-inline-trailer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .detail-inline-trailer-header h3 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: var(--white);
          margin: 0;
        }

        .detail-inline-trailer-close {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .detail-inline-trailer-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .detail-inline-trailer-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        .detail-inline-trailer-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .detail-panel {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
          }
          .detail-actions { justify-content: center; }
          .detail-ep-thumb { width: 90px; }
          .detail-meta-row { justify-content: center; }
          .detail-genres { justify-content: center; }
        }
      `}</style>
    </>
  );
}
