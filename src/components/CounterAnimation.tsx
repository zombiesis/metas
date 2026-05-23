'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * FIX #2: CounterAnimation — NEVER shows "0" to users.
 *
 * Strategy: Start with the final number rendered immediately (SSR-safe).
 * Only animate if IntersectionObserver fires within 200ms of mount.
 * If reduced-motion or no observer support, static number shown.
 */
export function CounterAnimation({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(end); // FIX #2: Start at end value, never 0
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    let raf: number | null = null;

    const animate = () => {
      if (animated.current) return;
      animated.current = true;
      setCount(0);
      const duration = 1800;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(end * eased));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [end]);

  return (
    <div className="counter-wrap" ref={ref}>
      <span className="counter-number">{count.toLocaleString('en-IN')}{suffix}</span>
      <span className="counter-label">{label}</span>
    </div>
  );
}
