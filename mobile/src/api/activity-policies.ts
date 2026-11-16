import { MobileApiError } from './http.ts';
import type { JoinedClub, Tournament } from './types.ts';

/** Member-visible tournament lifecycle states (draft stays Club Admin–only). */
export const MEMBER_VISIBLE_TOURNAMENT_STATUSES = ['published', 'live', 'closed'] as const;

export type MemberVisibleTournamentStatus = (typeof MEMBER_VISIBLE_TOURNAMENT_STATUSES)[number];

const MEMBER_VISIBLE_STATUS_SET = new Set<string>(MEMBER_VISIBLE_TOURNAMENT_STATUSES);

export function isMemberVisibleTournamentStatus(status: string): status is MemberVisibleTournamentStatus {
  return MEMBER_VISIBLE_STATUS_SET.has(status);
}

/** Drop draft / admin-only rows the Player must never see in joined-club views. */
export function filterMemberVisibleTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments.filter((row) => isMemberVisibleTournamentStatus(row.status));
}

/** Nested tournaments must belong to the club record (server is authoritative; client guards UI). */
export function tournamentsBelongToClub(clubId: string, tournaments: Tournament[]): boolean {
  return tournaments.every((row) => row.clubId === clubId);
}

export function scopedMemberVisibleTournaments(clubId: string, tournaments: Tournament[]): Tournament[] {
  return filterMemberVisibleTournaments(tournaments).filter((row) => row.clubId === clubId);
}

export function sanitizeJoinedClub(club: JoinedClub): JoinedClub {
  return {
    ...club,
    tournaments: scopedMemberVisibleTournaments(club.id, club.tournaments ?? []),
  };
}

/** One UI row per membership — never merge tournaments across clubs. */
export function separateJoinedClubRecords(clubs: JoinedClub[]): JoinedClub[] {
  const seen = new Set<string>();
  const rows: JoinedClub[] = [];
  for (const club of clubs) {
    if (seen.has(club.id)) continue;
    seen.add(club.id);
    rows.push(sanitizeJoinedClub(club));
  }
  return rows;
}

export function isLiveMemberTournament(tournament: Pick<Tournament, 'status'>): boolean {
  return tournament.status === 'live';
}

export function isClosedMemberTournament(tournament: Pick<Tournament, 'status'>): boolean {
  return tournament.status === 'closed';
}

/** `GET /api/me/clubs/:clubId/tournaments` returns 404 when the Player is not a member. */
export function isActivityAccessDeniedError(error: unknown): error is MobileApiError {
  return error instanceof MobileApiError && error.status === 404;
}
