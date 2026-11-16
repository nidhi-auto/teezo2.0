import { useState } from "react";
import { apiRequest } from "../api/http";
import type { AuthSession } from "../api/types";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner } from "../components/ErrorBanner";

interface SignInViewProps {
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = "sign-in" | "register";

export function SignInView({ onAuthenticated }: SignInViewProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const path = mode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/register";
      const body =
        mode === "sign-in"
          ? { email, password }
          : { email, password, fullName: fullName || undefined };

      const payload = await apiRequest<{
        sessionToken?: string;
        accessToken?: string;
        account?: AuthSession["account"];
        user?: AuthSession["account"] & { fullName?: string | null };
      }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const sessionToken = payload.sessionToken ?? payload.accessToken;
      const account = payload.account ?? payload.user;
      if (!sessionToken || !account) {
        throw new Error("Invalid auth response from server");
      }
      onAuthenticated({ sessionToken, account });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={mode === "sign-in" ? "Sign in" : "Create account"}
      subtitle="Use your Teezo Golf credentials. Sessions are issued by the API."
    >
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={`btn ${mode === "sign-in" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setMode("sign-in")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`btn ${mode === "register" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {mode === "register" ? (
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}