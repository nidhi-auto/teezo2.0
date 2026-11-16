import { config } from "../config.js";
import type { Session } from "../types.js";
import { generateToken, hashToken } from "./password.js";
import { newId } from "../utils/ids.js";
import { getStore } from "../store/memory-store.js";

export function createSession(accountId: string): {
  session: Session;
  bearerToken: string;
} {
  const store = getStore();
  const bearerToken = generateToken();
  const now = new Date();
  const expires = new Date(
    now.getTime() + config.sessionTtlSeconds * 1000,
  );
  const session: Session = {
    id: newId(),
    accountId,
    tokenHash: hashToken(bearerToken),
    expiresAt: expires.toISOString(),
    revokedAt: null,
    createdAt: now.toISOString(),
  };
  store.sessions.set(session.id, session);
  return { session, bearerToken };
}

export function resolveSession(bearerToken: string): Session | null {
  const store = getStore();
  const tokenHash = hashToken(bearerToken);
  for (const session of store.sessions.values()) {
    if (session.tokenHash !== tokenHash) continue;
    if (session.revokedAt) return null;
    if (new Date(session.expiresAt) <= new Date()) return null;
    return session;
  }
  return null;
}

export function revokeSessionByToken(bearerToken: string): boolean {
  const store = getStore();
  const tokenHash = hashToken(bearerToken);
  for (const session of store.sessions.values()) {
    if (session.tokenHash !== tokenHash) continue;
    session.revokedAt = new Date().toISOString();
    return true;
  }
  return false;
}