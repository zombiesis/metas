import { AdminChrome } from '@/components/admin/AdminChrome';
import { BranchManager } from '@/components/admin/BranchManager';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  const session = await requireAdmin();
  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    include: { domains: true, settings: true, _count: { select: { users: true } } },
  });

  return (
    <AdminChrome title="Branch Management" description="Manage university branches and their domains" user={session}>
      <BranchManager initial={JSON.parse(JSON.stringify(branches))} />
    </AdminChrome>
  );
}
