import { describe, it, expect } from 'vitest';
import { rateLimit, sanitizeRichText } from '@/lib/security';

describe('Rate Limiting', () => {
  it('allows requests within limit', () => {
    const key = `test-${Date.now()}`;
    const r1 = rateLimit(key, 3, 60000);
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it('blocks requests over limit', () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, 2, 60000);
    rateLimit(key, 2, 60000);
    const r3 = rateLimit(key, 2, 60000);
    expect(r3.ok).toBe(false);
    expect(r3.remaining).toBe(0);
  });
});

describe('sanitizeRichText', () => {
  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('onerror');
  });

  it('strips javascript: URIs', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows safe HTML', () => {
    const input = '<h1>Title</h1><p>Text with <strong>bold</strong></p>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('allows img with safe attributes', () => {
    const input = '<img src="https://example.com/img.jpg" alt="photo" width="100">';
    const result = sanitizeRichText(input);
    expect(result).toContain('src="https://example.com/img.jpg"');
    expect(result).toContain('alt="photo"');
  });
});
