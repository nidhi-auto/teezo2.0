import type { Account } from "../types.js";
import { config } from "../config.js";

function wireRole(role: Account["role"]): string {
  if (role === "super_admin") return "platform_admin";
  return role;
}

export function serializeAccount(account: Account) {
  return {
    id: account.id,
    email: account.email,
    role: wireRole(account.role),
    status: account.status,
    fullName: account.fullName,
    createdAt: account.createdAt,
    createdByAccountId: account.createdByAccountId,
    deactivatedAt: account.deactivatedAt,
  };
}

export function serializeAuthUser(account: Account) {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: wireRole(account.role),
    status: account.status,
    createdAt: account.createdAt,
  };
}

export function serializeAuthSession(account: Account, bearerToken: string) {
  const user = serializeAuthUser(account);
  const shaped = {
    user,
    accessToken: bearerToken,
    tokenType: "Bearer",
    expiresIn: config.sessionTtlSeconds,
    sessionToken: bearerToken,
    account: serializeAccount(account),
  };
  return shaped;
}