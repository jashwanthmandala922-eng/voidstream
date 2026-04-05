import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { throttle } from '../../services/performanceService';

// ── PERFORMANCE TIER DETECTION ─────────────────────────────────────
function getPerformanceTier() {
  const isMobile   = window.matchMedia('(max-width: 768px)').matches;
  const isTouch    = window.matchMedia('(pointer: coarse)').matches;
  const cores      = navigator.hardwareConcurrency || 4;
  const hiDPI      = window.devicePixelRatio > 2;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced)              return 'none';
  if (isMobile || isTouch)         return 'css';   // CSS-only fallback
  if (cores <= 4 || hiDPI)         return 'low';   // minimal WebGL
  if (cores <= 8)                  return 'mid';
  return 'high';
}

// ── CSS FALLBACK BACKGROUND ────────────────────────────────────────
function CSSBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(0,255,65,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.03) 0%, transparent 50%)',
      overflow: 'hidden',
    }}>
      {/* Animated grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,65,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,65,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        animation: 'cssBgScroll 20s linear infinite',
      }} />
      {/* Drifting dots */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width:  `${2 + (i % 3)}px`,
          height: `${2 + (i % 3)}px`,
          background: i % 3 === 0 ? 'var(--green)' : i % 3 === 1 ? 'var(--cyan)' : 'var(--dim)',
          borderRadius: '50%',
          left:   `${(i * 8.3) % 100}%`,
          top:    `${(i * 13.7) % 100}%`,
          opacity: 0.3 + (i % 4) * 0.1,
          animation: `cssDrift ${8 + (i % 6) * 2}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}
      <style>{`
        @keyframes cssBgScroll {
          0%   { background-position: 0 0, 0 0; }
          100% { background-position: 0 60px, 60px 0; }
        }
        @keyframes cssDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(${Math.random() > 0.5 ? '+' : '-'}20px, -30px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}

// ── WEBGL BACKGROUND ──────────────────────────────────────────────
function WebGLBackground({ tier }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Particle counts per tier
    const pCount = { low: 800, mid: 2000, high: 3200 }[tier] ?? 2000;

    // Renderer — no antialias on low for speed
    const renderer = new THREE.WebGLRenderer({
      alpha:     true,
      antialias: tier === 'high',
      powerPreference: 'low-power',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'high' ? 2 : 1));

    const mount = mountRef.current;
    if (mount) mount.appendChild(renderer.domElement);

    // Scene + Camera
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, 0.012);
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 8, 35);

    // Grid floor
    const gridHelper = new THREE.GridHelper(300, 50, 0x00FF41, 0x00FF41);
    gridHelper.position.y = -18;
    gridHelper.material.opacity     = 0.07;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Particles
    const positions  = new Float32Array(pCount * 3);
    const velocities = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      velocities[i]         = 0.01 + Math.random() * 0.02;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00FF41, size: 0.6, transparent: true,
      opacity: 0.5, sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Wireframe shapes — only on mid/high
    const shapes = [];
    if (tier !== 'low') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00FF41, wireframe: true, transparent: true, opacity: 0.08,
      });
      const icosa = new THREE.Mesh(new THREE.IcosahedronGeometry(22, 1), wireMat.clone());
      icosa.position.set(-80, 20, -150);
      icosa._rot = { x: 0.0008, y: 0.0005, z: 0 };
      scene.add(icosa); shapes.push(icosa);

      if (tier === 'high') {
        const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(18, 4, 100, 12), wireMat.clone());
        torus.position.set(90, -10, -180);
        torus._rot = { x: 0.0006, y: 0, z: 0.001 };
        scene.add(torus); shapes.push(torus);
      }
    }

    // Camera mouse parallax — only on non-touch
    let camTargetX = 0, camTargetY = 0;
    const onMouseMove = throttle((e) => {
      camTargetX = (e.clientX / window.innerWidth  - 0.5) * 3;
      camTargetY = (e.clientY / window.innerHeight - 0.5) * -1.5;
    }, 16);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── FRAME-CAPPED ANIMATE LOOP (60 fps cap for smoothness) ────────────────
    let frameId;
    const clock    = new THREE.Clock();
    const TARGET_INTERVAL = 1000 / 60; // 60 fps for smooth animation
    let lastTime   = 0;

    const animate = (now = 0) => {
      frameId = requestAnimationFrame(animate);
      if (now - lastTime < TARGET_INTERVAL) return; 
      lastTime = now;

      const t = clock.getElapsedTime();

      // Particle drift - slightly faster and smoother
      const posAttr = particles.geometry.attributes.position;
      const pos = posAttr.array;
      for (let i = 0; i < pCount; i++) {
        pos[i * 3 + 1] += velocities[i] * 0.35;
        if (pos[i * 3 + 1] > 150) pos[i * 3 + 1] = -150;
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = t * 0.006;

      // Grid scroll
      gridHelper.position.z = (t * 3.5) % 6;

      // Shapes rotate
      shapes.forEach(s => {
        s.rotation.x += s._rot.x;
        s.rotation.y += s._rot.y;
        s.rotation.z += s._rot.z;
      });

      // Camera parallax
      camera.position.x += (camTargetX - camera.position.x) * 0.03;
      camera.position.y += (camTargetY + 8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = throttle(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 100);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      shapes.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
      pGeo.dispose(); pMat.dispose();
      gridHelper.material.dispose();
      renderer.dispose();
      if (mount?.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [tier]);

  return (
    <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} />
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────
export default function Background3D() {
  const tier = getPerformanceTier();

  if (tier === 'none') {
    // Minimal static background for prefers-reduced-motion
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 60%, rgba(0,255,65,0.03) 0%, transparent 60%)',
      }} />
    );
  }

  if (tier === 'css') return <CSSBackground />;

  return <WebGLBackground tier={tier} />;
}
