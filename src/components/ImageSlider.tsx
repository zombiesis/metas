'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Slide = { title: string; subtitle: string; image?: string };

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const DURATION = 6000;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(next, DURATION);
    return () => clearInterval(interval);
  }, [slides.length, next]);

  useEffect(() => {
    if (slides.length <= 1) return;
    setProgress(0);
    const start = Date.now();
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
      if (elapsed < DURATION) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [current, slides.length]);

  return (
    <section className="hero-slider" role="banner" aria-label="Hero slideshow">
      {/* Slides */}
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

      {/* Slide counter — top right */}
      <div className="hero-counter" aria-live="polite">
        <span className="hero-counter-current">
          {String(current + 1).padStart(2, '0')}
        </span>
        <span className="hero-counter-sep"> / </span>
        <span className="hero-counter-total">
          {String(slides.length).padStart(2, '0')}
        </span>
      </div>

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

        {/* Dot nav */}
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => { setCurrent(i); setProgress(0); }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="hero-progress-track">
        <div
          className="hero-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
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
