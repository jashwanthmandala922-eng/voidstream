import {
  BrowserRouter, Routes, Route, useLocation, useNavigate
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useState } from 'react';

import Background3D   from './components/three/Background3D';
import BootScreen     from './components/ui/BootScreen';
import Navbar         from './components/layout/Navbar';
import Sidebar        from './components/layout/Sidebar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getSettings } from './services/storageService';
import { useEffect }   from 'react';

import Home           from './pages/Home';
import Movies         from './pages/Movies';
import Series         from './pages/Series';
import Anime          from './pages/Anime';
import Search         from './pages/Search';
import Detail         from './pages/Detail';
import Wishlist       from './pages/Wishlist';
import History        from './pages/History';
import Settings       from './pages/Settings';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import './styles/globals.css';
import './styles/animations.css';

import { startFPSMonitor } from './services/performanceService';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenRoutes = ['/', '/login', '/register', '/movies', '/series', '/anime'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      style={{
        position: 'fixed', 
        top:  getSettings().navStyle === 'navbar' ? '90px' : '30px', 
        left: getSettings().navStyle === 'navbar' ? 'max(2vw, 20px)' : 'calc(var(--nav-w) + 20px)', 
        zIndex: 2000,
        background: 'rgba(255,255,255,0.12)', border: '1px solid var(--glass-border)',
        color: 'rgba(255,255,255,0.95)', padding: '10px 22px', fontFamily: "'Inter', sans-serif",
        fontWeight: 700, fontSize: '13px', backdropFilter: 'blur(32px)',
        borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.4px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        outline: 'none'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--white)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        e.currentTarget.style.borderColor = 'var(--accent, #2A85FF)';
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(42, 133, 255, 0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      BACK
    </button>
  );
}

function AppContent() {
  const location   = useLocation();
  const settings   = getSettings();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    // Start FPS Monitoring system (Threshold: 55 fps)
    const stopMonitor = startFPSMonitor(55);

    document.documentElement.setAttribute('data-theme', settings.uiTheme || 'hotstar');
    document.documentElement.setAttribute('data-nav',   settings.navStyle || 'sidebar');

    return () => {
      if (stopMonitor) stopMonitor();
    };
  }, [settings.uiTheme, settings.navStyle]);

  const mainPaddingLeft = !isAuthPage && settings.navStyle === 'sidebar' ? 'var(--nav-w)' : '0';
  const mainPaddingTop  = !isAuthPage && settings.navStyle === 'navbar'  ? 'var(--page-top)'  : '0';

  return (
    <>
      <Background3D />
      {!isAuthPage && (settings.navStyle === 'navbar' ? <Navbar /> : <Sidebar />)}
      <BackButton />
      <div 
        key={location.pathname} 
        className="page-enter" 
        style={{ 
          minHeight: '100vh',
          marginLeft: mainPaddingLeft,
          paddingTop:  mainPaddingTop,
          transition: 'all 0.3s ease',
          width: mainPaddingLeft !== '0' ? `calc(100% - ${mainPaddingLeft})` : '100%'
        }}
      >
        <Routes>
          {/* AUTH */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* PROTECTED */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/movies" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
          <Route path="/series" element={<ProtectedRoute><Series /></ProtectedRoute>} />
          <Route path="/anime"  element={<ProtectedRoute><Anime /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

          <Route path="/movie/:id"  element={<ProtectedRoute><Detail type="movie" /></ProtectedRoute>} />
          <Route path="/series/:id" element={<ProtectedRoute><Detail type="series" /></ProtectedRoute>} />
          <Route path="/anime/:id"  element={<ProtectedRoute><Detail type="anime" /></ProtectedRoute>} />

          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const [booted, setBooted] = useState(
    sessionStorage.getItem('vs_booted') === 'true'
  );

  const handleBootComplete = () => {
    sessionStorage.setItem('vs_booted', 'true');
    setBooted(true);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {!booted
            ? <BootScreen onComplete={handleBootComplete} />
            : <AppContent />
          }
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
