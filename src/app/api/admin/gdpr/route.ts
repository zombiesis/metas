import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: GDPR data export or deletion for a specific person */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_users')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { action, email, phone } = await request.json();
  if (!action || (!email && !phone)) return NextResponse.json({ ok: false, error: 'action and email/phone required' }, { status: 400 });

  const emailFilter = email ? { email } : {};
  const phoneFilter = phone ? { phone } : {};
  const filter = { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] };

  if (action === 'export') {
    const [admissions, forms, contacts, alumni, recruiters] = await Promise.all([
      prisma.admissionLead.findMany({ where: filter as any }),
      prisma.formSubmission.findMany({ where: filter as any }),
      prisma.contactInquiry.findMany({ where: filter as any }),
      prisma.alumniRegistration.findMany({ where: filter as any }),
      prisma.recruiterInquiry.findMany({ where: filter as any }),
    ]);

    await auditLog({ action: 'gdpr_export', entityType: 'GDPR', summary: `Data export for ${email || phone}`, userId: auth.session!.userId, request });
    return NextResponse.json({ ok: true, data: { admissions, forms, contacts, alumni, recruiters }, recordCount: admissions.length + forms.length + contacts.length + alumni.length + recruiters.length });
  }

  if (action === 'delete') {
    const [a, f, c, al, r] = await Promise.all([
      prisma.admissionLead.deleteMany({ where: filter as any }),
      prisma.formSubmission.deleteMany({ where: filter as any }),
      prisma.contactInquiry.deleteMany({ where: filter as any }),
      prisma.alumniRegistration.deleteMany({ where: filter as any }),
      prisma.recruiterInquiry.deleteMany({ where: filter as any }),
    ]);

    const total = a.count + f.count + c.count + al.count + r.count;
    await auditLog({ action: 'gdpr_deletion', entityType: 'GDPR', summary: `Deleted ${total} records for ${email || phone}`, userId: auth.session!.userId, request });
    return NextResponse.json({ ok: true, deleted: total });
  }

  return NextResponse.json({ ok: false, error: 'action must be export or delete' }, { status: 400 });
}
