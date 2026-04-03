export default function ApiKeyBanner() {
  return (
    <div style={{
      background: 'rgba(255, 149, 0, 0.05)',
      border:     '1px solid rgba(255, 149, 0, 0.2)',
      borderRadius: '20px',
      padding:    '20px 28px', marginBottom: '32px',
      display:    'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(255, 149, 0, 0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize:   '15px', color: 'var(--white)', fontWeight: 700,
            letterSpacing: '-0.2px'
          }}>
            TMDB Configuration Required
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500,
            lineHeight: 1.5
          }}>
            Missing API Key. Set <code style={{ color: '#FFB400', background: 'rgba(255,180,0,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>REACT_APP_TMDB_KEY</code> in your .env and restart.
          </span>
        </div>
      </div>
      <a
        href="https://www.themoviedb.org/settings/api"
        target="_blank" rel="noreferrer"
        style={{
          fontFamily:     "'Inter', sans-serif", fontWeight: 700,
          fontSize:       '12px', color: '#111',
          background:     '#FF9500', padding: '10px 20px', borderRadius: '24px',
          textDecoration: 'none', flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 15px rgba(255, 149, 0, 0.3)'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 149, 0, 0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 149, 0, 0.3)'; }}
      >
        Get Free Key
      </a>
    </div>
  );
}
