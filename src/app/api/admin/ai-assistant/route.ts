import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { action, content, title, collection } = await request.json();

  switch (action) {
    case 'seo_suggestions': return NextResponse.json({ ok: true, suggestions: generateSeoSuggestions(title, content) });
    case 'improve_content': return await aiImprove(content, collection);
    case 'generate_meta': return NextResponse.json({ ok: true, meta: generateMeta(title, content) });
    case 'generate_faq': return NextResponse.json({ ok: true, faqs: generateFaqs(title, collection) });
    default: return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  }
}

function generateSeoSuggestions(title: string, content: string): string[] {
  const suggestions: string[] = [];
  if (!title) suggestions.push('Add a descriptive title (50-60 characters ideal)');
  else if (title.length > 60) suggestions.push(`Title is ${title.length} chars — shorten to under 60 for SEO`);
  else if (title.length < 30) suggestions.push('Title is short — consider adding more descriptive keywords');
  if (!content || content.length < 300) suggestions.push('Content is thin — aim for 300+ words for better SEO');
  if (content && !content.includes('<h2')) suggestions.push('Add H2 subheadings to improve content structure');
  if (content && !content.includes('<a ')) suggestions.push('Add internal links to related pages');
  if (content && content.length > 100 && !content.includes('<img')) suggestions.push('Add images to improve engagement');
  if (!suggestions.length) suggestions.push('Content looks good! Consider adding schema markup for rich results.');
  return suggestions;
}

function generateMeta(title: string, content: string): { seoTitle: string; seoDescription: string } {
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  return {
    seoTitle: title.slice(0, 60) || 'Untitled Page',
    seoDescription: plainText.slice(0, 155) + (plainText.length > 155 ? '...' : ''),
  };
}

function generateFaqs(title: string, collection: string): Array<{ question: string; answer: string }> {
  const base = title || collection;
  return [
    { question: `What is ${base}?`, answer: `${base} is a program/service offered by our institution.` },
    { question: `Who is eligible for ${base}?`, answer: 'Please check the eligibility criteria on the program page.' },
    { question: `How to apply for ${base}?`, answer: 'Visit our admissions page or contact the registrar office.' },
    { question: `What is the fee structure for ${base}?`, answer: 'Fee details are available at the admissions office.' },
  ];
}

async function aiImprove(content: string, collection: string) {
  if (!OPENAI_KEY) {
    return NextResponse.json({ ok: true, improved: content, note: 'AI not configured — set OPENAI_API_KEY. Returning original content.' });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a content editor for an Indian college website. Improve the following ${collection} content for clarity, SEO, and engagement. Keep the same structure and facts. Return only the improved HTML.` },
        { role: 'user', content: content.slice(0, 4000) },
      ],
      max_tokens: 2000,
    }),
  });

  if (!res.ok) return NextResponse.json({ ok: false, error: 'AI service unavailable' }, { status: 502 });
  const data = await res.json();
  return NextResponse.json({ ok: true, improved: data.choices?.[0]?.message?.content || content });
}
