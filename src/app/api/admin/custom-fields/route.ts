import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Custom fields are stored in SiteSetting with key = 'custom_fields_<collection>'
 * Format: JSON array of { name, type, label, required, options? }
 */

type CustomField = { name: string; type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url' | 'email' | 'textarea'; label: string; required?: boolean; options?: string[] };

/** GET: get custom fields for a collection */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const collection = request.nextUrl.searchParams.get('collection');
  if (!collection) return NextResponse.json({ ok: false, error: 'collection param required' }, { status: 400 });

  const branchId = await getCurrentBranchId();
  const setting = await prisma.siteSetting.findFirst({ where: { key: `custom_fields_${collection}`, branchId: branchId || '' } }).catch(() => null);
  const fields: CustomField[] = setting ? JSON.parse(setting.value) : [];
  return NextResponse.json({ ok: true, collection, fields });
}

/** PUT: save custom fields for a collection */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { collection, fields } = await request.json();
  if (!collection || !Array.isArray(fields)) return NextResponse.json({ ok: false, error: 'collection and fields required' }, { status: 400 });

  // Validate field definitions
  for (const f of fields) {
    if (!f.name || !f.type || !f.label) return NextResponse.json({ ok: false, error: `Invalid field: ${JSON.stringify(f)}` }, { status: 400 });
    if (f.name.length > 50 || !/^[a-zA-Z_]\w*$/.test(f.name)) return NextResponse.json({ ok: false, error: `Invalid field name: ${f.name}` }, { status: 400 });
  }

  const branchId = await getCurrentBranchId();
  const key = `custom_fields_${collection}`;
  await prisma.siteSetting.upsert({
    where: { key_branchId: { key, branchId: branchId || '' } },
    create: { key, branchId: branchId || '', value: JSON.stringify(fields), label: `Custom fields: ${collection}`, group: 'custom_fields' },
    update: { value: JSON.stringify(fields) },
  });

  return NextResponse.json({ ok: true, fields });
}
