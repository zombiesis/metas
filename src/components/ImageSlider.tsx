'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

type Slide = { title: string; subtitle: string; image?: string };

/**
 * Mobile-friendly hero carousel.
 *
 * Features:
 *  - Auto-advance every 6s
 *  - Pauses while user is touching/swiping
 *  - Touch swipe left/right to navigate (>= 50px swipe distance)
 *  - 48x48 arrow buttons for accessibility (also work with mouse)
 *  - Pagination dots
 *  - Progress bar
 */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const touchStart = useRef<number | null>(null);
  const DURATION = 6000;

  // FIX #4: Show swipe hint on first visit, auto-hide after 3s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem('hero-swiped')) {
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const goTo = useCallback((idx: number) => {
    const n = slides.length;
    setCurrent(((idx % n) + n) % n);
    setProgress(0);
  }, [slides.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const interval = setInterval(next, DURATION);
    return () => clearInterval(interval);
  }, [slides.length, next, paused]);

  // Progress bar
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    setProgress(0);
    const start = Date.now();
    let raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
      if (elapsed < DURATION) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [current, slides.length, paused]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    setPaused(false);
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(diff) < 50) return;
    setShowHint(false);
    sessionStorage.setItem('hero-swiped', '1');
    if (diff < 0) next();
    else prev();
  };

  return (
    <section
      className="hero-slider"
      role="banner"
      aria-label="Hero slideshow"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hero-slide${i === current ? ' active' : ''}`}
          aria-hidden={i !== current}
          style={{
            backgroundImage: `linear-gradient(
              to bottom,
              rgba(10,22,40,0.35) 0%,
              rgba(10,22,40,0.2) 40%,
              rgba(10,22,40,0.65) 100%
            ), url(${slide.image || '/assets/images/campus-hero.webp'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}

      {/* Slide counter */}
      <div className="hero-counter" aria-live="polite">
        <span className="hero-counter-current">{String(current + 1).padStart(2, '0')}</span>
        <span className="hero-counter-sep"> / </span>
        <span className="hero-counter-total">{String(slides.length).padStart(2, '0')}</span>
      </div>

      {/* Arrow buttons (48x48 touch targets) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="hero-arrow hero-arrow-prev"
            onClick={prev}
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="hero-arrow hero-arrow-next"
            onClick={next}
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Bottom glass panel */}
      <div className="hero-panel">
        <div className="wrap hero-panel-inner">
          <div className="hero-panel-text">
            <p className="hero-panel-eyebrow">Metas Adventist College, Surat</p>
            <h1 className="hero-panel-title">{slides[current].title}</h1>
            <p className="hero-panel-sub">{slides[current].subtitle}</p>
          </div>
          <div className="hero-panel-actions">
            <Link className="btn gold pill" href="/admissions/apply">Apply Now →</Link>
            <Link className="btn light pill" href="/admissions#enquiry">Enquiry 2026–27</Link>
          </div>
        </div>

        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="hero-progress-track">
        <div className="hero-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* FIX #4: Swipe hint on first visit */}
      {showHint && <div className="hero-swipe-hint">← Swipe to explore →</div>}
    </section>
  );
}

export function AffiliationSlider({ items }: { items: { title: string; file?: string }[] }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (items.length <= 4) return;
    const timer = setInterval(() => setOffset((o) => (o + 1) % items.length), 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  const visible = items.length <= 4 ? items : [...items, ...items].slice(offset, offset + 4);

  return (
    <div className="affiliation-slider">
      {visible.map((item, i) => (
        <div key={`${item.title}-${i}`} className="affiliation-card">
          <div className="affiliation-icon">📄</div>
          <p>{item.title}</p>
        </div>
      ))}
    </div>
  );
}
