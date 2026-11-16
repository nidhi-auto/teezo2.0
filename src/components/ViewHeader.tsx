interface ViewHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function ViewHeader({ title, description, actions }: ViewHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      <div>
        <h2>{title}</h2>
        {description ? (
          <p style={{ margin: "0.35rem 0 0", color: "var(--color-muted)", maxWidth: "52ch" }}>{description}</p>
        ) : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>{actions}</div> : null}
    </header>
  );
}