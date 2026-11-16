import type { Account, AuthSession } from "../api/types";

const TOKEN_KEY = "teezo.sessionToken";
const ACCOUNT_KEY = "teezo.account";

export function loadStoredSession(): AuthSession | null {
  const sessionToken = localStorage.getItem(TOKEN_KEY);
  const accountRaw = localStorage.getItem(ACCOUNT_KEY);
  if (!sessionToken || !accountRaw) {
    return null;
  }
  try {
    const account = JSON.parse(accountRaw) as Account;
    return { sessionToken, account };
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, session.sessionToken);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(session.account));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
}

export const CLUB_CONTEXT_KEY = "teezo.activeClubId";

export function loadActiveClubId(): string {
  return localStorage.getItem(CLUB_CONTEXT_KEY) ?? "";
}

export function saveActiveClubId(clubId: string): void {
  if (clubId) {
    localStorage.setItem(CLUB_CONTEXT_KEY, clubId);
  } else {
    localStorage.removeItem(CLUB_CONTEXT_KEY);
  }
}