import Link from 'next/link';

/**
 * FIX #14: Breadcrumb wayfinding for inner pages.
 *
 * Usage:
 *   <Breadcrumbs items={[{ label: 'Faculty', href: '/faculty' }]} />
 *
 * "Home" is prepended automatically. The last item is rendered as the current
 * page (no link). All items render with semantic <nav aria-label="breadcrumb">.
 */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const trail = [{ label: 'Home', href: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <div className="wrap">
        <ol>
          {trail.map((item, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={`${item.label}-${i}`}>
                {!isLast && item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
                {!isLast && <span className="breadcrumb-sep" aria-hidden="true">›</span>}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
