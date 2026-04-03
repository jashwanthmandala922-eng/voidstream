import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discoverMovies, getMovieGenres } from '../services/tmdbService';
import ContentCard from '../components/cards/ContentCard';

const SORT_OPTIONS = [
  { value: 'popularity.desc',     label: 'MOST POPULAR' },
  { value: 'vote_average.desc',   label: 'TOP RATED' },
  { value: 'release_date.desc',   label: 'NEWEST FIRST' },
  { value: 'release_date.asc',    label: 'OLDEST FIRST' }
];

export default function Movies() {
  const [] = useSearchParams();
  const [items,    setItems]    = useState([]);
  const [genres,   setGenres]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [sort,     setSort]     = useState('popularity.desc');
  const [selGenre, setSelGenre] = useState('');
  const [year,     setYear]     = useState('');

  useEffect(() => { getMovieGenres().then(d => setGenres(d.genres || [])); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await discoverMovies({
        sort_by:             sort,
        with_genres:         selGenre || undefined,
        primary_release_year: year || undefined,
        page
      });
      if (page === 1) setItems(data.results || []);
      else setItems(prev => [...prev, ...(data.results || [])]);
      
      setTotalPgs(Math.min(data.total_pages || 1, 500));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, sort, selGenre, year]);

  useEffect(() => { setPage(1); }, [sort, selGenre, year]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const filterStyle = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
    color: 'var(--white)', fontFamily: "'Inter', sans-serif", fontWeight: 500,
    fontSize: '13px', padding: '10px 18px', outline: 'none',
    borderRadius: '24px', backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'calc(var(--nav-h, 60px) + 64px) var(--page-x, 5vw) 120px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 style={{ 
          fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 8vw, 48px)', 
          color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '16px' 
        }}>
          Movies
        </h1>
        <div style={{ width: '40px', height: '4px', background: 'var(--accent)', borderRadius: '2px', margin: '0 auto' }} />
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={filterStyle}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'var(--glass-border)'; }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#111', color: '#fff' }}>{o.label}</option>)}
          </select>
        </div>

        <select value={selGenre} onChange={e => setSelGenre(e.target.value)} style={filterStyle}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'var(--glass-border)'; }}
        >
          <option value="" style={{ background: '#111', color: '#fff' }}>ALL GENRES</option>
          {genres.map(g => <option key={g.id} value={g.id} style={{ background: '#111', color: '#fff' }}>{g.name.toUpperCase()}</option>)}
        </select>

        <input
          type="number" value={year}
          onChange={e => setYear(e.target.value)}
          placeholder="Year..."
          style={{ ...filterStyle, width: '120px' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'var(--glass-border)'; }}
        />

        {(sort !== 'popularity.desc' || selGenre || year) && (
          <button
            onClick={() => { setSort('popularity.desc'); setSelGenre(''); setYear(''); }}
            style={{ ...filterStyle, color: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', backdropFilter: 'none' }}
          >Reset Filters</button>
        )}
      </div>

      {/* GRID */}
      {items.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', paddingTop: '100px', fontFamily: "'Inter'", color: 'var(--dim)', fontSize: '18px' }}>
          No results found for your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-w, 200px), 1fr))', gap: 'clamp(16px, 3vw, 32px)', justifyContent: 'center' }}>
          {items.map(item => (
            <ContentCard key={item.id} item={{ ...item, _type: 'movie' }} />
          ))}
          {loading && Array(12).fill(null).map((_, i) => (
            <div key={i} style={{
              width: '100%', aspectRatio: '2/3', background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px', border: '1px solid var(--glass-border)',
              animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%',
              backgroundImage: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)'
            }} />
          ))}
        </div>
      )}

      {/* LOAD MORE */}
      {!loading && page < totalPgs && (
        <div style={{ textAlign: 'center', marginTop: '64px' }}>
          <button
            onClick={() => setPage(p => p + 1)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
              color: 'var(--white)', fontFamily: "'Inter', sans-serif",
              fontWeight: 600, fontSize: '15px', padding: '16px 48px', cursor: 'pointer',
              borderRadius: '32px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--white)'; e.target.style.color = '#000'; e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--white)'; e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            Load More (Page {page + 1})
          </button>
        </div>
      )}
    </div>
  );
}
