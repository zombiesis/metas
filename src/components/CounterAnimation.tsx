'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * CounterAnimation
 *
 * Renders a number that counts up from 0 to `end` when scrolled into view.
 *
 * Mobile-reliability fixes:
 *  - threshold: 0 + rootMargin so trigger fires as soon as ANY pixel is visible
 *  - Fallback: if IntersectionObserver isn't supported or hasn't fired within
 *    1.5s of mount, just show the final number (no spinner-of-zero forever)
 *  - Fallback: if reduced-motion preferred, show final number immediately
 *  - Uses requestAnimationFrame for smooth animation (no setInterval drift)
 */
export function CounterAnimation({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion users
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setCount(end);
      return;
    }

    let raf: number | null = null;
    const animate = () => {
      if (started.current) return;
      started.current = true;
      const duration = 1800;
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic for a natural counter feel
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(end * eased));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Fallback: if observer hasn't fired in 1.5s (slow network, weird viewport),
    // start the animation anyway so user never sees a stuck zero.
    const safety = window.setTimeout(animate, 1500);

    if (typeof IntersectionObserver === 'undefined') {
      animate();
      return () => {
        window.clearTimeout(safety);
        if (raf) cancelAnimationFrame(raf);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.clearTimeout(safety);
          animate();
          observer.disconnect();
        }
      },
      // Trigger as soon as element enters viewport, with 50px slack
      { threshold: 0, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
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
