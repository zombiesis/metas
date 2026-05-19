'use client';
import { useEffect, useRef, useState } from 'react';

export function CounterAnimation({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const step = Math.ceil(end / (duration / 16));
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= end) { current = end; clearInterval(timer); }
          setCount(current);
        }, 16);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div className="counter-wrap" ref={ref}>
      <span className="counter-number">{count}{suffix}</span>
      <span className="counter-label">{label}</span>
    </div>
  );
}
