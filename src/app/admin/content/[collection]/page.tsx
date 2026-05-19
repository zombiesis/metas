import { AdminCollectionServer } from '@/components/admin/AdminCollectionServer';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ collection: string }> };
export default async function LegacyAdminCollection({ params }: Props) {
  const { collection } = await params;
  return <AdminCollectionServer collection={collection} />;
}
