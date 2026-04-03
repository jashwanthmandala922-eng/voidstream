import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  loginUser, googleLogin, parseAuthError
} from '../services/authService';
import { setGuestMode } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { refreshGuest } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login'); 

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await loginUser(email, password);
      addToast('Welcome back to Voidstream', 'success');
      navigate('/');
    } catch (e) { setError(parseAuthError(e.code)); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      await googleLogin();
      addToast('Login successful', 'success');
      navigate('/');
    } catch (e) { setError(parseAuthError(e.code)); }
    setLoading(false);
  };

  const handleGuest = () => {
    setGuestMode();
    refreshGuest();
    addToast('Guest session started', 'info');
    navigate('/');
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    color: 'var(--white)', fontFamily: "'Inter', sans-serif",
    fontSize: '14px', padding: '14px 16px', outline: 'none',
    marginBottom: '20px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '12px'
  };

  const btnStyle = (primary = false) => ({
    width: '100%', 
    background: primary ? 'var(--white)' : 'rgba(255,255,255,0.05)',
    border: primary ? 'none' : '1px solid var(--glass-border)',
    color: primary ? 'var(--black)' : 'var(--white)',
    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '14px',
    padding: '16px', cursor: 'pointer', marginBottom: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(circle at 50% 50%, #111 0%, #000 100%)'
    }}>
      <style>{`
        .auth-card {
           width: 440px; max-width: 100%;
           background: rgba(255,255,255,0.03);
           backdrop-filter: blur(40px);
           border: 1px solid var(--glass-border);
           border-radius: 32px;
           padding: 56px 48px;
           box-shadow: 0 40px 100px rgba(0,0,0,0.5);
           animation: cardFloat 6s ease-in-out infinite;
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .auth-input:focus {
          background: rgba(255,255,255,0.08);
          border-color: var(--white);
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }
        @media (max-width: 480px) {
          .auth-card { padding: 40px 24px; border-radius: 24px; }
        }
      `}</style>
      
      <div className="auth-card">
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900, fontSize: '32px',
            color: 'var(--white)', letterSpacing: '-1px', marginBottom: '4px'
          }}>
            VOIDSTREAM
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: '14px', 
            color: 'rgba(255,255,255,0.4)', fontWeight: 500
          }}>
            Premium Streaming Experience
          </p>
        </div>

        {mode === 'login' ? (
          <>
            <input
              type="email" value={email}
              className="auth-input"
              onChange={e => setEmail(e.target.value)}
              style={inputStyle} placeholder="Email address"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />

            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password}
                className="auth-input"
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '48px' }}
                placeholder="Password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: '16px', top: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                padding: '12px 16px', marginBottom: '24px', borderRadius: '12px',
                fontFamily: "'Inter', sans-serif", fontSize: '13px',
                color: '#ff6666', textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin} disabled={loading} style={btnStyle(true)}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <button
              onClick={handleGoogle}
              style={btnStyle()}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545 11.033v3.313h7.625c-.297 1.583-1.63 4.382-5.46 4.382-3.313 0-6.012-2.75-6.012-6.128s2.699-6.128 6.012-6.128c1.884 0 3.155.803 3.864 1.488l2.637-2.54c-1.69-1.583-3.864-2.54-6.501-2.54-5.522 0-10 4.478-10 10s4.478 10 10 10c5.772 0 9.61-4.062 9.61-9.782 0-.66-.071-1.16-.16-1.666h-9.458z"/></svg>
              Continue with Google
            </button>

            <div style={{ textAlign: 'center', margin: '24px 0' }}>
               <button onClick={() => setMode('guest-confirm')} style={{
                 background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                 fontFamily: "'Inter'", fontSize: '13px', fontWeight: 600, cursor: 'pointer'
               }}>
                 Enter as Guest
               </button>
            </div>

            <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '24px 0' }} />

            <div style={{ textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>No account? </span>
              <Link to="/register" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: 700 }}>Sign Up</Link>
            </div>
          </>
        ) : (
          <div>
            <h3 style={{ 
              fontFamily: "'Outfit'", fontSize: '20px', color: 'var(--white)', 
              marginBottom: '16px', textAlign: 'center' 
            }}>Guest Access</h3>
            <p style={{ 
              fontFamily: "'Inter'", fontSize: '14px', lineHeight: 1.6, 
              color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '32px' 
            }}>
              Guest mode allows you to use Voidstream without an account, but your history and watchlist won't be synced across devices.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={handleGuest} style={btnStyle(true)}>Confirm Guest Session</button>
              <button onClick={() => setMode('login')} style={btnStyle()}>Go Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
