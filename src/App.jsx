import {
  BrowserRouter, Routes, Route, useLocation
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useState, useEffect } from 'react';

import Background3D   from './components/three/Background3D';
import BootScreen     from './components/ui/BootScreen';
import Navbar         from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import AIConcierge    from './components/ui/AIConcierge';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { getSettings } from './services/storageService';

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
import { useIsMobile } from './hooks/useResponsive';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

function AppContent() {
  const location = useLocation();
  const settings = getSettings();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isMobile = useIsMobile();

  useEffect(() => {
    const stopMonitor = startFPSMonitor(55);
    document.documentElement.setAttribute('data-theme', settings.uiTheme || 'hotstar');
    return () => { if (stopMonitor) stopMonitor(); };
  }, [settings.uiTheme]);

  return (
    <>
      <Background3D />
      {!isAuthPage && <Navbar />}
      {isMobile && !isAuthPage && <MobileBottomNav />}
      {isMobile && !isAuthPage && <AIConcierge />}
      <div
        className="page-enter"
        style={{
          minHeight: '100vh',
          paddingTop: !isAuthPage ? '64px' : '0',
        }}
      >
        <Routes>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
