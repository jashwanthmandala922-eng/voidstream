import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    setIsMobile(window.innerWidth <= breakpoint);
    let timeoutId;
    const check = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth <= breakpoint), 150);
    };
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
}

export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay('morning');
      else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
      else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
      else setTimeOfDay('night');
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}

export function useWindowSizeClass() {
  const [sizeClass, setSizeClass] = useState(() => {
    if (typeof window === 'undefined') return 'large';
    const w = window.innerWidth;
    if (w < 600) return 'compact';
    if (w < 840) return 'medium';
    if (w < 1200) return 'expanded';
    return 'large';
  });

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 600) setSizeClass('compact');
      else if (w < 840) setSizeClass('medium');
      else if (w < 1200) setSizeClass('expanded');
      else setSizeClass('large');
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return sizeClass;
}
