import { useState } from 'react';
import {
  getSettings, saveSettings, resetSettings,
  getStorageSize, clearWishlist, clearHistory,
  exportWishlist, exportHistory, importData
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { exitGuestMode } from '../services/storageService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';

const CATEGORIES = [
  { id: 'appearance', label: '[01] APPEARANCE' },
  { id: 'playback',   label: '[02] PLAYBACK' },
  { id: 'content',    label: '[03] CONTENT' },
  { id: 'account',    label: '[04] ACCOUNT' },
  { id: 'data',       label: '[05] DATA' },
  { id: 'about',      label: '[06] ABOUT' }
];

const ACCENT_COLORS = ['#00FF41', '#00D4FF', '#FF003C', '#FFB400', '#9B59B6'];

function Toggle({ value, onChange, color = 'var(--green)', label = '' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      style={{
        width: '44px', height: '22px', borderRadius: '12px',
        background:  value ? color : 'rgba(96,96,96,0.3)',
        border:      `1px solid ${value ? color : 'var(--dim)'}`,
        cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease',
        boxShadow:   value ? `0 0 8px ${color}` : 'none', flexShrink: 0,
        padding: 0, outline: 'none'
      }}
      onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px var(--white)`}
      onBlur={e => e.currentTarget.style.boxShadow = value ? `0 0 8px ${color}` : 'none'}
    >
      <div style={{
        position:   'absolute', top: '3px',
        left:       value ? '24px' : '3px',
        width:      '14px', height: '14px',
        background: value ? '#000' : 'var(--dim)',
        borderRadius: '50%', transition: 'left 0.3s ease'
      }} />
    </button>
  );
}

export default function Settings() {
  const { user, isGuest, displayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [settings,     setSettings]     = useState(getSettings());
  const [activeTab,    setActiveTab]     = useState('appearance');
  const [saveStatus,   setSaveStatus]    = useState('idle'); // idle | saving | saved
  const [storage,      setStorage]       = useState(getStorageSize());
  const [editingName,  setEditingName]   = useState(false);
  const [newName,      setNewName]       = useState(displayName || '');
  const [showClearW,   setShowClearW]    = useState(false);
  const [showClearH,   setShowClearH]    = useState(false);
  const [showReset,    setShowReset]     = useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'accentColor') {
      document.documentElement.style.setProperty('--green', value);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    saveSettings(settings);
    setStorage(getStorageSize());
    await new Promise(r => setTimeout(r, 1000));
    setSaveStatus('saved');
    addToast('> SETTINGS.CFG UPDATED ✓', 'success');
    await new Promise(r => setTimeout(r, 2000));
    setSaveStatus('idle');
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !user) return;
    try {
      await updateProfile(user, { displayName: newName.trim() });
      setEditingName(false);
      addToast('> DISPLAY NAME UPDATED ✓', 'success');
    } catch { addToast('> UPDATE FAILED', 'error'); }
  };

  const handleLogout = async () => {
    await logoutUser(); navigate('/login');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      addToast(ok ? '> DATA IMPORTED ✓' : '> IMPORT FAILED — INVALID FILE', ok ? 'success' : 'error');
    };
    reader.readAsText(file);
  };

  const handleResetSettings = () => {
    resetSettings();
    setSettings(getSettings());
    document.documentElement.style.setProperty('--green', '#00FF41');
    setShowReset(false);
    addToast('> SETTINGS RESET TO DEFAULT', 'info');
  };

  const sectionTitle = (t) => (
    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: 'var(--green)', letterSpacing: '2px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
      &gt; {t}
    </div>
  );

  const row = (label, control) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: 'var(--white)' }}>{label}</span>
      {typeof control.type === 'function' && control.type.name === 'Toggle' 
        ? Object.assign({}, control, { props: { ...control.props, label } }) 
        : control}
    </div>
  );

  const btnAction = (label, onClick, color = 'var(--dim)') => (
    <button onClick={onClick} className="clip-sm" style={{
      background: 'transparent', border: `1px solid ${color}`,
      color, fontFamily: "'Share Tech Mono', monospace", fontSize: '12px',
      padding: '10px 20px', cursor: 'pointer', width: '100%', marginBottom: '12px',
      textAlign: 'left', transition: 'all 0.2s', outline: 'none'
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.color = 'var(--white)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color; }}
      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px var(--white)`; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      &gt; {label}
    </button>
  );

  const renderPanel = () => {
    switch (activeTab) {
      case 'appearance': return (
        <div>
          {sectionTitle('APPEARANCE')}

          {/* ACCENT COLOR */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>ACCENT COLOR</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => updateSetting('accentColor', c)} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: c, cursor: 'pointer', border: `2px solid ${settings.accentColor === c ? '#fff' : 'transparent'}`,
                  boxShadow:  settings.accentColor === c ? `0 0 12px ${c}` : 'none',
                  transform:  settings.accentColor === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.2s'
                }} />
              ))}
            </div>
          </div>

          {/* TOGGLES */}
          {row('SCANLINE OVERLAY',  <Toggle value={settings.scanlines}       onChange={v => updateSetting('scanlines', v)} />)}
          {row('MATRIX PARTICLES',  <Toggle value={settings.matrixParticles} onChange={v => updateSetting('matrixParticles', v)} />)}
          {row('WIREFRAME SHAPES',  <Toggle value={settings.wireframeShapes} onChange={v => updateSetting('wireframeShapes', v)} />)}
          {row('3D CARD TILT',      <Toggle value={settings.cardTilt}        onChange={v => updateSetting('cardTilt', v)} />)}
          {row('CARD GLOW EFFECT',  <Toggle value={settings.cardGlow}        onChange={v => updateSetting('cardGlow', v)} />)}
          {row('CUSTOM CURSOR',     <Toggle value={settings.customCursor}    onChange={v => updateSetting('customCursor', v)} />)}
          {row('TRAILER ON HOVER',  <Toggle value={settings.trailerOnHover ?? true}  onChange={v => updateSetting('trailerOnHover', v)} />)}

          {/* NAVIGATION STYLE */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>NAVIGATION STYLE</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['sidebar', 'navbar'].map(v => (
                <button key={v} onClick={() => updateSetting('navStyle', v)} style={{
                  background:    settings.navStyle === v ? 'var(--green)' : 'transparent',
                  border:        `1px solid ${settings.navStyle === v ? 'var(--green)' : 'var(--border)'}`,
                  color:         settings.navStyle === v ? '#000' : 'var(--dim)',
                  fontFamily:    "'Share Tech Mono', monospace", fontSize: '11px',
                  padding:       '6px 14px', cursor: 'pointer',
                  clipPath:      'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                  transition:    'all 0.2s', textTransform: 'uppercase'
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* INTERFACE THEME */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>INTERFACE THEME</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['hotstar', 'cineby'].map(v => (
                <button key={v} onClick={() => updateSetting('uiTheme', v)} style={{
                  background:    settings.uiTheme === v ? 'var(--green)' : 'transparent',
                  border:        `1px solid ${settings.uiTheme === v ? 'var(--green)' : 'var(--border)'}`,
                  color:         settings.uiTheme === v ? '#000' : 'var(--dim)',
                  fontFamily:    "'Share Tech Mono', monospace", fontSize: '11px',
                  padding:       '6px 14px', cursor: 'pointer',
                  clipPath:      'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                  transition:    'all 0.2s', textTransform: 'uppercase'
                }}>{v === 'hotstar' ? 'HOTSTAR BLUE' : 'CINEBY RED'}</button>
              ))}
            </div>
          </div>

          {/* ANIMATION LEVEL */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>ANIMATION LEVEL</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['full', 'normal', 'reduced', 'none'].map(v => (
                <button key={v} onClick={() => updateSetting('animationLevel', v)} style={{
                  background:    settings.animationLevel === v ? 'var(--green)' : 'transparent',
                  border:        `1px solid ${settings.animationLevel === v ? 'var(--green)' : 'var(--border)'}`,
                  color:         settings.animationLevel === v ? '#000' : 'var(--dim)',
                  fontFamily:    "'Share Tech Mono', monospace", fontSize: '11px',
                  padding:       '6px 14px', cursor: 'pointer',
                  clipPath:      'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                  transition:    'all 0.2s', textTransform: 'uppercase'
                }}>{v}</button>
              ))}
            </div>
          </div>
        </div>
      );

      case 'playback': return (
        <div>
          {sectionTitle('PLAYBACK')}
          {row('AUTO-PLAY NEXT',     <Toggle value={settings.autoplayNext}     onChange={v => updateSetting('autoplayNext', v)} />)}
          {row('REMEMBER POSITION',  <Toggle value={settings.rememberPosition} onChange={v => updateSetting('rememberPosition', v)} />)}
          {row('THEATER MODE',       <Toggle value={settings.theaterMode}      onChange={v => updateSetting('theaterMode', v)} />)}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>DEFAULT QUALITY</div>
            <select value={settings.defaultQuality} onChange={e => updateSetting('defaultQuality', e.target.value)} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              color: 'var(--white)', fontFamily: "'Share Tech Mono', monospace",
              fontSize: '13px', padding: '8px 14px', cursor: 'pointer', outline: 'none',
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
            }}>
              {['auto', '1080p', '720p', '480p', '360p'].map(q => (
                <option key={q} value={q}>{q.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      );

      case 'content': return (
        <div>
          {sectionTitle('CONTENT PREFERENCES')}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>DEFAULT TAB</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['mixed', 'movies', 'series', 'anime'].map(v => (
                <button key={v} onClick={() => updateSetting('defaultTab', v)} style={{
                  background: settings.defaultTab === v ? 'var(--green)' : 'transparent',
                  border: `1px solid ${settings.defaultTab === v ? 'var(--green)' : 'var(--border)'}`,
                  color: settings.defaultTab === v ? '#000' : 'var(--dim)',
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
                  padding: '6px 14px', cursor: 'pointer', textTransform: 'uppercase',
                  clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                  transition: 'all 0.2s'
                }}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)', marginBottom: '12px' }}>LANGUAGE FILTER</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[['all', 'ALL'], ['en', 'ENGLISH'], ['ja', 'JAPANESE'], ['ko', 'KOREAN'], ['es', 'SPANISH'], ['fr', 'FRENCH']].map(([v, l]) => (
                <button key={v} onClick={() => updateSetting('language', v)} style={{
                  background: settings.language === v ? 'var(--green)' : 'transparent',
                  border: `1px solid ${settings.language === v ? 'var(--green)' : 'var(--border)'}`,
                  color: settings.language === v ? '#000' : 'var(--dim)',
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
                  padding: '6px 14px', cursor: 'pointer',
                  clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
                  transition: 'all 0.2s'
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      );

      case 'account': return (
        <div>
          {sectionTitle('ACCOUNT')}
          {isGuest ? (
            <div>
              <div className="clip-sm" style={{ background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.3)', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: '#FFB400', lineHeight: 1.8 }}>
                  &gt; GUEST SESSION ACTIVE<br />
                  &gt; LIMITED FUNCTIONALITY
                </p>
              </div>
              {btnAction('CREATE ACCOUNT', () => navigate('/register'), 'var(--green)')}
              {btnAction('SIGN IN', () => navigate('/login'), 'var(--cyan)')}
              {btnAction('EXIT GUEST MODE', () => { exitGuestMode(); navigate('/login'); }, 'var(--red)')}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '28px', padding: '16px', border: '1px solid var(--border)' }}>
                {/* DISPLAY NAME */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--dim)', marginBottom: '8px' }}>DISPLAY NAME</div>
                  {editingName ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        style={{
                          flex: 1, background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--green)', color: 'var(--white)',
                          fontFamily: "'Share Tech Mono', monospace", fontSize: '14px',
                          padding: '6px 4px', outline: 'none'
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                      />
                      <button onClick={handleUpdateName} style={{ background: 'var(--green)', border: 'none', color: '#000', fontSize: '12px', padding: '4px 12px', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace" }}>SAVE</button>
                      <button onClick={() => setEditingName(false)} style={{ background: 'none', border: '1px solid var(--dim)', color: 'var(--dim)', fontSize: '12px', padding: '4px 12px', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace" }}>×</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '18px', color: 'var(--white)' }}>{displayName}</span>
                      <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', cursor: 'pointer' }}>EDIT</button>
                    </div>
                  )}
                </div>
                {/* EMAIL */}
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--dim)', marginBottom: '4px' }}>EMAIL</div>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', color: 'var(--white)' }}>{user?.email}</span>
                  {user?.emailVerified ? (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--green)' }}>✓ VERIFIED</span>
                  ) : (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#FFB400' }}>⚠ UNVERIFIED</span>
                  )}
                </div>
              </div>
              <button onClick={handleLogout} className="clip-sm" style={{
                width: '100%', background: 'rgba(255,0,60,0.08)',
                border: '1px solid rgba(255,0,60,0.4)', color: 'var(--red)',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '14px',
                padding: '12px', cursor: 'pointer', transition: 'all 0.2s'
              }}
                onMouseEnter={e => { e.target.style.background = 'var(--red)'; e.target.style.color = '#fff'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,0,60,0.08)'; e.target.style.color = 'var(--red)'; }}
              >&gt; LOGOUT.exe</button>
            </div>
          )}
        </div>
      );

      case 'data': return (
        <div>
          {sectionTitle('DATA MANAGEMENT')}
          {/* STORAGE BAR */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--dim)' }}>LOCAL STORAGE USAGE</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: 'var(--green)' }}>{storage.kb}KB / 5MB</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,255,65,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${storage.percent}%`, background: storage.percent > 80 ? 'var(--red)' : 'var(--green)', boxShadow: 'var(--glow-xs)', transition: 'width 1s ease' }} />
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: 'var(--dim)', marginTop: '6px' }}>{storage.percent}% USED</div>
          </div>

          {btnAction('EXPORT WATCHLIST',  exportWishlist, 'var(--green)')}
          {btnAction('EXPORT HISTORY',    exportHistory,  'var(--green)')}
          <div style={{ marginBottom: '12px' }}>
            <label className="clip-sm" style={{
              display: 'block', padding: '10px 20px', cursor: 'pointer', textAlign: 'left',
              border: '1px solid var(--dim)', color: 'var(--dim)',
              fontFamily: "'Share Tech Mono', monospace", fontSize: '12px',
              background: 'transparent', transition: 'all 0.2s'
            }}>
              &gt; IMPORT DATA (JSON)
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,0,60,0.2)', paddingTop: '16px', marginTop: '16px' }}>
            {btnAction('CLEAR WATCHLIST', () => setShowClearW(true), 'var(--red)')}
            {btnAction('CLEAR HISTORY',   () => setShowClearH(true), 'var(--red)')}
            {btnAction('FACTORY RESET',   () => setShowReset(true),  'var(--red)')}
          </div>
        </div>
      );

      case 'about': return (
        <div>
          {sectionTitle('ABOUT VOIDSTREAM')}
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', lineHeight: 2.2, color: 'var(--dim)' }}>
            {[
              ['VERSION',     'v2.0.0'],
              ['BUILT WITH',  'React 18 + Three.js'],
              ['DATA SOURCE', 'TMDB API v3'],
              ['STREAM HOST', 'vidlink.pro'],
              ['AUTH',        'Firebase Auth'],
              ['STORAGE',     'localStorage'],
              ['RENDERER',    'WebGL (Three.js)'],
              ['LICENSE',     'MIT']
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--green)', minWidth: '140px' }}>&gt; {k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      );

      default: return null;
    }
  };

  // Modals
  const ConfirmModal = ({ show, onConfirm, onCancel, msg }) => show ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div className="clip-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--red)', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--red)', marginBottom: '16px' }}>⚠ {msg}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onConfirm} className="clip-sm" style={{ background: 'var(--red)', border: 'none', color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '14px', padding: '10px 24px', cursor: 'pointer' }}>CONFIRM</button>
          <button onClick={onCancel} className="clip-sm" style={{ background: 'transparent', border: '1px solid var(--dim)', color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", fontSize: '14px', padding: '10px 24px', cursor: 'pointer' }}>CANCEL</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <style>{`
        .settings-wrap {
          min-height: 100vh;
          padding: calc(var(--nav-h, 60px) + 28px) var(--page-x, 5vw) 120px;
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .settings-sidebar {
          width: 220px;
          flex-shrink: 0;
        }
        .settings-sidebar-tabs {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .settings-tab-btn {
          text-align: left; background: transparent; border: none;
          font-family: 'Share Tech Mono', monospace; font-size: 13px;
          padding: 10px 16px; cursor: pointer;
          transition: all 0.2s; outline: none;
        }
        .settings-tab-btn:hover {
          color: var(--white) !important;
          background: rgba(255, 255, 255, 0.05);
        }
        .settings-tab-btn:focus-visible {
          box-shadow: 0 0 0 2px var(--green);
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .settings-sidebar {
            width: 100%;
            flex-shrink: 1;
          }
          .settings-sidebar-tabs {
            flex-direction: row;
            overflow-x: auto;
            gap: 0;
            scrollbar-width: none;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--border);
          }
          .settings-sidebar-tabs::-webkit-scrollbar { display: none; }
          .settings-tab-btn {
            white-space: nowrap;
            border-left: none !important;
            border-bottom: 2px solid transparent;
            padding: 8px 14px;
            font-size: 11px;
          }
          .settings-tab-btn.active {
            border-bottom-color: var(--green) !important;
            transform: none !important;
          }
          .settings-tab-btn { cursor: auto; }
        }
      `}</style>

    <div className="settings-wrap">
      {/* SIDEBAR / TAB BAR */}
      <div className="settings-sidebar">
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: 'clamp(14px, 3vw, 18px)', color: 'var(--green)', letterSpacing: '2px', marginBottom: '24px', textShadow: 'var(--glow-xs)' }}>
          &gt; SETTINGS.cfg
        </h1>
        <div className="settings-sidebar-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`settings-tab-btn ${activeTab === cat.id ? 'active' : ''}`}
              style={{
                borderLeft:  `3px solid ${activeTab === cat.id ? 'var(--green)' : 'transparent'}`,
                color:       activeTab === cat.id ? 'var(--green)' : 'var(--dim)',
                transform:   activeTab === cat.id ? 'translateX(8px)' : 'translateX(0)',
                textShadow:  activeTab === cat.id ? 'var(--glow-xs)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, minWidth: '280px' }}>
        <div className="clip-lg" style={{
          background:   'var(--glass-bg)',
          border:       '1px solid var(--glass-border)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          padding:      '32px',
          boxShadow:    'var(--shadow-md)',
          marginBottom: '80px'
        }}>
          {renderPanel()}
        </div>
      </div>

      {/* SAVE BUTTON — STICKY */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,10,10,0.88)',
        borderTop: '1px solid var(--glass-border)',
        padding: '16px 5vw', display: 'flex', justifyContent: 'flex-end',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        zIndex: 100
      }}>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="clip-md"
          style={{
            background:  saveStatus === 'saved' ? 'rgba(0,255,65,0.1)' : 'transparent',
            border:      `1px solid ${saveStatus === 'saved' ? 'var(--green)' : 'var(--green)'}`,
            color:       'var(--green)',
            fontFamily:  "'Share Tech Mono', monospace", fontSize: '14px',
            padding:     '12px 36px', cursor: 'pointer',
            boxShadow:   saveStatus === 'saved' ? 'var(--glow-md)' : 'var(--glow-xs)',
            transition:  'all 0.2s', minWidth: '260px', textAlign: 'center'
          }}
        >
          {saveStatus === 'saving' ? '> WRITING CONFIGURATION...' :
           saveStatus === 'saved'  ? '> SETTINGS.CFG UPDATED ✓'  :
                                     '> APPLY CONFIG'}
        </button>
      </div>

      {/* MODALS */}
      <ConfirmModal show={showClearW} msg="CLEAR WATCHLIST? THIS CANNOT BE UNDONE."
        onConfirm={async () => { await clearWishlist(); setShowClearW(false); addToast('> WATCHLIST CLEARED', 'warning'); }}
        onCancel={() => setShowClearW(false)}
      />
      <ConfirmModal show={showClearH} msg="CLEAR HISTORY? THIS CANNOT BE UNDONE."
        onConfirm={async () => { await clearHistory(); setShowClearH(false); addToast('> HISTORY CLEARED', 'warning'); }}
        onCancel={() => setShowClearH(false)}
      />
      <ConfirmModal show={showReset} msg="FACTORY RESET ALL SETTINGS?"
        onConfirm={handleResetSettings}
        onCancel={() => setShowReset(false)}
      />
    </div>
    </>
  );
}
