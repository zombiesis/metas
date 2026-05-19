export function Skeleton({ className = 'skeleton-text', count = 3 }: { className?: string; count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${className}`} style={className === 'skeleton-text' ? { width: `${70 + Math.random() * 30}%` } : undefined} />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'No records yet', message = 'Create your first entry to get started.', action }: { title?: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
