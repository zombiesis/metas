import { prisma } from '@/lib/prisma';
import { scoreLead } from '@/lib/lead-scoring';
import { logger } from '@/lib/logger';

type RoutingRule = { field: string; value: string; assignTo: string };

const DEFAULT_RULES: RoutingRule[] = [
  { field: 'program', value: 'MBA', assignTo: 'mba-counselor' },
  { field: 'program', value: 'BBA', assignTo: 'bba-counselor' },
  { field: 'program', value: 'GNM', assignTo: 'nursing-counselor' },
  { field: 'program', value: 'BCA', assignTo: 'bca-counselor' },
  { field: 'program', value: 'B.Sc. Nursing', assignTo: 'nursing-counselor' },
];

/** Auto-assign a lead to a counselor based on rules */
export async function routeLead(leadId: string): Promise<string | null> {
  const lead = await prisma.admissionLead.findUnique({ where: { id: leadId } });
  if (!lead || lead.assignedTo) return lead?.assignedTo || null;

  // Score the lead
  const { score } = scoreLead(lead);

  // Load custom routing rules from settings, fall back to defaults
  let rules = DEFAULT_RULES;
  const setting = await prisma.siteSetting.findFirst({ where: { key: 'lead_routing_rules', branchId: lead.branchId || '' } }).catch(() => null);
  if (setting) { try { rules = JSON.parse(setting.value); } catch {} }

  // Match rules
  let assignee: string | null = null;
  for (const rule of rules) {
    const fieldValue = String((lead as any)[rule.field] || '').toLowerCase();
    if (fieldValue.includes(rule.value.toLowerCase())) { assignee = rule.assignTo; break; }
  }

  // High-score leads go to senior counselor
  if (score >= 70 && !assignee) assignee = 'senior-counselor';

  // Default assignment
  if (!assignee) assignee = 'admissions-team';

  // Update lead
  await prisma.admissionLead.update({ where: { id: leadId }, data: { assignedTo: assignee } });
  logger.info({ leadId, assignee, score }, 'Lead auto-routed');
  return assignee;
}

/** Batch route all unassigned leads */
export async function batchRoutLeads(): Promise<number> {
  const unassigned = await prisma.admissionLead.findMany({ where: { assignedTo: null }, select: { id: true }, take: 100 });
  for (const lead of unassigned) await routeLead(lead.id);
  return unassigned.length;
}
