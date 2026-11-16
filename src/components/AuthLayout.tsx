interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "min(100%, 440px)" }}>
        <AuthHero />
        <section className="card" style={{ marginTop: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: subtitle ? "0.35rem" : "1rem" }}>{title}</h1>
          {subtitle ? <p style={{ margin: "0 0 1.25rem", color: "var(--color-muted)" }}>{subtitle}</p> : null}
          {children}
        </section>
      </div>
    </div>
  );
}

function AuthHero() {
  return (
    <div className="golf-hero" aria-hidden>
      <div className="golf-hero__flag" />
      <h2 className="golf-hero__title">Fairways, simplified</h2>
      <p className="golf-hero__subtitle">Manage clubs, tournaments, and players from one place.</p>
    </div>
  );
}