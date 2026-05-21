import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/security';
import { resolveBranchByDomain } from '@/lib/tenant';
import { verifyTurnstile } from '@/lib/turnstile';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
/**
 * Daily token budget per branch. Audit-#2 N13: without this cap, a coordinated
 * spam attack against the public chatbot endpoint could rack up real money on
 * the operator's OpenAI bill (gpt-4o-mini at ~$0.15 / 1M input tokens means a
 * few hundred dollars/day at sustained load).
 *
 * Override per deployment with `CHATBOT_DAILY_TOKEN_BUDGET`.
 */
const DAILY_TOKEN_BUDGET = Number(process.env.CHATBOT_DAILY_TOKEN_BUDGET || 200_000);
const MAX_OUTPUT_TOKENS = 300;

/** In-memory daily budget tracker. Reset at UTC midnight. */
const tokenBudget: Map<string, { tokens: number; resetAt: number }> = new Map();
function nextUtcMidnight(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}
function checkAndChargeBudget(branchKey: string, estimatedInputTokens: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = tokenBudget.get(branchKey);
  if (!entry || entry.resetAt < now) {
    const fresh = { tokens: estimatedInputTokens + MAX_OUTPUT_TOKENS, resetAt: nextUtcMidnight() };
    tokenBudget.set(branchKey, fresh);
    return { allowed: fresh.tokens <= DAILY_TOKEN_BUDGET, remaining: Math.max(0, DAILY_TOKEN_BUDGET - fresh.tokens) };
  }
  entry.tokens += estimatedInputTokens + MAX_OUTPUT_TOKENS;
  return { allowed: entry.tokens <= DAILY_TOKEN_BUDGET, remaining: Math.max(0, DAILY_TOKEN_BUDGET - entry.tokens) };
}

/** Rough char-to-token approximation for budget estimation. */
function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

/** POST: chatbot answers questions using CMS content as context */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limiter = rateLimit(`chatbot:${ip}`, 20, 60000);
  if (!limiter.ok) return NextResponse.json({ ok: false, error: 'Too many messages. Please wait.' }, { status: 429 });

  const { message, history, turnstileToken } = await request.json();
  if (!message || message.length > 500) return NextResponse.json({ ok: false, error: 'Message required (max 500 chars)' }, { status: 400 });

  const safeHistory = (Array.isArray(history) ? history : [])
    .filter((m: { role?: string }) => m.role === 'user' || m.role === 'assistant')
    .slice(-4)
    .map((m: { role: string; content: unknown }) => ({ role: m.role, content: String(m.content || '').slice(0, 300) }));

  // Verify CAPTCHA on first message of a session (no history yet).
  if (safeHistory.length === 0) {
    const valid = await verifyTurnstile(turnstileToken || '', ip);
    if (!valid) return NextResponse.json({ ok: false, error: 'Please complete the security check.' }, { status: 403 });
  }

  // Resolve branch for context (domain-based, since this is a public endpoint).
  const h = await headers();
  const host = h.get('host')?.split(':')[0] || 'localhost';
  const branchId = await resolveBranchByDomain(host);
  const w = branchId ? { branchId } : {};

  // Gather CMS context for the AI.
  const [programs, notices, pages] = await Promise.all([
    prisma.program.findMany({ where: { ...w, status: 'published' }, select: { title: true, category: true, duration: true, eligibility: true, summary: true }, take: 20 }),
    prisma.notice.findMany({ where: { ...w, status: 'active' }, select: { title: true, category: true, date: true }, take: 10, orderBy: { date: 'desc' } }),
    prisma.page.findMany({ where: { ...w, status: 'published' }, select: { title: true, slug: true, summary: true }, take: 10 }),
  ]);

  const context = [
    'Programs offered: ' + programs.map((p) => `${p.title} (${p.category}, ${p.duration}, Eligibility: ${p.eligibility})`).join('; '),
    'Recent notices: ' + notices.map((n) => `${n.title} (${n.category})`).join('; '),
    'Pages: ' + pages.map((p) => `${p.title}: ${p.summary || ''}`).join('; '),
  ].join('\n');

  // If no OpenAI key, use rule-based responses.
  if (!OPENAI_KEY) return NextResponse.json({ ok: true, reply: getRuleBasedReply(message, programs, notices) });

  // Daily budget gate. We charge the *estimated* token cost optimistically — if
  // the estimate is over, we refuse and fall back to rule-based responses
  // rather than calling OpenAI.
  const systemPrompt = `You are a helpful admissions assistant for Metas Adventist College, Surat. Answer questions using ONLY the following information. Be concise and friendly. If you don't know, say "Please contact our admissions office at +91 95126 44385."\n\nCollege Info:\n${context}`;
  const inputTokens = estimateTokens(systemPrompt) + estimateTokens(message) + safeHistory.reduce((sum: number, m: { content: string }) => sum + estimateTokens(m.content), 0);
  const branchKey = branchId || 'default';
  const budget = checkAndChargeBudget(branchKey, inputTokens);
  if (!budget.allowed) {
    logger.warn({ branchKey }, 'Chatbot daily token budget exhausted — falling through to rule-based reply');
    return NextResponse.json({ ok: true, reply: getRuleBasedReply(message, programs, notices), notice: 'AI mode temporarily unavailable.' });
  }

  // Call OpenAI.
  const messages = [
    { role: 'system', content: systemPrompt },
    ...safeHistory,
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: MAX_OUTPUT_TOKENS, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ ok: true, reply: getRuleBasedReply(message, programs, notices) });
  const data = await res.json().catch(() => null);
  return NextResponse.json({ ok: true, reply: data?.choices?.[0]?.message?.content || 'Please contact our admissions office.' });
}

function getRuleBasedReply(message: string, programs: { title: string }[], notices: { title: string }[]): string {
  const q = message.toLowerCase();
  if (q.includes('program') || q.includes('course') || q.includes('bba') || q.includes('mba') || q.includes('gnm') || q.includes('bca')) {
    return `We offer: ${programs.map((p) => p.title).join(', ')}. Visit /academics for details or call +91 95126 44385.`;
  }
  if (q.includes('admission') || q.includes('apply') || q.includes('eligibility')) {
    return 'You can apply online at /admissions/apply. For eligibility details, visit the specific program page or call +91 95126 44385.';
  }
  if (q.includes('fee') || q.includes('cost') || q.includes('payment')) {
    return 'Fee details are available at the admissions office. Please call +91 95126 44385 or visit in person.';
  }
  if (q.includes('notice') || q.includes('exam') || q.includes('result')) {
    return notices.length ? `Latest notices: ${notices.slice(0, 3).map((n) => n.title).join(', ')}. See all at /notices.` : 'Check /notices for the latest updates.';
  }
  if (q.includes('contact') || q.includes('phone') || q.includes('address')) {
    return 'Metas Adventist College, Athwalines, Surat. Phone: +91 95126 44385. Email: principalcollege@metasofsda.in';
  }
  return 'I can help with admissions, programs, fees, and notices. For specific queries, please contact +91 95126 44385 or visit /contact.';
}
