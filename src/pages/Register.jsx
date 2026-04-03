import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, parseAuthError } from '../services/authService';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await registerUser(email, password, username);
      addToast('Account created! Please check your email for verification.', 'success');
      navigate('/');
    } catch (e) { setError(parseAuthError(e.code)); }
    setLoading(false);
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
           width: 460px; max-width: 100%;
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
            Create Your Account
          </p>
        </div>

        <input
          type="text" value={username}
          className="auth-input"
          onChange={e => setUsername(e.target.value)}
          style={inputStyle} placeholder="Display Name"
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
        />

        <input
          type="email" value={email}
          className="auth-input"
          onChange={e => setEmail(e.target.value)}
          style={inputStyle} placeholder="Email Address"
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
        />

        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'} value={password}
            className="auth-input"
            onChange={e => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: '48px', marginBottom: password.length > 0 ? '8px' : '20px' }}
            placeholder="Create Password"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
          <button onClick={() => setShowPass(s => !s)}
            style={{ position: 'absolute', right: '16px', top: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}>
            {showPass ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* PASSWORD STRENGTH */}
        {password.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '0 4px' }}>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (password.length / 12) * 100)}%`,
                background: password.length < 8 ? '#ff4444' : password.length < 12 ? '#ffb400' : 'var(--accent)',
                transition: 'all 0.4s ease',
                boxShadow: `0 0 10px ${password.length < 8 ? '#ff4444' : password.length < 12 ? '#ffb400' : 'var(--accent)'}`
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
               <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>STRENGTH</span>
               <span style={{ fontSize: '10px', color: password.length < 8 ? '#ff4444' : password.length < 12 ? '#ffb400' : 'var(--accent)', fontWeight: 700 }}>
                 {password.length < 8 ? 'WEAK' : password.length < 12 ? 'GOOD' : 'STRONG'}
               </span>
            </div>
          </div>
        )}

        <input
          type="password" value={confirm}
          className="auth-input"
          onChange={e => setConfirm(e.target.value)}
          style={{ ...inputStyle, borderBottomColor: confirm && confirm !== password ? '#ff4444' : 'var(--glass-border)' }}
          placeholder="Confirm Password"
          onKeyDown={e => e.key === 'Enter' && handleRegister()}
        />

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
          onClick={handleRegister} disabled={loading} style={btnStyle(true)}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? 'Creating Account...' : 'Continue'}
        </button>

        <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '24px 0' }} />

        <div style={{ textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
