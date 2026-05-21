import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: send bulk WhatsApp messages to filtered leads */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { template, filters, vars } = await request.json();
  if (!template) return NextResponse.json({ ok: false, error: 'template required' }, { status: 400 });

  const branchId = await getCurrentBranchId();
  const where: any = { ...(branchId ? { branchId } : {}) };
  if (filters?.status) where.status = filters.status;
  if (filters?.program) where.program = filters.program;

  const leads = await prisma.admissionLead.findMany({ where, select: { id: true, studentName: true, phone: true, whatsapp: true, program: true }, take: 500 });

  let sent = 0;
  let failed = 0;
  for (const lead of leads) {
    const phone = lead.whatsapp || lead.phone;
    if (!phone) { failed++; continue; }
    const templateVars = [lead.studentName, lead.program || '', ...(vars || [])];
    const ok = await sendWhatsAppTemplate(phone, template, templateVars);
    if (ok) sent++; else failed++;
  }

  return NextResponse.json({ ok: true, total: leads.length, sent, failed });
}
