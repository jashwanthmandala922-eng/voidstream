import { Home, Tv, Film, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useResponsive';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Tv, label: 'Series', path: '/series' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: User, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="premium-mbn-root">
      <div className="premium-mbn-bar">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`premium-mbn-tab ${active ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .premium-mbn-root {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 12px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .premium-mbn-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: rgba(10, 10, 10, 0.72);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 8px 4px;
          margin-bottom: 8px;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .premium-mbn-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          padding: 6px 14px;
          cursor: pointer;
          flex: 1;
          min-width: 0;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.3s ease;
        }

        .premium-mbn-tab span {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .premium-mbn-tab.active {
          color: var(--accent);
        }

        .premium-mbn-tab.active span {
          color: var(--accent);
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
}
