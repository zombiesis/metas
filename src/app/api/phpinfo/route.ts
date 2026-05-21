import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Fake phpinfo page — AI scanners specifically look for this */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || '';

  await prisma.securityEvent.create({
    data: { event: 'honeypot_phpinfo', severity: 'critical', summary: `phpinfo probe from ${ip}`, ipAddress: ip, userAgent: ua, metadata: JSON.stringify({ path: '/api/phpinfo' }) },
  }).catch(() => null);

  // Return fake phpinfo that looks real but has wrong data
  const html = `<!DOCTYPE html><html><head><title>phpinfo()</title></head><body>
<h1>PHP Version 8.3.4</h1>
<table><tr><td>System</td><td>Linux metas-prod 5.15.0 #1 SMP x86_64</td></tr>
<tr><td>Server API</td><td>FPM/FastCGI</td></tr>
<tr><td>Document Root</td><td>/var/www/html/public</td></tr>
<tr><td>Laravel Version</td><td>11.2.0</td></tr>
<tr><td>Database</td><td>mysql 8.0.36</td></tr>
<tr><td>Redis</td><td>7.2.4</td></tr>
<tr><td>Session Handler</td><td>redis</td></tr></table>
<p style="color:red;font-size:10px">WARNING: This page should not be accessible in production. Contact sysadmin.</p>
</body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
