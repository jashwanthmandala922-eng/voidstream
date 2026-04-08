import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/authService';
import { exitGuestMode } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { throttle } from '../../services/performanceService';
import { Search, User } from 'lucide-react';

export default function Navbar() {
  const { user, isGuest, displayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const lastScrollRef = useRef(0);
  const [visible, setVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = throttle(() => {
      const current = window.scrollY;
      setScrolled(current > 20);
      if (current > lastScrollRef.current && current > 100) {
        setVisible(false);
        setMobileMenuOpen(false);
      } else {
        setVisible(true);
      }
      lastScrollRef.current = current;
    }, 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
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
    { path: '/',       label: 'Home' },
    { path: '/series', label: 'TV Shows' },
    { path: '/movies', label: 'Movies' },
    { path: '/genres', label: 'Genre' },
  ];

  return (
    <>
      <nav
        className={`premium-navbar ${scrolled ? 'scrolled' : ''} ${visible ? 'visible' : 'hidden'}`}
      >
        <div className="premium-navbar-inner">
          <div className="nav-left">
            {/* LOGO */}
            <Link to="/" className="premium-logo">
              VOID<span className="premium-logo-accent">FLIX</span>
            </Link>

            {/* NAVIGATION LINKS */}
            <div className="premium-nav-links">
              {navLinks.map(l => (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`premium-nav-link ${isActive(l.path) ? 'active' : ''}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE UTILITIES */}
          <div className="premium-nav-right">
            <button className="premium-nav-icon" onClick={() => navigate('/search')} aria-label="Search">
              <Search size={18} strokeWidth={2} />
            </button>
            
            {/* USER PROFILE AVATAR / MENU */}
            <div className="premium-user-menu">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="premium-profile-avatar"
                aria-label="User profile"
              >
                <div className={`avatar-dot ${isGuest ? 'guest' : 'authed'}`} />
                <User size={18} strokeWidth={2} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="premium-dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
                  <div className="premium-dropdown">
                    <div className="premium-dropdown-header">
                      {isGuest ? (
                        <span className="premium-guest-badge">Guest Mode</span>
                      ) : (
                        <div className="premium-dropdown-name">{displayName || user?.email}</div>
                      )}
                    </div>
                    <div className="premium-dropdown-links">
                      <DropdownLink to="/settings" label="Settings" onClick={() => setDropdownOpen(false)} />
                      <DropdownLink to="/wishlist" label="Watchlist" onClick={() => setDropdownOpen(false)} />
                      <DropdownLink to="/history" label="History" onClick={() => setDropdownOpen(false)} />
                    </div>
                    <div className="premium-dropdown-divider" />
                    {isGuest ? (
                      <div className="premium-dropdown-links">
                        <button onClick={handleExitGuest} className="premium-dropdown-btn">Sign In</button>
                      </div>
                    ) : (
                      <button onClick={handleLogout} className="premium-dropdown-btn premium-dropdown-btn-danger">Sign Out</button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER */}
            <button
              className="premium-hamburger"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              <div className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
              <div className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU PANEL */}
      {mobileMenuOpen && (
        <div className="premium-mobile-menu" role="menu" aria-label="Navigation menu">
          {navLinks.map(l => (
            <Link
              key={l.path}
              to={l.path}
              role="menuitem"
              className={`premium-mobile-menu-link ${isActive(l.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .premium-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, backdrop-filter 0.4s ease;
          background: rgba(10, 10, 10, 0.25);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .premium-navbar.scrolled {
          background: rgba(8, 8, 8, 0.45);
          backdrop-filter: blur(34px) saturate(200%);
          -webkit-backdrop-filter: blur(34px) saturate(200%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        @media (max-width: 768px) {
          .premium-navbar {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            background: rgba(10, 10, 10, 0.6);
          }
          .premium-navbar.scrolled {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: rgba(10, 10, 10, 0.85);
          }
        }

        .premium-navbar.hidden {
          transform: translateY(-100%);
        }

        .premium-navbar.visible {
          transform: translateY(0);
        }

        .premium-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--page-x, 5vw);
          height: 72px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .premium-logo {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: white;
          text-decoration: none;
          letter-spacing: 1px;
        }

        .premium-logo-accent { color: var(--accent); }

        .premium-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .premium-nav-link {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .premium-nav-link:hover, .premium-nav-link.active {
          color: white;
        }

        .premium-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .premium-nav-icon {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .premium-nav-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .premium-user-menu { position: relative; }

        .premium-profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
        }

        .avatar-dot {
          position: absolute;
          bottom: 0; right: 0;
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid #0a0a0a;
        }

        .avatar-dot.authed { background: #30d158; }
        .avatar-dot.guest { background: #007aff; }

        .premium-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: rgba(20, 20, 20, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px;
          min-width: 180px;
          z-index: 1001;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .premium-dropdown-header {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 8px;
        }

        .premium-dropdown-name { font-size: 13px; font-weight: 600; color: white; }

        .premium-dropdown-link, .premium-dropdown-btn {
          display: block;
          width: 100%;
          padding: 10px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          border-radius: 6px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .premium-dropdown-link:hover, .premium-dropdown-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .premium-hamburger {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
        }

        .hamburger-bar {
          width: 20px;
          height: 2px;
          background: white;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger-bar.open:nth-child(1) { transform: translateY(4px) rotate(45deg); }
        .hamburger-bar.open:nth-child(2) { transform: translateY(-4px) rotate(-45deg); }

        @media (max-width: 768px) {
          .nav-left { gap: 20px; }
          .premium-nav-links { display: none; }
          .premium-hamburger { display: flex; }
        }

        .premium-mobile-menu {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          background: rgba(10, 10, 10, 0.98);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 16px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: mobileMenuIn 0.25s ease;
        }

        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .premium-mobile-menu-link {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .premium-mobile-menu-link:hover {
          color: var(--white);
          background: rgba(255, 255, 255, 0.04);
        }

        .premium-mobile-menu-link.active {
          color: var(--accent);
          background: rgba(0, 122, 255, 0.08);
        }
      `}</style>
    </>
  );
}

function DropdownLink({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="premium-dropdown-link">
      {label}
    </Link>
  );
}
