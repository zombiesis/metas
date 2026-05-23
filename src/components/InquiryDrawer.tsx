'use client';
import { useState, useEffect } from 'react';

export function InquiryDrawer() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.width = '100%';
    } else {
      const y = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (y) window.scrollTo(0, parseInt(y) * -1);
    }
  }, [open]);

  return (
    <>
      {/* Left-edge pull tab */}
      <button
        className={`inquiry-tab${open ? ' open' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open inquiry form"
        aria-expanded={open}
      >
        <span>Enquire</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Overlay */}
      {open && <div className="inquiry-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Drawer */}
      <div className={`inquiry-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Inquiry form">
        <button className="inquiry-drawer-close" onClick={() => setOpen(false)} aria-label="Close inquiry form">✕</button>
        <h3>Quick Inquiry</h3>
        <form className="inquiry-form" method="post" action="/api/forms/admissions">
          <label htmlFor="d-name">Full Name</label>
          <input id="d-name" name="studentName" required placeholder="Full Name" />
          <label htmlFor="d-phone">Phone</label>
          <input id="d-phone" name="phone" required inputMode="tel" placeholder="+91 98765 43210" />
          <label htmlFor="d-program">Program</label>
          <select id="d-program" name="program" required>
            <option value="">Select Program</option>
            <option>MBA</option><option>BBA</option><option>BCA</option><option>B.Sc. Nursing</option><option>GNM</option>
          </select>
          <input className="honeypot" name="website" aria-hidden="true" tabIndex={-1} />
          <button type="submit" className="btn gold full">Submit</button>
        </form>
        <p className="inquiry-whatsapp">Or WhatsApp: <a href="https://wa.me/919512644385">+91 95126 44385</a></p>
      </div>
    </>
  );
}
