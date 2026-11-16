export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
}

interface StatGridProps {
  items: StatItem[];
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <ul
      role="list"
      aria-label="Summary statistics"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        listStyle: "none",
        margin: "0 0 1.25rem",
        padding: 0,
      }}
    >
      {items.map((item) => (
        <li key={item.label} className="card" role="listitem">
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase" }}>
            {item.label}
          </div>
          <div style={{ fontSize: "1.75rem", fontFamily: "var(--font-display)", marginTop: "0.25rem" }}>{item.value}</div>
          {item.hint ? (
            <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>{item.hint}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}