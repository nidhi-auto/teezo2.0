import { MobileApiError } from './http.ts';
import type { Invitation, JoinRequest } from './types.ts';

/**
 * Mirrors shared membership policy constants from the API (`MEMBERSHIP_POLICIES.md`).
 * Durations are server-owned; mobile uses these for UX copy and local eligibility hints only.
 */
export const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;
export const JOIN_REAPPLY_SECONDS = 7 * 24 * 60 * 60;

/** Stable API error codes the Player mobile flow should handle (server source of truth). */
export const MEMBERSHIP_ERROR_CODES = {
  invitationExpired: 'invitation_expired',
  invitationNotPending: 'invitation_not_pending',
  joinReapplyBlocked: 'join_reapply_blocked',
  alreadyClubMember: 'already_club_member',
} as const;

export type MembershipErrorCode =
  (typeof MEMBERSHIP_ERROR_CODES)[keyof typeof MEMBERSHIP_ERROR_CODES];

export function isMembershipPolicyError(
  error: unknown,
  code: MembershipErrorCode,
): error is MobileApiError {
  return error instanceof MobileApiError && error.code === code;
}

/** Server omits expired rows from `GET /api/invitations`; use for rows already loaded. */
export function isInvitationAcceptEligible(
  invitation: Invitation,
  now: Date = new Date(),
): boolean {
  if (invitation.status !== 'pending') return false;
  return new Date(invitation.expiresAt).getTime() > now.getTime();
}

export function isJoinReapplyBlockedError(error: unknown): boolean {
  return isMembershipPolicyError(error, MEMBERSHIP_ERROR_CODES.joinReapplyBlocked);
}

export function isInvitationExpiredError(error: unknown): boolean {
  return isMembershipPolicyError(error, MEMBERSHIP_ERROR_CODES.invitationExpired);
}

/** Latest join request for a club (pending wins over terminal rows for the same club). */
export function joinRequestForClub(
  joinRequests: JoinRequest[],
  clubId: string,
): JoinRequest | undefined {
  const forClub = joinRequests.filter((row) => row.clubId === clubId);
  if (forClub.length === 0) return undefined;
  const pending = forClub.find((row) => row.status === 'pending');
  if (pending) return pending;
  return forClub.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}
