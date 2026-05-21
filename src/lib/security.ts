import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { securityLogger } from '@/lib/logger';

import { getRateLimiter, MemoryRateLimiter, type RateLimitResult } from '@/lib/rate-limiter';

export function clientIp(request: NextRequest) {
  if (process.env.TRUST_PROXY === 'cloudflare') {
    return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function userAgent(request: NextRequest) {
  return request.headers.get('user-agent') || 'unknown';
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const result = getRateLimiter().check(key, limit, windowMs);
  // If Redis returns a Promise, fall back to memory limiter (not ok:true)
  if (result && typeof (result as any).then === 'function') {
    return new MemoryRateLimiter().check(key, limit, windowMs) as RateLimitResult;
  }
  return result as RateLimitResult;
}

export async function logSecurityEvent(args: { event: string; severity?: string; summary?: string; userId?: string; request?: NextRequest; metadata?: unknown }) {
  try {
    await prisma.securityEvent.create({
      data: {
        event: args.event,
        severity: args.severity || 'info',
        summary: args.summary,
        userId: args.userId,
        ipAddress: args.request ? clientIp(args.request) : undefined,
        userAgent: args.request ? userAgent(args.request) : undefined,
        metadata: JSON.stringify(args.metadata || {})
      }
    });
  } catch (err) {
    securityLogger.error({ err, event: args.event }, 'Failed to persist security event');
  }
}

export function jsonBlocked(message = 'Too many requests.') {
  return NextResponse.json({ ok: false, error: message }, { status: 429 });
}

/** Log if login IP differs from user's last known IP */
export async function logLoginGeoAnomaly(userId: string, currentIp: string, request?: NextRequest) {
  try {
    const lastSession = await prisma.session.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { ipAddress: true } });
    if (lastSession?.ipAddress && lastSession.ipAddress !== currentIp && lastSession.ipAddress !== 'unknown') {
      await logSecurityEvent({
        event: 'login_ip_change',
        severity: 'warning',
        summary: `Login from new IP: ${currentIp} (previous: ${lastSession.ipAddress})`,
        userId,
        request,
        metadata: { previousIp: lastSession.ipAddress, currentIp }
      });
    }
  } catch { /* non-critical */ }
}

import sanitize from 'sanitize-html';

export function sanitizeRichText(value: string) {
  return sanitize(value, {
    allowedTags: sanitize.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure', 'figcaption', 'mark', 'sub', 'sup']),
    allowedAttributes: { ...sanitize.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height', 'loading'], a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}

export const allowedUploadExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv']);
export const allowedUploadMimePrefixes = ['image/', 'application/pdf', 'text/csv', 'application/vnd.', 'application/msword'];
export const maxUploadBytes = 15 * 1024 * 1024;
