import { isInvitationAcceptEligible } from './membership-policies.ts';
import type { Invitation, LiveTournamentClub, LiveTournamentSummary, Tournament } from './types.ts';

/** Discovery rows only surface tournaments the server marks as in progress. */
export const LIVE_DISCOVERY_TOURNAMENT_STATUS = 'live' as const;

/** New player entries are allowed only while a tournament is published (same as web). */
export const OPEN_ENTRY_TOURNAMENT_STATUS = 'published' as const;

export type LiveClubJoinAction =
  | 'member'
  | 'pending_request'
  | 'accept_invite'
  | 'request_join'
  | 'unavailable';

/** Strip non-live rows so closed/published events are never shown as live discovery. */
export function filterLiveDiscoveryTournaments(
  tournaments: LiveTournamentSummary[],
): LiveTournamentSummary[] {
  return tournaments.filter((row) => row.status === LIVE_DISCOVERY_TOURNAMENT_STATUS);
}

export function sanitizeLiveDiscoveryClub(club: LiveTournamentClub): LiveTournamentClub {
  return { ...club, liveTournaments: filterLiveDiscoveryTournaments(club.liveTournaments) };
}

/** Clubs with zero live tournaments after sanitization should not appear in browse UI. */
export function isLiveDiscoveryClubVisible(club: LiveTournamentClub): boolean {
  return filterLiveDiscoveryTournaments(club.liveTournaments).length > 0;
}

export function visibleLiveDiscoveryClubs(clubs: LiveTournamentClub[]): LiveTournamentClub[] {
  return clubs.map(sanitizeLiveDiscoveryClub).filter(isLiveDiscoveryClubVisible);
}

/** Closed or live tournaments are not open entry opportunities on mobile. */
export function isTournamentOpenForEntry(tournament: Pick<Tournament, 'status'>): boolean {
  return tournament.status === OPEN_ENTRY_TOURNAMENT_STATUS;
}

export function isParticipationOpportunityStatus(status: string): boolean {
  return status === OPEN_ENTRY_TOURNAMENT_STATUS;
}

/** Join from browse: request or accept invite — never auto-member (#190/#194). */
export function isLiveListingJoinEligible(club: LiveTournamentClub): boolean {
  if (club.isMember) return false;
  return club.canRequestJoin || club.hasPendingInvite;
}

export function pendingInvitationForClub(
  invitations: Invitation[],
  clubId: string,
  now: Date = new Date(),
): Invitation | undefined {
  return invitations.find(
    (row) =>
      row.clubId === clubId &&
      row.status === 'pending' &&
      isInvitationAcceptEligible(row, now),
  );
}

/** Maps server join hints to a single mobile CTA (server remains authoritative). */
export function liveClubJoinAction(
  club: LiveTournamentClub,
  invitations: Invitation[],
): LiveClubJoinAction {
  if (club.isMember) return 'member';
  if (club.hasPendingJoinRequest) return 'pending_request';
  const invite = pendingInvitationForClub(invitations, club.id);
  if (invite || club.hasPendingInvite) return 'accept_invite';
  if (club.canRequestJoin) return 'request_join';
  return 'unavailable';
}
