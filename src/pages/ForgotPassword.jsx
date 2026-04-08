import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword, parseAuthError } from '../services/authService';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [typed,   setTyped]   = useState('');

  useEffect(() => {
    const sub = '> PASSWORD RECOVERY MODULE_';
    let i = 0;
    const t = setInterval(() => {
      setTyped(sub.slice(0, i + 1)); i++;
      if (i >= sub.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, []);

  const handleReset = async () => {
    if (!email) { setError('EMAIL REQUIRED'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      addToast('> RECOVERY EMAIL SENT ✓', 'success');
    } catch (e) { setError(parseAuthError(e.code)); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="clip-lg" style={{
        width: '440px', maxWidth: '95vw',
        background: 'var(--card-bg)',
        border: '1px solid var(--green)',
        boxShadow: 'var(--glow-lg)',
        padding: '48px 40px',
        animation: 'float 5s ease-in-out infinite'
      }}>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: '24px', color: 'var(--green)', textAlign: 'center', textShadow: 'var(--glow-md)', marginBottom: '8px', letterSpacing: '2px' }}>
          VOIDFLIX
        </h1>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: 'var(--dim)', textAlign: 'center', marginBottom: '36px' }}>
          {typed}<span className="cursor-blink" style={{ color: 'var(--green)' }}>█</span>
        </p>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '14px', color: 'var(--green)', lineHeight: 1.8, marginBottom: '24px' }}>
              &gt; RECOVERY LINK SENT<br />
              &gt; CHECK YOUR EMAIL INBOX
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '32px' }}>
              {email}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid var(--green)', color: 'var(--green)',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '14px',
                padding: '14px', cursor: 'pointer',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--green)'; e.target.style.color = '#000'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--green)'; }}
            >
              ← BACK TO LOGIN
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', lineHeight: 1.8, marginBottom: '24px' }}>
              &gt; ENTER REGISTERED EMAIL ADDRESS<br />
              &gt; RECOVERY LINK WILL BE DISPATCHED
            </p>

            <label style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--dim)', display: 'block', marginBottom: '4px' }}>
              &gt; EMAIL_
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderBottomColor = 'var(--green)'}
              onBlur={e => e.target.style.borderBottomColor = 'var(--border)'}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                color: 'var(--white)', fontFamily: "'Share Tech Mono', monospace",
                fontSize: '14px', padding: '10px 4px', outline: 'none',
                marginBottom: '20px', transition: 'border-color 0.2s'
              }}
              placeholder="user@domain.com"
              onKeyDown={e => e.key === 'Enter' && handleReset()}
            />

            {error && (
              <div style={{
                background: 'rgba(255,0,60,0.08)', borderLeft: '2px solid var(--red)',
                padding: '8px 12px', marginBottom: '16px',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--red)'
              }}>
                &gt; ERROR: {error}
              </div>
            )}

            <button
              onClick={handleReset} disabled={loading}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid var(--green)', color: 'var(--green)',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '14px',
                padding: '14px', cursor: 'pointer', marginBottom: '24px',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--green)'; e.target.style.color = '#000'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--green)'; }}
            >
              {loading ? '> SENDING...' : '> SEND RECOVERY EMAIL'}
            </button>

            <div style={{ textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px' }}>
              <Link to="/login" style={{ color: 'var(--dim)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--green)'}
                onMouseLeave={e => e.target.style.color = 'var(--dim)'}
              >← BACK TO LOGIN</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
