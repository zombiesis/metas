import { RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function CancellationPolicy() {
  const pages = await readCMSCollection<Record<string, any>>('pages');
  const admissions = pages.admissions || {};
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Admissions</p><h1>Cancellation / Withdrawal Policy</h1><p>Policy summary migrated from the live cancellation policy page. Admin must verify current fee/refund table before final publication.</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={admissions.body} /><SourceLinks urls={admissions.sourceUrls} /></article></div></section></>;
}
