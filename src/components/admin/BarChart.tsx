export function BarChart({ data, label, color }: { data: { label: string; value: number }[]; label: string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const allZero = data.every((d) => d.value === 0);
  const guides = [100, 75, 50, 25];

  return (
    <div className="bar-chart">
      <p className="bar-chart-label">{label}</p>
      {allZero ? (
        <div className="bar-chart-empty">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{margin:'0 auto 8px',opacity:0.4,display:'block'}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          No data yet — chart will populate as activity comes in.
        </div>
      ) : (
        <div className="bar-chart-wrap" style={{ position: 'relative' }}>
          {/* Y-axis guide lines */}
          <div className="bar-chart-guides" aria-hidden="true">
            {guides.map((g) => (
              <div key={g} className="bar-guide" style={{ bottom: `${g}%` }}>
                <span className="bar-guide-label">{Math.round((g / 100) * max)}</span>
              </div>
            ))}
          </div>
          <div className="bar-chart-bars">
            {data.map((d) => (
              <div key={d.label} className="bar-col">
                <div
                  className="bar"
                  style={{
                    height: `${(d.value / max) * 100}%`,
                    background: color
                      ? `linear-gradient(180deg, ${color}, ${color}bb)`
                      : undefined,
                  }}
                  title={`${d.label}: ${d.value}`}
                >
                  {d.value > 0 && <span className="bar-value">{d.value}</span>}
                </div>
                <span className="bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
