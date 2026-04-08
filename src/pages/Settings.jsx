import { useState, useEffect } from 'react';
import { getSettings, saveSettings, resetSettings, getStorageSize, clearWishlist, clearHistory, exportWishlist, exportHistory } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useResponsive';
import { exitGuestMode } from '../services/storageService';
import { Monitor, Palette, Play, Database, Info, ChevronRight, Check, LogOut, Trash2, Download, RotateCcw, Sparkles, Eye, Zap, Film, User } from 'lucide-react';

function Toggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      className="settings-toggle"
    >
      <div className={`settings-toggle-track ${value ? 'active' : ''}`} />
    </button>
  );
}

export default function Settings() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSettings /> : <DesktopSettings />;
}

/* ═══════════════════════════════════════════
   DESKTOP SETTINGS
   ═══════════════════════════════════════════ */
function DesktopSettings() {
  const { user, isGuest, displayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('appearance');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [storage, setStorage] = useState(getStorageSize());
  const [showClearW, setShowClearW] = useState(false);
  const [showClearH, setShowClearH] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'playback', label: 'Playback', icon: Play },
    { id: 'content', label: 'Content', icon: Film },
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await saveSettings(settings); // Await for future-proofing
      setStorage(getStorageSize());
      await new Promise(r => setTimeout(r, 600));
      setSaveStatus('saved');
      addToast('Settings saved', 'success');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      addToast(`Failed to save settings: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error(err);
      addToast('Logout failed', 'error');
    }
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Appearance</h2>

            <div className="settings-group">
              <label className="settings-group-label">Interface Theme</label>
              <div className="settings-chips">
                {[
                  { id: 'hotstar', label: 'Default' },
                  { id: 'cineby', label: 'Cineby' },
                ].map(t => (
                  <button key={t.id} onClick={() => update('uiTheme', t.id)} className={`settings-chip ${settings.uiTheme === t.id ? 'active' : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-group-label">Navigation Style</label>
              <div className="settings-chips">
                {['navbar'].map(v => (
                  <button key={v} onClick={() => update('navStyle', v)} className={`settings-chip ${settings.navStyle === v ? 'active' : ''}`}>
                    Top Bar
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-group-label">Animation Level</label>
              <div className="settings-chips">
                {['full', 'normal', 'reduced', 'none'].map(v => (
                  <button key={v} onClick={() => update('animationLevel', v)} className={`settings-chip ${settings.animationLevel === v ? 'active' : ''}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-toggles">
              <SettingToggle label="3D Card Tilt" desc="Subtle parallax tilt on hover (desktop only)" value={settings.cardTilt} onChange={v => update('cardTilt', v)} icon={<Eye size={16} />} />
              <SettingToggle label="Trailer on Hover" desc="Auto-play trailer preview when hovering cards" value={settings.trailerOnHover ?? true} onChange={v => update('trailerOnHover', v)} icon={<Play size={16} />} />
              <SettingToggle label="Card Glow Effect" desc="Glowing border effect on card hover" value={settings.cardGlow} onChange={v => update('cardGlow', v)} icon={<Sparkles size={16} />} />
              <SettingToggle label="Background Particles" desc="Animated 3D background effects" value={settings.matrixParticles} onChange={v => update('matrixParticles', v)} icon={<Zap size={16} />} />
              <SettingToggle label="Scanline Overlay" desc="Retro CRT scanline effect" value={settings.scanlines} onChange={v => update('scanlines', v)} icon={<Monitor size={16} />} />
            </div>
          </div>
        );

      case 'playback':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Playback</h2>
            <div className="settings-toggles">
              <SettingToggle label="Auto-Play Next" desc="Automatically play the next episode" value={settings.autoplayNext} onChange={v => update('autoplayNext', v)} icon={<Zap size={16} />} />
              <SettingToggle label="Remember Position" desc="Resume from where you left off" value={settings.rememberPosition} onChange={v => update('rememberPosition', v)} icon={<Eye size={16} />} />
              <SettingToggle label="Theater Mode" desc="Wider player view with dimmed surroundings" value={settings.theaterMode} onChange={v => update('theaterMode', v)} icon={<Monitor size={16} />} />
            </div>
            <div className="settings-divider" />
            <div className="settings-group">
              <label className="settings-group-label">Default Quality</label>
              <select value={settings.defaultQuality} onChange={e => update('defaultQuality', e.target.value)} className="settings-select">
                {['auto', '1080p', '720p', '480p', '360p'].map(q => <option key={q} value={q}>{q.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Content</h2>
            <div className="settings-group">
              <label className="settings-group-label">Default Tab</label>
              <div className="settings-chips">
                {['mixed', 'movies', 'series', 'anime'].map(v => (
                  <button key={v} onClick={() => update('defaultTab', v)} className={`settings-chip ${settings.defaultTab === v ? 'active' : ''}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-group">
              <label className="settings-group-label">Language Filter</label>
              <div className="settings-chips">
                {[['all', 'All'], ['en', 'English'], ['ja', 'Japanese'], ['ko', 'Korean'], ['es', 'Spanish'], ['fr', 'French']].map(([v, l]) => (
                  <button key={v} onClick={() => update('language', v)} className={`settings-chip ${settings.language === v ? 'active' : ''}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Account</h2>
            {isGuest ? (
              <div>
                <div className="settings-guest-banner">
                  <span>Guest Session Active</span>
                  <p>Limited functionality. Sign in for full access.</p>
                </div>
                <div className="settings-actions">
                  <button className="settings-action-btn primary" onClick={() => navigate('/register')}>Create Account</button>
                  <button className="settings-action-btn" onClick={() => navigate('/login')}>Sign In</button>
                  <button className="settings-action-btn danger" onClick={() => { exitGuestMode(); navigate('/login'); }}>Exit Guest Mode</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="settings-profile-card">
                  <div className="settings-profile-info">
                    <div className="settings-profile-avatar">{(displayName || user?.email || 'U')[0].toUpperCase()}</div>
                    <div>
                      <div className="settings-profile-name">{displayName || 'User'}</div>
                      <div className="settings-profile-email">{user?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="settings-actions">
                  <button className="settings-action-btn danger" onClick={handleLogout}><LogOut size={16} /> Sign Out</button>
                </div>
              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">Data Management</h2>
            <div className="settings-storage-bar">
              <div className="settings-storage-header">
                <span>Local Storage</span>
                <span>{storage.kb}KB / 5MB ({storage.percent}%)</span>
              </div>
              <div className="settings-storage-track">
                <div className="settings-storage-fill" style={{ width: `${storage.percent}%` }} />
              </div>
            </div>
            <div className="settings-actions">
              <button className="settings-action-btn" onClick={exportWishlist}><Download size={16} /> Export Watchlist</button>
              <button className="settings-action-btn" onClick={exportHistory}><Download size={16} /> Export History</button>
            </div>
            <div className="settings-divider" />
            <div className="settings-actions danger-zone">
              <button className="settings-action-btn danger" onClick={() => setShowClearW(true)}><Trash2 size={16} /> Clear Watchlist</button>
              <button className="settings-action-btn danger" onClick={() => setShowClearH(true)}><Trash2 size={16} /> Clear History</button>
              <button className="settings-action-btn danger" onClick={() => setShowReset(true)}><RotateCcw size={16} /> Reset Settings</button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-panel">
            <h2 className="settings-panel-title">About</h2>
            <div className="settings-about">
              {[
                ['Version', 'v2.0.0'],
                ['Built With', 'React 18 + Three.js'],
                ['Auth', 'Firebase Auth'],
                ['Storage', 'localStorage'],
                ['Renderer', 'WebGL (Three.js)'],
                ['License', 'MIT'],
              ].map(([k, v]) => (
                <div key={k} className="settings-about-row">
                  <span className="settings-about-key">{k}</span>
                  <span className="settings-about-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Palette;

  return (
    <>
      <div className="settings-desktop">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <span className="settings-sidebar-logo">VOID<span style={{ color: 'var(--accent)' }}>FLIX</span></span>
            <span className="settings-sidebar-sub">Settings</span>
          </div>
          <nav className="settings-sidebar-nav">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`settings-sidebar-tab ${activeTab === t.id ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span>{t.label}</span>
                  <ChevronRight size={14} className="settings-sidebar-chevron" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="settings-main">
          <div className="settings-main-header">
            <ActiveIcon size={20} strokeWidth={1.5} />
            <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          </div>
          {renderPanel()}
        </main>
      </div>

      {/* Sticky save bar */}
      <div className="settings-save-bar">
        <button onClick={handleSave} disabled={saveStatus === 'saving'} className={`settings-save-btn ${saveStatus}`}>
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? (<><Check size={16} /> Saved</>) : 'Save Changes'}
        </button>
      </div>

      {/* Confirm modals */}
      <ConfirmModal show={showClearW} msg="Clear your entire watchlist?" onConfirm={async () => { await clearWishlist(); setShowClearW(false); addToast('Watchlist cleared', 'info'); }} onCancel={() => setShowClearW(false)} />
      <ConfirmModal show={showClearH} msg="Clear your entire watch history?" onConfirm={async () => { await clearHistory(); setShowClearH(false); addToast('History cleared', 'info'); }} onCancel={() => setShowClearH(false)} />
      <ConfirmModal show={showReset} msg="Reset all settings to defaults?" onConfirm={() => { resetSettings(); setSettings(getSettings()); setShowReset(false); addToast('Settings reset', 'info'); }} onCancel={() => setShowReset(false)} />

      <style>{`
        .settings-desktop {
          display: flex;
          min-height: 100vh;
          padding-top: 64px;
        }

        .settings-sidebar {
          width: 260px;
          flex-shrink: 0;
          padding: 32px 0;
          border-right: 1px solid var(--border);
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }

        .settings-sidebar-header {
          padding: 0 24px 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .settings-sidebar-logo {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 2px;
          color: var(--white);
        }

        .settings-sidebar-sub {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--dim);
          margin-top: 4px;
          letter-spacing: 0.5px;
        }

        .settings-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 12px;
        }

        .settings-sidebar-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .settings-sidebar-tab:hover {
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.03);
        }

        .settings-sidebar-tab.active {
          color: var(--white);
          background: rgba(0, 122, 255, 0.08);
        }

        .settings-sidebar-chevron {
          margin-left: auto;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .settings-sidebar-tab.active .settings-sidebar-chevron {
          opacity: 0.5;
        }

        .settings-main {
          flex: 1;
          padding: 32px 40px 100px;
          max-width: 720px;
        }

        .settings-main-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          color: var(--dim);
        }

        .settings-main-header h1 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 22px;
          color: var(--white);
          letter-spacing: -0.02em;
        }

        .settings-panel { display: flex; flex-direction: column; gap: 24px; }

        .settings-panel-title {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: var(--white);
          letter-spacing: -0.01em;
        }

        .settings-group { margin-bottom: 4px; }

        .settings-group-label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--dim);
          margin-bottom: 10px;
          letter-spacing: 0.3px;
        }

        .settings-chips { display: flex; flex-wrap: wrap; gap: 6px; }

        .settings-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.6);
          padding: 7px 16px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-chip:hover { background: rgba(255, 255, 255, 0.06); }
        .settings-chip.active { background: rgba(0, 122, 255, 0.12); border-color: rgba(0, 122, 255, 0.25); color: var(--accent); }

        .settings-divider { height: 1px; background: var(--border); margin: 8px 0; }

        .settings-toggles { display: flex; flex-direction: column; gap: 4px; }

        .settings-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .settings-toggle-row:hover { background: rgba(255, 255, 255, 0.02); }

        .settings-toggle-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-toggle-row-icon {
          color: var(--dim);
          display: flex;
          align-items: center;
        }

        .settings-toggle-row-text { display: flex; flex-direction: column; gap: 2px; }

        .settings-toggle-row-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--white);
        }

        .settings-toggle-row-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: var(--dim);
          font-weight: 400;
        }

        .settings-toggle {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .settings-toggle-track {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transition: all 0.3s ease;
        }

        .settings-toggle-track.active {
          left: 23px;
          background: var(--accent);
          box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
        }

        .settings-select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--white);
          padding: 8px 14px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .settings-guest-banner {
          background: rgba(255, 180, 0, 0.06);
          border: 1px solid rgba(255, 180, 0, 0.15);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .settings-guest-banner span {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #FFB400;
        }

        .settings-guest-banner p {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255, 180, 0, 0.6);
          margin: 4px 0 0;
        }

        .settings-profile-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .settings-profile-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .settings-profile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(0, 122, 255, 0.1);
          border: 1px solid rgba(0, 122, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
        }

        .settings-profile-name {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--white);
        }

        .settings-profile-email {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: var(--dim);
          margin-top: 2px;
        }

        .settings-actions { display: flex; flex-direction: column; gap: 8px; }
        .settings-actions.danger-zone { margin-top: 8px; }

        .settings-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-action-btn:hover { background: rgba(255, 255, 255, 0.06); color: var(--white); }
        .settings-action-btn.primary { background: rgba(0, 122, 255, 0.1); border-color: rgba(0, 122, 255, 0.2); color: var(--accent); }
        .settings-action-btn.primary:hover { background: rgba(0, 122, 255, 0.15); }
        .settings-action-btn.danger { color: #ff453a; border-color: rgba(255, 69, 58, 0.15); }
        .settings-action-btn.danger:hover { background: rgba(255, 69, 58, 0.08); }

        .settings-storage-bar { margin-bottom: 20px; }
        .settings-storage-header { display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--dim); margin-bottom: 8px; }
        .settings-storage-track { height: 4px; background: rgba(255, 255, 255, 0.06); border-radius: 2px; overflow: hidden; }
        .settings-storage-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 1s ease; }

        .settings-about { display: flex; flex-direction: column; gap: 12px; }
        .settings-about-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
        .settings-about-key { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--dim); font-weight: 500; }
        .settings-about-val { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--white); font-weight: 400; }

        .settings-save-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px 40px;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          z-index: 100;
        }

        .settings-save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 28px;
          border-radius: 12px;
          background: rgba(0, 122, 255, 0.12);
          border: 1px solid rgba(0, 122, 255, 0.2);
          color: var(--accent);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-save-btn:hover { background: rgba(0, 122, 255, 0.18); }
        .settings-save-btn.saved { background: rgba(0, 122, 255, 0.08); border-color: rgba(0, 122, 255, 0.15); }

        /* Confirm Modal */
        .settings-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9000;
          animation: modalFadeIn 0.2s ease;
        }

        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .settings-modal {
          background: rgba(18, 18, 18, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 28px;
          max-width: 380px;
          width: 90%;
          text-align: center;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
        }

        .settings-modal p {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          font-weight: 500;
        }

        .settings-modal-actions { display: flex; gap: 10px; justify-content: center; }

        .settings-modal-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .settings-modal-btn.confirm { background: #ff453a; color: white; }
        .settings-modal-btn.confirm:hover { background: #ff6961; }
        .settings-modal-btn.cancel { background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); }
        .settings-modal-btn.cancel:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </>
  );
}

function SettingToggle({ label, desc, value, onChange, icon }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-row-left">
        <span className="settings-toggle-row-icon">{icon}</span>
        <div className="settings-toggle-row-text">
          <span className="settings-toggle-row-label">{label}</span>
          <span className="settings-toggle-row-desc">{desc}</span>
        </div>
      </div>
      <Toggle value={value} onChange={onChange} label={label} />
    </div>
  );
}

function ConfirmModal({ show, onConfirm, onCancel, msg }) {
  useEffect(() => {
    if (!show) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [show, onCancel]);

  if (!show) return null;

  return (
    <div className="settings-modal-overlay" onClick={onCancel} role="presentation">
      <div 
        className="settings-modal" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-msg"
      >
        <p id="modal-msg">{msg}</p>
        <div className="settings-modal-actions">
          <button className="settings-modal-btn confirm" onClick={onConfirm}>Confirm</button>
          <button className="settings-modal-btn cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MOBILE SETTINGS
   ═══════════════════════════════════════════ */
function MobileSettings() {
  const { user, isGuest, displayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('appearance');
  const [showClearW, setShowClearW] = useState(false);
  const [showClearH, setShowClearH] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'playback', label: 'Playback', icon: Play },
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error(err);
      addToast(`Logout failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="ms-panel">
            <div className="ms-group">
              <label className="ms-group-label">Theme</label>
              <div className="ms-chips">
                {[{ id: 'hotstar', label: 'Default' }, { id: 'cineby', label: 'Cineby' }].map(t => (
                  <button key={t.id} onClick={() => update('uiTheme', t.id)} className={`ms-chip ${settings.uiTheme === t.id ? 'active' : ''}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="ms-group">
              <label className="ms-group-label">Animations</label>
              <div className="ms-chips">
                {['full', 'normal', 'reduced', 'none'].map(v => (
                  <button key={v} onClick={() => update('animationLevel', v)} className={`ms-chip ${settings.animationLevel === v ? 'active' : ''}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="ms-divider" />
            <MobileToggle label="Trailer on Hover" desc="Auto-play trailer preview" value={settings.trailerOnHover ?? true} onChange={v => update('trailerOnHover', v)} />
            <MobileToggle label="Card Glow" desc="Glowing border on hover" value={settings.cardGlow} onChange={v => update('cardGlow', v)} />
            <MobileToggle label="Background Effects" desc="Animated 3D background" value={settings.matrixParticles} onChange={v => update('matrixParticles', v)} />
          </div>
        );

      case 'playback':
        return (
          <div className="ms-panel">
            <MobileToggle label="Auto-Play Next" desc="Play next episode automatically" value={settings.autoplayNext} onChange={v => update('autoplayNext', v)} />
            <MobileToggle label="Remember Position" desc="Resume where you left off" value={settings.rememberPosition} onChange={v => update('rememberPosition', v)} />
            <div className="ms-divider" />
            <div className="ms-group">
              <label className="ms-group-label">Default Quality</label>
              <select value={settings.defaultQuality} onChange={e => update('defaultQuality', e.target.value)} className="ms-select">
                {['auto', '1080p', '720p', '480p', '360p'].map(q => <option key={q} value={q}>{q.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="ms-panel">
            {isGuest ? (
              <>
                <div className="ms-guest-banner">
                  <span>Guest Session</span>
                  <p>Sign in for full access</p>
                </div>
                <button className="ms-action-btn primary" onClick={() => navigate('/register')}>Create Account</button>
                <button className="ms-action-btn" onClick={() => navigate('/login')}>Sign In</button>
                <button className="ms-action-btn danger" onClick={() => { exitGuestMode(); navigate('/login'); }}>Exit Guest Mode</button>
              </>
            ) : (
              <>
                <div className="ms-profile-card">
                  <div className="ms-profile-avatar">{(displayName || user?.email || 'U')[0].toUpperCase()}</div>
                  <div>
                    <div className="ms-profile-name">{displayName || 'User'}</div>
                    <div className="ms-profile-email">{user?.email}</div>
                  </div>
                </div>
                <button className="ms-action-btn danger" onClick={handleLogout}>Sign Out</button>
              </>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="ms-panel">
            <button className="ms-action-btn" onClick={exportWishlist}>Export Watchlist</button>
            <button className="ms-action-btn" onClick={exportHistory}>Export History</button>
            <div className="ms-divider" />
            <button className="ms-action-btn danger" onClick={() => setShowClearW(true)}>Clear Watchlist</button>
            <button className="ms-action-btn danger" onClick={() => setShowClearH(true)}>Clear History</button>
            <button className="ms-action-btn danger" onClick={() => setShowReset(true)}>Reset Settings</button>
          </div>
        );

      case 'about':
        return (
          <div className="ms-panel">
            <div className="ms-about">
              {[['Version', 'v2.0.0'], ['Built With', 'React 18 + Three.js'], ['Auth', 'Firebase Auth'], ['License', 'MIT']].map(([k, v]) => (
                <div key={k} className="ms-about-row"><span>{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <>
      <div className="ms-root">
        <div className="ms-header">
          <h1>Settings</h1>
        </div>

        <div className="ms-tabs">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`ms-tab ${activeTab === t.id ? 'active' : ''}`}>
                <Icon size={16} strokeWidth={1.5} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="ms-content">
          {renderPanel()}
        </div>
      </div>

      <ConfirmModal show={showClearW} msg="Clear your entire watchlist?" onConfirm={async () => { await clearWishlist(); setShowClearW(false); addToast('Watchlist cleared', 'info'); }} onCancel={() => setShowClearW(false)} />
      <ConfirmModal show={showClearH} msg="Clear your entire watch history?" onConfirm={async () => { await clearHistory(); setShowClearH(false); addToast('History cleared', 'info'); }} onCancel={() => setShowClearH(false)} />
      <ConfirmModal show={showReset} msg="Reset all settings to defaults?" onConfirm={() => { resetSettings(); setSettings(getSettings()); setShowReset(false); addToast('Settings reset', 'info'); }} onCancel={() => setShowReset(false)} />

      <style>{`
        .ms-root { min-height: 100vh; background: var(--black); padding-bottom: 100px; }
        .ms-header { padding: 16px 16px 12px; }
        .ms-header h1 { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 22px; color: white; letter-spacing: -0.02em; }
        .ms-tabs { display: flex; gap: 4px; padding: 0 16px 16px; overflow-x: auto; }
        .ms-tabs::-webkit-scrollbar { display: none; }
        .ms-tab { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); padding: 8px 14px; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .ms-tab.active { background: rgba(0,122,255,0.1); border-color: rgba(0,122,255,0.2); color: var(--accent); }
        .ms-content { padding: 0 16px; }
        .ms-panel { display: flex; flex-direction: column; gap: 4px; }
        .ms-group { margin-bottom: 12px; }
        .ms-group-label { display: block; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: var(--dim); margin-bottom: 8px; letter-spacing: 0.3px; }
        .ms-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .ms-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); padding: 7px 14px; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; }
        .ms-chip.active { background: rgba(0,122,255,0.1); border-color: rgba(0,122,255,0.2); color: var(--accent); }
        .ms-divider { height: 1px; background: var(--border); margin: 12px 0; }
        .ms-action-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; margin-bottom: 8px; }
        .ms-action-btn.primary { background: rgba(0,122,255,0.1); border-color: rgba(0,122,255,0.2); color: var(--accent); }
        .ms-action-btn.danger { color: #ff453a; border-color: rgba(255,69,58,0.15); }
        .ms-guest-banner { background: rgba(255,180,0,0.06); border: 1px solid rgba(255,180,0,0.15); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
        .ms-guest-banner span { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #FFB400; }
        .ms-guest-banner p { font-family: 'Inter', sans-serif; font-size: 12px; color: rgba(255,180,0,0.6); margin: 2px 0 0; }
        .ms-profile-card { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
        .ms-profile-avatar { width: 40px; height: 40px; border-radius: 10px; background: rgba(0,122,255,0.1); border: 1px solid rgba(0,122,255,0.2); display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: var(--accent); }
        .ms-profile-name { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: white; }
        .ms-profile-email { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--dim); margin-top: 2px; }
        .ms-select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: white; padding: 10px 14px; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; }
        .ms-about { display: flex; flex-direction: column; gap: 0; }
        .ms-about-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-family: 'Inter', sans-serif; font-size: 13px; }
        .ms-about-row span:first-child { color: var(--dim); font-weight: 500; }
        .ms-about-row span:last-child { color: white; }
        .ms-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .ms-toggle-text { display: flex; flex-direction: column; gap: 2px; }
        .ms-toggle-label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: white; }
        .ms-toggle-desc { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--dim); }
        .ms-toggle { width: 44px; height: 24px; border-radius: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; position: relative; padding: 0; flex-shrink: 0; }
        .ms-toggle-dot { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: all 0.3s ease; }
        .ms-toggle-dot.active { left: 23px; background: var(--accent); box-shadow: 0 0 8px rgba(0,122,255,0.4); }
      `}</style>
    </>
  );
}

function MobileToggle({ label, desc, value, onChange }) {
  return (
    <div className="ms-toggle-row">
      <div className="ms-toggle-text">
        <span className="ms-toggle-label">{label}</span>
        <span className="ms-toggle-desc">{desc}</span>
      </div>
      <button 
        onClick={() => onChange(!value)} 
        className="ms-toggle"
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <div className={`ms-toggle-dot ${value ? 'active' : ''}`} />
      </button>
    </div>
  );
}
