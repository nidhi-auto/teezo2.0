import type { Account } from "../api/types";

interface AppShellProps {
  account: Account;
  onSignOut: () => void;
  children: React.ReactNode;
}

function roleLabel(role: Account["role"]): string {
  switch (role) {
    case "platform_admin":
      return "Super Admin";
    case "club_admin":
      return "Club Admin";
    default:
      return "Player";
  }
}

export function AppShell({ account, onSignOut, children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "rgb(255 255 255 / 0.85)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              aria-hidden
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--color-fairway), var(--color-fairway-deep))",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}
            >
              T
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>Teezo Golf</span>
              <span className="badge" style={{ marginLeft: "0.5rem" }}>
                {roleLabel(account.role)}
              </span>
            </div>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}
          >
            <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
              <div style={{ fontWeight: 600 }}>{account.fullName ?? account.email}</div>
              <div style={{ color: "var(--color-muted)" }}>{account.email}</div>
            </div>
            <button type="button" className="btn btn--ghost" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 1120, width: "100%", margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>{children}</main>
    </div>
  );
}