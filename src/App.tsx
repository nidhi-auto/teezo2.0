import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "./api/types";
import { AppShell } from "./components/AppShell";
import { clearSession, loadStoredSession, persistSession } from "./auth/session";
import { ClubAdminView } from "./views/ClubAdminView";
import { PlayerView } from "./views/PlayerView";
import { SignInView } from "./views/SignInView";
import { SuperAdminView } from "./views/SuperAdminView";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      setSession(stored);
    }
    setBootstrapping(false);
  }, []);

  const handleAuthenticated = useCallback((next: AuthSession) => {
    persistSession(next);
    setSession(next);
  }, []);

  const handleSignOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (bootstrapping) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p className="empty-state">Starting Teezo Golf…</p>
      </div>
    );
  }

  if (!session) {
    return <SignInView onAuthenticated={handleAuthenticated} />;
  }

  const { account, sessionToken } = session;

  let view: React.ReactNode;
  switch (account.role) {
    case "platform_admin":
    case "super_admin":
      view = <SuperAdminView token={sessionToken} />;
      break;
    case "club_admin":
      view = <ClubAdminView token={sessionToken} />;
      break;
    default:
      view = <PlayerView token={sessionToken} />;
  }

  return (
    <AppShell account={account} onSignOut={handleSignOut}>
      {view}
    </AppShell>
  );
}