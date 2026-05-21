import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const host = h.get('host') || 'localhost';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /student/

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

Sitemap: ${proto}://${host}/sitemap.xml
`;

  return new NextResponse(robots, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' } });
}
