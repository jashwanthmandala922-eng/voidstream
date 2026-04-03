import { useState, useEffect } from 'react';

export default function BootScreen({ onComplete }) {
  const [exiting, setExiting] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Fade in logo shortly after mount
    const t1 = setTimeout(() => setShowLogo(true), 200);
    // Begin exit
    const t2 = setTimeout(() => setExiting(true), 1800);
    // Unmount
    const t3 = setTimeout(() => onComplete(), 2600);
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position:       'fixed', inset: 0,
      background:     '#000', zIndex: 9999,
      display:        'flex', alignItems: 'center',
      justifyContent: 'center',
      opacity:        exiting ? 0 : 1,
      transition:     'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents:  'none'
    }}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 950, fontSize: 'clamp(32px, 8vw, 64px)',
        color: 'var(--white)', letterSpacing: '16px',
        opacity: showLogo ? 1 : 0,
        transform: showLogo ? 'translateY(0)' : 'translateY(40px)',
        filter: showLogo ? 'blur(0px)' : 'blur(40px)',
        transition: 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        textShadow: '0 0 40px rgba(255, 0, 0, 0.6)'
      }}>
        V<span style={{ color: 'var(--accent)', textShadow: '0 0 15px var(--accent)' }}>OID</span>STREAM
      </div>
    </div>
  );
}