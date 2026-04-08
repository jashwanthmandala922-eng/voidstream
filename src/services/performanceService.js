/**
 * Performance Service for Voidflix
 * Handles FPS monitoring, event throttling, and layout read/write optimization.
 */

/**
 * Throttles a function to run at most once per wait period.
 * Useful for scroll and resize events.
 */
export const throttle = (fn, wait = 16) => {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      fn(...args);
      lastTime = now;
    }
  };
};

/**
 * Debounces a function to run after a delay.
 */
export const debounce = (fn, wait = 100) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};

/**
 * FPS Monitor
 * Logs drops below a specified threshold (default 55 fps).
 */
export const startFPSMonitor = (threshold = 55) => {
  let frameCount = 0;
  let lastTime = performance.now();
  let drops = 0;
  let running = true;

  const checkFPS = () => {
    if (!running) return;
    const now = performance.now();
    frameCount++;

    if (now >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      
      if (fps < threshold) {
        drops++;
        console.warn(`[PERF] FPS Drop detected: ${fps} fps (Threshold: ${threshold}). Total drops: ${drops}`);
      }

      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(checkFPS);
  };

  requestAnimationFrame(checkFPS);
  return () => { running = false; };
};

/**
 * Utility for safe layout reads.
 * Encourages batching of reads and writes.
 */
export const scheduleLayoutRead = (fn) => {
  return requestAnimationFrame(fn);
};

/**
 * Adds passive event listeners for better scroll performance.
 */
export const addPassiveListener = (target, type, listener, options = {}) => {
  target.addEventListener(type, listener, { ...options, passive: true });
  return () => target.removeEventListener(type, listener);
};
