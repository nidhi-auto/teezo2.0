import type { Account, AccountRole } from "./types.js";
import { getStore } from "./store/memory-store.js";
import { HttpError } from "./utils/errors.js";

export type Permission =
  | "platform:admin"
  | "club:admin_read"
  | "membership:manage"
  | "tournament:manage"
  | "player:self_service"
  | "player:member";

const ROLE_PERMISSIONS: Record<AccountRole, Permission[]> = {
  super_admin: ["platform:admin", "club:admin_read", "membership:manage", "tournament:manage"],
  club_admin: ["club:admin_read", "membership:manage", "tournament:manage"],
  player: ["player:self_service", "player:member"],
};

export function permissionsForRole(role: AccountRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function accountHasPermission(
  account: Account,
  permission: Permission,
): boolean {
  return permissionsForRole(account.role).includes(permission);
}

export function assertClubAdminForClub(
  account: Account,
  clubId: string,
): void {
  if (account.role === "super_admin") return;
  if (account.role !== "club_admin") {
    throw new HttpError(403, "Club scope required");
  }
  const store = getStore();
  const assigned = store.clubAdminAssignments.some(
    (a) => a.accountId === account.id && a.clubId === clubId,
  );
  if (!assigned) {
    throw new HttpError(403, "Not assigned to this club");
  }
}

export function assertMemberOfClub(account: Account, clubId: string): void {
  if (account.role === "super_admin") return;
  const store = getStore();
  const isMember = store.memberships.some(
    (m) => m.accountId === account.id && m.clubId === clubId,
  );
  if (!isMember) {
    throw new HttpError(403, "Not a member of this club");
  }
}