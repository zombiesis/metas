import { prisma } from '@/lib/prisma';

type EnrollmentPrediction = { probability: number; confidence: 'high' | 'medium' | 'low'; factors: string[] };

/**
 * Predict enrollment probability based on historical patterns + lead attributes.
 * Uses a weighted scoring model (no ML dependency needed).
 */
export async function predictEnrollment(leadId: string): Promise<EnrollmentPrediction> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId } });
  if (!lead) return { probability: 0, confidence: 'low', factors: ['lead_not_found'] };

  let score = 50; // base probability
  const factors: string[] = [];

  // 1. Contact completeness (+15 max)
  if (lead.email) { score += 5; factors.push('has_email'); }
  if (lead.whatsapp) { score += 5; factors.push('has_whatsapp'); }
  if (lead.city) { score += 5; factors.push('has_city'); }

  // 2. Engagement signals (+20 max)
  if (lead.message && lead.message.length > 50) { score += 10; factors.push('detailed_message'); }
  if (lead.qualification) { score += 10; factors.push('qualification_provided'); }

  // 3. Source quality (+15 max)
  if (lead.utmSource === 'google') { score += 10; factors.push('google_source'); }
  else if (lead.utmSource === 'referral') { score += 15; factors.push('referral_source'); }
  else if (lead.utmSource) { score += 5; factors.push('tracked_source'); }

  // 4. Status progression (+20 max)
  if (lead.status === 'contacted') { score += 10; factors.push('contacted'); }
  if (lead.status === 'applied') { score += 20; factors.push('applied'); }

  // 5. Historical conversion rate for this program
  if (lead.program) {
    const [total, enrolled] = await Promise.all([
      prisma.admissionLead.count({ where: { program: lead.program } }),
      prisma.admissionLead.count({ where: { program: lead.program, status: 'enrolled' } }),
    ]);
    if (total > 10) {
      const rate = enrolled / total;
      if (rate > 0.3) { score += 10; factors.push('high_conversion_program'); }
      else if (rate < 0.1) { score -= 10; factors.push('low_conversion_program'); }
    }
  }

  // 6. Timeliness (leads older than 30 days less likely)
  const ageMs = Date.now() - lead.createdAt.getTime();
  if (ageMs > 30 * 86400000) { score -= 15; factors.push('stale_lead'); }
  else if (ageMs < 7 * 86400000) { score += 5; factors.push('fresh_lead'); }

  // Clamp
  const probability = Math.max(5, Math.min(95, score));
  const confidence = probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low';

  return { probability, confidence, factors };
}

/** Batch predict for all active leads */
export async function batchPredict(): Promise<Array<{ id: string; name: string; probability: number }>> {
  const leads = await prisma.admissionLead.findMany({ where: { status: { in: ['new', 'contacted'] } }, select: { id: true, studentName: true }, take: 100 });
  const results = [];
  for (const lead of leads) {
    const prediction = await predictEnrollment(lead.id);
    results.push({ id: lead.id, name: lead.studentName, probability: prediction.probability });
  }
  return results.sort((a, b) => b.probability - a.probability);
}
