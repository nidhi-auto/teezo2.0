import { hashPassword } from "../auth/password.js";
import type { MemoryStore } from "./memory-store.js";
import { newId } from "../utils/ids.js";

export async function seedDemoStore(store: MemoryStore): Promise<void> {
  const now = new Date().toISOString();

  const superAdminId = newId();
  store.accounts.set(superAdminId, {
    id: superAdminId,
    email: "super@teezo.local",
    role: "super_admin",
    status: "active",
    fullName: "Super Admin",
    createdAt: now,
    createdByAccountId: null,
    deactivatedAt: null,
  });

  const clubAdminId = newId();
  store.accounts.set(clubAdminId, {
    id: clubAdminId,
    email: "clubadmin@teezo.local",
    role: "club_admin",
    status: "active",
    fullName: "Club Admin",
    createdAt: now,
    createdByAccountId: superAdminId,
    deactivatedAt: null,
  });

  const playerId = newId();
  store.accounts.set(playerId, {
    id: playerId,
    email: "player@teezo.local",
    role: "player",
    status: "active",
    fullName: "Demo Player",
    createdAt: now,
    createdByAccountId: null,
    deactivatedAt: null,
  });

  const creds = await hashPassword("password123");
  store.passwordCredentials.set(superAdminId, {
    accountId: superAdminId,
    salt: creds.salt,
    hash: creds.hash,
  });
  store.passwordCredentials.set(clubAdminId, {
    accountId: clubAdminId,
    salt: creds.salt,
    hash: creds.hash,
  });
  store.passwordCredentials.set(playerId, {
    accountId: playerId,
    salt: creds.salt,
    hash: creds.hash,
  });

  const clubA = newId();
  const clubB = newId();
  store.clubs.set(clubA, {
    id: clubA,
    name: "Pine Valley GC",
    status: "active",
    createdAt: now,
  });
  store.clubs.set(clubB, {
    id: clubB,
    name: "Ocean Links",
    status: "active",
    createdAt: now,
  });

  store.clubAdminAssignments.push(
    { accountId: clubAdminId, clubId: clubA },
    { accountId: clubAdminId, clubId: clubB },
  );

  store.memberships.push({
    accountId: playerId,
    clubId: clubA,
    joinedAt: now,
  });

  const pendingInvite = newId();
  const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  store.invitations.set(pendingInvite, {
    id: pendingInvite,
    clubId: clubB,
    inviteeEmail: "player@teezo.local",
    status: "pending",
    expiresAt: inviteExpires,
    createdByAccountId: clubAdminId,
    createdAt: now,
  });

  const draftTournament = newId();
  store.tournaments.set(draftTournament, {
    id: draftTournament,
    clubId: clubA,
    name: "Spring Classic",
    lifecycleState: "draft",
    entryLimit: 100,
    startsAt: null,
    endsAt: null,
    createdAt: now,
    createdByAccountId: clubAdminId,
  });

  const liveTournament = newId();
  store.tournaments.set(liveTournament, {
    id: liveTournament,
    clubId: clubA,
    name: "Live Open",
    lifecycleState: "live",
    entryLimit: 50,
    startsAt: now,
    endsAt: null,
    createdAt: now,
    createdByAccountId: clubAdminId,
  });

  store.creationAuditEvents.push({
    id: newId(),
    entityType: "tournament",
    entityId: draftTournament,
    createdAt: now,
    creatorAccountId: clubAdminId,
  });
}