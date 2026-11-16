export type AccountRole = "platform_admin" | "super_admin" | "club_admin" | "player";

export interface Account {
  id: string;
  email: string;
  fullName?: string;
  role: AccountRole;
  status?: string;
}

export interface AuthSession {
  sessionToken: string;
  account: Account;
}

export interface ClubSummary {
  id: string;
  name: string;
  status?: string;
}

export interface ClubAdminRow {
  id: string;
  email: string;
  fullName?: string;
  status?: string;
}

export interface PlayerRow {
  accountId: string;
  email: string;
  fullName?: string;
  status?: string;
}

export interface TournamentRow {
  id: string;
  name: string;
  lifecycleState?: string;
  clubId?: string;
}

export interface InvitationRow {
  id: string;
  inviteeEmail: string;
  status: string;
}

export interface JoinRequestRow {
  id: string;
  status: string;
  clubId?: string;
}