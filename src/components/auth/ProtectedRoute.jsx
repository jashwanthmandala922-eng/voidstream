import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return (
    <div style={{
      height:         '100vh', display: 'flex',
      alignItems:     'center', justifyContent: 'center',
      fontFamily:     "'Share Tech Mono', monospace",
      color:          'var(--green)', fontSize: '16px', gap: '8px'
    }}>
      &gt; VERIFYING SESSION...
      <span className="cursor-blink">█</span>
    </div>
  );

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
