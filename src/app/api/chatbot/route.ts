import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/security';
import { resolveBranchByDomain } from '@/lib/tenant';
import { verifyTurnstile } from '@/lib/turnstile';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

/** POST: chatbot answers questions using CMS content as context */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limiter = rateLimit(`chatbot:${ip}`, 20, 60000);
  if (!limiter.ok) return NextResponse.json({ ok: false, error: 'Too many messages. Please wait.' }, { status: 429 });

  const { message, history, turnstileToken } = await request.json();
  if (!message || message.length > 500) return NextResponse.json({ ok: false, error: 'Message required (max 500 chars)' }, { status: 400 });

  // Verify CAPTCHA on first message (when no history)
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .slice(-4)
    .map((m: any) => ({ role: m.role, content: String(m.content || '').slice(0, 300) }));

  if (safeHistory.length === 0) {
    const valid = await verifyTurnstile(turnstileToken || '', ip);
    if (!valid) return NextResponse.json({ ok: false, error: 'Please complete the security check.' }, { status: 403 });
  }

  // Resolve branch for context
  const h = await headers();
  const host = h.get('host')?.split(':')[0] || 'localhost';
  const branchId = await resolveBranchByDomain(host);
  const w = branchId ? { branchId } : {};

  // Gather CMS context for the AI
  const [programs, notices, pages] = await Promise.all([
    prisma.program.findMany({ where: { ...w, status: 'published' }, select: { title: true, category: true, duration: true, eligibility: true, summary: true }, take: 20 }),
    prisma.notice.findMany({ where: { ...w, status: 'active' }, select: { title: true, category: true, date: true }, take: 10, orderBy: { date: 'desc' } }),
    prisma.page.findMany({ where: { ...w, status: 'published' }, select: { title: true, slug: true, summary: true }, take: 10 }),
  ]);

  const context = [
    'Programs offered: ' + programs.map(p => `${p.title} (${p.category}, ${p.duration}, Eligibility: ${p.eligibility})`).join('; '),
    'Recent notices: ' + notices.map(n => `${n.title} (${n.category})`).join('; '),
    'Pages: ' + pages.map(p => `${p.title}: ${p.summary || ''}`).join('; '),
  ].join('\n');

  // If no OpenAI key, use rule-based responses
  if (!OPENAI_KEY) return NextResponse.json({ ok: true, reply: getRuleBasedReply(message, programs, notices) });

  // Call OpenAI
  const messages = [
    { role: 'system', content: `You are a helpful admissions assistant for Metas Adventist College, Surat. Answer questions using ONLY the following information. Be concise and friendly. If you don't know, say "Please contact our admissions office at +91 95126 44385."\n\nCollege Info:\n${context}` },
    ...(safeHistory),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 300, temperature: 0.7 }),
  });

  if (!res.ok) return NextResponse.json({ ok: true, reply: getRuleBasedReply(message, programs, notices) });
  const data = await res.json();
  return NextResponse.json({ ok: true, reply: data.choices?.[0]?.message?.content || 'Please contact our admissions office.' });
}

function getRuleBasedReply(message: string, programs: any[], notices: any[]): string {
  const q = message.toLowerCase();
  if (q.includes('program') || q.includes('course') || q.includes('bba') || q.includes('mba') || q.includes('gnm') || q.includes('bca')) {
    return `We offer: ${programs.map(p => p.title).join(', ')}. Visit /academics for details or call +91 95126 44385.`;
  }
  if (q.includes('admission') || q.includes('apply') || q.includes('eligibility')) {
    return 'You can apply online at /admissions/apply. For eligibility details, visit the specific program page or call +91 95126 44385.';
  }
  if (q.includes('fee') || q.includes('cost') || q.includes('payment')) {
    return 'Fee details are available at the admissions office. Please call +91 95126 44385 or visit in person.';
  }
  if (q.includes('notice') || q.includes('exam') || q.includes('result')) {
    return notices.length ? `Latest notices: ${notices.slice(0, 3).map(n => n.title).join(', ')}. See all at /notices.` : 'Check /notices for the latest updates.';
  }
  if (q.includes('contact') || q.includes('phone') || q.includes('address')) {
    return 'Metas Adventist College, Athwalines, Surat. Phone: +91 95126 44385. Email: principalcollege@metasofsda.in';
  }
  return 'I can help with admissions, programs, fees, and notices. For specific queries, please contact +91 95126 44385 or visit /contact.';
}
