import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/authService';
import { exitGuestMode, getWishlist } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { throttle } from '../../services/performanceService';

export default function Navbar() {
  const { user, isGuest, isAuthed, displayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const onScroll = throttle(() => setScrolled(window.scrollY > 40), 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      const list = await getWishlist();
      setWishlistCount(list.length);
    };
    fetchCount();
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      addToast('> SESSION TERMINATED', 'info');
      navigate('/login');
    } catch { addToast('> LOGOUT FAILED', 'error'); }
  };

  const handleExitGuest = () => {
    exitGuestMode();
    addToast('> GUEST SESSION CLEARED', 'info');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/',       label: 'HOME'   },
    { path: '/movies', label: 'MOVIES' },
    { path: '/series', label: 'SERIES' },
    { path: '/anime',  label: 'ANIME'  },
  ];

  const linkStyle = (path) => ({
    fontFamily:    "'Montserrat', sans-serif",
    fontWeight:    700, fontSize: '13px',
    letterSpacing: '1.5px',
    color:         isActive(path) ? 'var(--accent)' : 'var(--white)',
    textDecoration: 'none',
    padding:       '8px 16px',
    position:      'relative',
    transition:    'all 0.3s ease',
    opacity:       isActive(path) ? 1 : 0.6,
  });

  return (
    <>
      <style>{`
        .navbar-wrapper {
          position: fixed; top: 0; left: 0; right: 0;
          z-index: 1000; padding: 12px 4vw;
          transition: transform 0.3s ease;
        }
        .navbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: var(--nav-h, 60px);
          max-width: 1400px; margin: 0 auto;
          border-radius: 40px;
          transition: background 0.4s ease, border 0.4s ease, box-shadow 0.4s ease;
        }
        .navbar.scrolled {
          background: rgba(0,0,0,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow: 0 20px 80px rgba(0,0,0,0.8);
        }
        .nav-link:hover { color: var(--accent) !important; opacity: 1 !important; }
        .nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 0%; height: 2px; background: var(--accent); transition: width 0.3s;
        }
        .nav-link.active::after { width: 40%; }
        .nav-icon-btn {
          background: none; border: none; color: var(--white);
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%;
          cursor: none; transition: all 0.3s; opacity: 0.7;
        }
        .nav-icon-btn:hover { color: var(--accent); opacity: 1; background: rgba(255,255,255,0.05); }
        .nav-icon-badge {
          position: absolute; top: 0; right: 0;
          background: var(--accent); color: var(--black);
          border-radius: 50%; width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; pointer-events: none;
        }
        @media (max-width: 768px) {
          .nav-icon-btn { cursor: auto; }
          .navbar-wrapper { padding: 8px 16px; }
          .navbar { padding: 0 16px; border-radius: 24px; }
        }
      `}</style>
      
      <div className="navbar-wrapper">
      <nav className={`navbar ${scrolled ? 'scrolled' : 'top'}`}>
        <div style={{ flex: '1 0 200px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily:    "'Montserrat', sans-serif",
              fontWeight:    900, fontSize: '24px',
              color:         'var(--white)',
              letterSpacing: '2px',
            }}>
              V<span style={{ color: 'var(--accent)', textShadow: '0 0 15px rgba(255,0,0,0.4)' }}>OID</span>STREAM
            </span>
          </Link>
        </div>

        {/* CENTER LINKS */}
        <div className="nav-links-desktop" style={{ flex: '2', gap: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {navLinks.map(l => (
            <Link 
              key={l.path} 
              to={l.path} 
              className={`nav-link ${isActive(l.path) ? 'active' : ''}`} 
              style={linkStyle(l.path)}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* RIGHT SECTION */}
        <div style={{ flex: '1 0 200px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          {/* SEARCH */}
          <button className="nav-icon-btn" onClick={() => navigate('/search')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>

          {/* WISHLIST */}
          <Link to="/wishlist" style={{ position: 'relative', textDecoration: 'none' }}>
            <button className="nav-icon-btn" style={{
              color: isActive('/wishlist') ? 'var(--white)' : undefined,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
            {wishlistCount > 0 && (
              <span className="nav-icon-badge">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          {/* HISTORY */}
          <Link to="/history" style={{ textDecoration: 'none' }}>
            <button className="nav-icon-btn" style={{
              color: isActive('/history') ? 'var(--white)' : undefined,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
          </Link>

          {/* USER DROPDOWN */}
          <div style={{ position: 'relative', marginLeft: '8px' }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                background:  dropdownOpen ? 'var(--glass-border)' : 'var(--card-bg)',
                border:      '1px solid var(--glass-border)',
                color:       'var(--white)',
                fontFamily:  "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                padding:     '6px 14px', cursor: 'pointer',
                display:     'flex', alignItems: 'center', gap: '8px',
                borderRadius: '20px', transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                background: isAuthed ? 'var(--white)' : 'var(--accent)',
              }} />
              <span className="nav-links-desktop" style={{ display: 'inline', gap: 0 }}>
                {displayName ? displayName.slice(0, 10) : 'User'}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {dropdownOpen && (
              <div style={{
                position:   'absolute', top: 'calc(100% + 12px)', right: 0,
                background: 'rgba(15,17,21,0.45)',
                backdropFilter: 'blur(32px)',
                border:     '1px solid var(--glass-border)',
                borderRadius: '16px', boxShadow: 'var(--shadow-md)',
                minWidth:   '220px',
                zIndex:     1001, padding: '8px 0', overflow: 'hidden'
              }}>
                <div style={{
                  padding:    '16px',
                  borderBottom: '1px solid var(--glass-border)',
                  fontFamily: "'Inter', sans-serif", fontSize: '12px',
                  color: 'var(--dim)',
                }}>
                  {isGuest ? (
                    <span style={{ color: 'var(--accent)' }}>Guest Session</span>
                  ) : (
                    <>
                      <div style={{ color: 'var(--white)', fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>{displayName}</div>
                      <div>{user?.email}</div>
                    </>
                  )}
                </div>
                <div style={{ padding: '8px 0' }}>
                  <DropdownLink to="/settings" label="Settings" onClick={() => setDropdownOpen(false)} />
                  <DropdownLink to="/wishlist" label="Watchlist" onClick={() => setDropdownOpen(false)} />
                  <DropdownLink to="/history"  label="History"  onClick={() => setDropdownOpen(false)} />
                </div>
                <div style={{ borderTop: '1px solid var(--glass-border)', margin: '4px 0' }} />
                {isGuest ? (
                  <div style={{ padding: '8px 0' }}>
                    <DropdownLink to="/register" label="Create Account" onClick={() => setDropdownOpen(false)} />
                    <DropdownLink to="/login"    label="Sign In"        onClick={() => setDropdownOpen(false)} />
                    <button onClick={handleExitGuest} style={ddBtnStyle('var(--white)')}>Exit Guest Mode</button>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <button onClick={handleLogout} style={ddBtnStyle('#FF3B30')}>Sign Out</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── HAMBURGER — visible on mobile via .nav-hamburger CSS class ── */}
          <button
            className="nav-hamburger nav-icon-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open menu"
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>
      </nav>
      </div>

      {/* CLICK OUTSIDE TO CLOSE DROPDOWN */}
      {dropdownOpen && (
        <div
          onClick={() => setDropdownOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        />
      )}

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1001 }}
          />
          <div style={{
            position:   'fixed', top: 0, right: 0, bottom: 0,
            width:      'min(300px, 85vw)',
            background: 'var(--card-bg)',
            borderLeft: '1px solid var(--glass-border)',
            boxShadow:  '-10px 0 40px rgba(0,0,0,0.5)',
            zIndex:     1002,
            padding:    '32px 24px',
            display:    'flex', flexDirection: 'column', gap: '8px',
            overflowY:  'auto',
          }}>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--white)', alignSelf: 'flex-end', marginBottom: '24px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            {/* USER INFO in sidebar */}
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '13px',
              color: 'var(--dim)', padding: '0 8px 24px',
              borderBottom: '1px solid var(--glass-border)', marginBottom: '16px',
            }}>
              {isGuest
                ? <span style={{ color: 'var(--accent)' }}>Guest Session</span>
                : <><div style={{ color: 'var(--white)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{displayName}</div><div>{user?.email}</div></>
              }
            </div>

            {navLinks.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)}
                style={{ ...linkStyle(l.path), display: 'block', fontSize: '18px', padding: '12px 16px', cursor: 'auto' }}>
                {l.label}
              </Link>
            ))}
            <Link to="/wishlist" onClick={() => setMobileOpen(false)}
              style={{ ...linkStyle('/wishlist'), display: 'block', fontSize: '16px', padding: '12px 16px', cursor: 'auto', marginTop: '16px' }}>
              Watchlist {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
            <Link to="/history" onClick={() => setMobileOpen(false)}
              style={{ ...linkStyle('/history'), display: 'block', fontSize: '16px', padding: '12px 16px', cursor: 'auto' }}>
              History
            </Link>
            <Link to="/settings" onClick={() => setMobileOpen(false)}
              style={{ ...linkStyle('/settings'), display: 'block', fontSize: '16px', padding: '12px 16px', cursor: 'auto' }}>
              Settings
            </Link>

            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
              {isGuest ? (
                <button onClick={handleExitGuest} style={{ ...ddBtnStyle('var(--white)'), cursor: 'auto', fontSize: '15px', padding: '16px' }}>
                  Exit Guest Mode
                </button>
              ) : (
                <button onClick={handleLogout} style={{ ...ddBtnStyle('#FF3B30'), cursor: 'auto', fontSize: '15px', padding: '16px' }}>
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function DropdownLink({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display:    'block',
      padding:    '10px 20px',
      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
      color:      'var(--dim)', textDecoration: 'none',
      transition: 'all 0.2s', borderRadius: '8px', margin: '0 8px'
    }}
      onMouseEnter={e => { e.target.style.color = 'var(--white)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { e.target.style.color = 'var(--dim)';   e.target.style.background = 'transparent'; }}
    >
      {label}
    </Link>
  );
}

const ddBtnStyle = (color) => ({
  display: 'block', width: 'calc(100% - 16px)', margin: '0 8px', borderRadius: '8px',
  padding: '10px 12px',
  background: 'none', border: 'none',
  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
  color, textAlign: 'left',
  transition: 'background 0.2s',
});
