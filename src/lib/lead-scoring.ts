import { prisma } from '@/lib/prisma';

type LeadScore = { score: number; factors: string[] };

/** Score an admission lead based on engagement signals */
export function scoreLead(lead: {
  email?: string | null;
  phone: string;
  program?: string | null;
  city?: string | null;
  qualification?: string | null;
  message?: string | null;
  utmSource?: string | null;
  consent: boolean;
}): LeadScore {
  let score = 0;
  const factors: string[] = [];

  // Contact completeness
  if (lead.email) { score += 15; factors.push('email_provided'); }
  if (lead.phone.length >= 10) { score += 10; factors.push('valid_phone'); }
  if (lead.city) { score += 5; factors.push('city_provided'); }
  if (lead.qualification) { score += 10; factors.push('qualification_provided'); }

  // Intent signals
  if (lead.program) { score += 20; factors.push('program_selected'); }
  if (lead.message && lead.message.length > 20) { score += 10; factors.push('detailed_message'); }
  if (lead.consent) { score += 5; factors.push('consent_given'); }

  // Source quality
  if (lead.utmSource === 'google') { score += 10; factors.push('google_source'); }
  else if (lead.utmSource === 'referral') { score += 15; factors.push('referral_source'); }
  else if (lead.utmSource) { score += 5; factors.push('tracked_source'); }

  // Cap at 100
  return { score: Math.min(score, 100), factors };
}

/** Score and update a lead in the database */
export async function scoreAndUpdateLead(leadId: string): Promise<LeadScore> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId } });
  if (!lead) return { score: 0, factors: [] };

  const result = scoreLead(lead);

  // Store score in notes (since we don't have a dedicated score column)
  const scoreNote = `[Lead Score: ${result.score}/100 — ${result.factors.join(', ')}]`;
  const existingNotes = lead.notes || '';
  const updatedNotes = existingNotes.includes('[Lead Score:')
    ? existingNotes.replace(/\[Lead Score:.*?\]/, scoreNote)
    : `${scoreNote}\n${existingNotes}`.trim();

  await prisma.admissionLead.update({ where: { id: leadId }, data: { notes: updatedNotes } });
  return result;
}

/** Batch score all unscored leads */
export async function batchScoreLeads(): Promise<number> {
  const leads = await prisma.admissionLead.findMany({ where: { notes: { not: { contains: '[Lead Score:' } } }, take: 100 });
  for (const lead of leads) await scoreAndUpdateLead(lead.id);
  return leads.length;
}
