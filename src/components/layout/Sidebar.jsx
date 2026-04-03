import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Search, Tv, Film, Trophy, Zap, LayoutGrid, Settings, Bookmark
} from 'lucide-react';
import { getWishlist } from '../../services/storageService';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/',         icon: <Home />,     label: 'Home' },
  { path: '/search',   icon: <Search />,   label: 'Search' },
  { path: '/series',   icon: <Tv />,       label: 'TV' },
  { path: '/movie',    icon: <Film />,     label: 'Movies' },
  { path: '/sports',   icon: <Trophy />,   label: 'Sports' },
  { path: '/anime',    icon: <Zap />,       label: 'Anime' },
  { path: '/mixed',    icon: <LayoutGrid />,label: 'Categories' }
];

export default function Sidebar() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const list = await getWishlist();
      setWishCount(list.length);
    };
    fetchCount();
  }, [location.pathname]);

  return (
    <aside 
      className={`sidebar-root ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <div className="logo-spark">✦</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-icon">{item.icon}</div>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink 
          to="/wishlist" 
          className={({ isActive }) => `sidebar-link footer-link ${isActive ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <div className="sidebar-icon">
            <Bookmark />
            {wishCount > 0 && (
              <div 
                className="sidebar-badge" 
                style={{
                  position: 'absolute', top: '10px', right: '14px',
                  background: 'var(--accent)', color: 'var(--black)',
                  fontSize: '9px', fontWeight: 900, borderRadius: '50%',
                  width: '14px', height: '14px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                {wishCount}
              </div>
            )}
          </div>
          <span className="sidebar-label">Watchlist</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link footer-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-icon"><Settings /></div>
          <span className="sidebar-label">Settings</span>
        </NavLink>
        
        <NavLink 
          to="/history" 
          className={({ isActive }) => `sidebar-link footer-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-icon">
            <div className="profile-mini">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="P" />
              ) : (
                <span>{displayName?.[0] || 'G'}</span>
              )}
            </div>
          </div>
          <span className="sidebar-label">My Space</span>
        </NavLink>
      </div>
    </aside>
  );
}
