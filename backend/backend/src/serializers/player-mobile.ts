import type { Club, Invitation, JoinRequest, Membership, Tournament } from "../types.js";
import { getStore } from "../store/memory-store.js";

export function serializeJoinedClub(clubId: string, accountId: string) {
  const store = getStore();
  const club = store.clubs.get(clubId);
  if (!club) return null;
  const tournaments = [...store.tournaments.values()].filter(
    (t) => t.clubId === clubId,
  );
  return {
    id: club.id,
    name: club.name,
    status: club.status,
    clubId: club.id,
    clubName: club.name,
    tournaments: tournaments.map(serializeTournament),
    liveTournaments: tournaments
      .filter((t) => t.lifecycleState === "live")
      .map(serializeTournament),
  };
}

export function serializeTournament(t: Tournament) {
  return {
    id: t.id,
    name: t.name,
    clubId: t.clubId,
    lifecycleState: t.lifecycleState,
    state: t.lifecycleState,
    entryLimit: t.entryLimit,
    startsAt: t.startsAt,
    endsAt: t.endsAt,
  };
}

export function serializeInvitation(inv: Invitation) {
  const club = getStore().clubs.get(inv.clubId);
  return {
    id: inv.id,
    clubId: inv.clubId,
    clubName: club?.name,
    email: inv.inviteeEmail,
    inviteeEmail: inv.inviteeEmail,
    status: inv.status,
    expiresAt: inv.expiresAt,
  };
}

export function serializeJoinRequest(jr: JoinRequest) {
  const club = getStore().clubs.get(jr.clubId);
  return {
    id: jr.id,
    clubId: jr.clubId,
    clubName: club?.name,
    accountId: jr.accountId,
    status: jr.status,
    rejectedAt: jr.rejectedAt,
    reapplyAfter: jr.reapplyAfter,
    createdAt: jr.createdAt,
  };
}

export function serializeMembership(m: Membership) {
  const club = getStore().clubs.get(m.clubId);
  return {
    clubId: m.clubId,
    clubName: club?.name,
    accountId: m.accountId,
    joinedAt: m.joinedAt,
    status: "active",
  };
}

export function serializeLiveTournamentClub(club: Club, tournaments: Tournament[]) {
  return {
    id: club.id,
    name: club.name,
    clubId: club.id,
    clubName: club.name,
    liveTournaments: tournaments.map(serializeTournament),
    canRequestJoin: true,
  };
}