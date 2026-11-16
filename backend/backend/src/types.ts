export type AccountRole = "super_admin" | "club_admin" | "player";
export type AccountStatus = "active" | "deactivated";

export type TournamentLifecycle = "draft" | "published" | "live" | "closed";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface Account {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  fullName: string;
  createdAt: string;
  createdByAccountId: string | null;
  deactivatedAt: string | null;
}

export interface PasswordCredential {
  accountId: string;
  salt: string;
  hash: string;
}

export interface GoogleIdentity {
  accountId: string;
  googleSub: string;
  verifiedEmail: string;
}

export interface Session {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface Club {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface ClubAdminAssignment {
  accountId: string;
  clubId: string;
}

export interface Membership {
  accountId: string;
  clubId: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  clubId: string;
  inviteeEmail: string;
  status: InvitationStatus;
  expiresAt: string;
  createdByAccountId: string;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  accountId: string;
  clubId: string;
  status: JoinRequestStatus;
  rejectedAt: string | null;
  reapplyAfter: string | null;
  createdAt: string;
}

export interface Tournament {
  id: string;
  clubId: string;
  name: string;
  lifecycleState: TournamentLifecycle;
  entryLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  createdByAccountId: string;
}

export interface CreationAuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  creatorAccountId: string;
}