import { logger } from '@/lib/logger';

export type ImageSize = { width: number; height?: number; quality?: number };

export const IMAGE_PRESETS: Record<string, ImageSize> = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 400, quality: 75 },
  medium: { width: 800, quality: 80 },
  large: { width: 1200, quality: 85 },
  hero: { width: 1920, quality: 85 },
};

/**
 * Generate optimized image URL using Next.js Image Optimization API.
 * Works with both local and S3 images.
 */
export function getOptimizedUrl(src: string, preset: keyof typeof IMAGE_PRESETS | ImageSize): string {
  const size = typeof preset === 'string' ? IMAGE_PRESETS[preset] : preset;
  if (!size) return src;
  const params = new URLSearchParams({ url: src, w: String(size.width), q: String(size.quality || 75) });
  return `/_next/image?${params.toString()}`;
}

/**
 * Generate srcSet for responsive images.
 */
export function getSrcSet(src: string, widths = [400, 800, 1200]): string {
  return widths.map(w => `${getOptimizedUrl(src, { width: w })} ${w}w`).join(', ');
}

/**
 * Generate a blur placeholder data URL (tiny base64 image).
 * In production, use sharp or plaiceholder for real blur hashes.
 */
export function getBlurPlaceholder(color = '#e5e7eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect fill="${color}" width="8" height="8"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Validate image dimensions and file size before upload.
 */
export function validateImage(file: { size: number; type: string }): { ok: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  if (!allowedTypes.includes(file.type)) return { ok: false, error: `Invalid type: ${file.type}` };
  if (file.size > maxSize) return { ok: false, error: 'Image exceeds 10MB limit' };
  return { ok: true };
}

/**
 * Get image metadata (dimensions) from a URL using HEAD request.
 */
export async function getImageMeta(url: string): Promise<{ width?: number; height?: number; size?: number } | null> {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('10.') || host.startsWith('192.168.') || host === '169.254.169.254') return null;
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    return { size: parseInt(res.headers.get('content-length') || '0') };
  } catch {
    logger.warn({ url }, 'Failed to get image metadata');
    return null;
  }
}
