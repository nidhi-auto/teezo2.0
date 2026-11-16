import { mobileRequest, type MobileHttpOptions } from './http.ts';
import type { AuthSessionResult, AuthUser, SessionSummary } from './types.ts';

/**
 * Player mobile authentication (#193 / #208). Uses the shared `/api/auth/*` surface so the same
 * Player account identity works on web and mobile. Club Admin / Super Admin are refused when
 * `X-Teezo-Client: player-mobile` is sent. Google never bypasses invitation or join approval.
 */
export class PlayerAuthClient {
  constructor(private readonly http: MobileHttpOptions) {}

  withToken(accessToken: string): PlayerAuthClient {
    return new PlayerAuthClient({ ...this.http, accessToken });
  }

  async signIn(email: string, password: string): Promise<AuthSessionResult> {
    const { data } = await mobileRequest<AuthSessionResult>(this.http, 'POST', '/api/auth/sign-in', {
      email,
      password,
    });
    return data;
  }

  /** Google ID token from the native Sign in with Google SDK — same account identity rules as web. */
  async signInWithGoogle(idToken: string): Promise<AuthSessionResult & { status: number }> {
    const { status, data } = await mobileRequest<AuthSessionResult>(this.http, 'POST', '/api/auth/google', {
      idToken,
    });
    return { status, ...data };
  }

  /** Optional self-register (players only). Policy changes are out of #193 scope. */
  async register(input: { email: string; password: string; fullName?: string }): Promise<AuthSessionResult> {
    const { data } = await mobileRequest<AuthSessionResult>(this.http, 'POST', '/api/auth/register', input);
    return data;
  }

  async me(): Promise<AuthUser> {
    const { data } = await mobileRequest<{ user: AuthUser }>(this.http, 'GET', '/api/auth/me');
    return data.user;
  }

  async listSessions(): Promise<SessionSummary[]> {
    const { data } = await mobileRequest<{ sessions: SessionSummary[] }>(this.http, 'GET', '/api/auth/sessions');
    return data.sessions;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await mobileRequest<unknown>(this.http, 'DELETE', `/api/auth/sessions/${encodeURIComponent(sessionId)}`);
  }

  async signOut(): Promise<void> {
    await mobileRequest<unknown>(this.http, 'POST', '/api/auth/sign-out', {});
  }

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    const { data } = await mobileRequest<{ ok: boolean; message: string }>(
      this.http,
      'POST',
      '/api/auth/password-reset/request',
      { email },
    );
    return data;
  }

  async confirmPasswordReset(token: string, password: string): Promise<{ ok: boolean; message: string }> {
    const { data } = await mobileRequest<{ ok: boolean; message: string }>(
      this.http,
      'POST',
      '/api/auth/password-reset/confirm',
      { token, password },
    );
    return data;
  }
}
