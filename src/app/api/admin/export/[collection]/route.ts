import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { assertCollection, readAdminCollection } from '@/lib/cms-db';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { csvEscape } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ collection: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'export')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { collection: raw } = await context.params;
  const collection = assertCollection(raw);
  const rows = await readAdminCollection<any[]>(collection);
  const flatRows = rows.map((row) => {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'passwordHash') continue;
      copy[key] = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    }
    return copy;
  });
  const keys = Array.from(new Set(flatRows.flatMap((row) => Object.keys(row))));
  const csv = [keys.map(csvEscape).join(','), ...flatRows.map((row) => keys.map((key) => csvEscape(row[key])).join(','))].join('\n');
  await auditLog({ action: 'exported_data', entityType: collection, summary: `Exported ${collection} CSV`, userId: auth.session!.userId, request });
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${collection}.csv"` } });
}
