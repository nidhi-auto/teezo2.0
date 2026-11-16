/** Shared API shapes used by the Player mobile clients (#193/#194). */

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export type AuthSessionResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type SessionSummary = {
  id: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
  userAgent: string | null;
  ipAddress: string | null;
};

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type Invitation = {
  id: string;
  clubId: string;
  clubName?: string;
  email: string;
  status: InvitationStatus | string;
  createdAt: string;
  expiresAt: string;
  deliveredAt: string | null;
  respondedAt: string | null;
};

export type JoinRequest = {
  id: string;
  clubId: string;
  clubName?: string;
  accountId: string;
  status: JoinRequestStatus | string;
  createdAt: string;
  decidedAt: string | null;
};

export type Membership = {
  id: string;
  clubId: string;
  accountId: string;
  createdAt: string;
};

export type ClubSummary = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type LiveTournamentSummary = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  maxEntries: number | null;
  status: 'live';
};

/** Club with ≥1 live tournament — discovery only; join via invite/join-request (#189/#190/#195). */
export type LiveTournamentClub = ClubSummary & {
  isMember: boolean;
  hasPendingJoinRequest: boolean;
  hasPendingInvite: boolean;
  canRequestJoin: boolean;
  liveTournaments: LiveTournamentSummary[];
};

export type Tournament = {
  id: string;
  clubId: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  maxEntries: number | null;
  scoringFormat: string;
  createdByAccountId: string | null;
  createdAt: string;
};

export type JoinedClub = ClubSummary & {
  tournaments: Tournament[];
};

export type TournamentEntry = {
  id: string;
  tournamentId: string;
  accountId: string;
  createdAt: string;
};
