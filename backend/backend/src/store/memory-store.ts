import type {
  Account,
  Club,
  ClubAdminAssignment,
  CreationAuditEvent,
  GoogleIdentity,
  Invitation,
  JoinRequest,
  Membership,
  PasswordCredential,
  PasswordResetToken,
  Session,
  Tournament,
} from "../types.js";

export interface MemoryStore {
  accounts: Map<string, Account>;
  passwordCredentials: Map<string, PasswordCredential>;
  googleIdentities: Map<string, GoogleIdentity>;
  sessions: Map<string, Session>;
  passwordResetTokens: Map<string, PasswordResetToken>;
  clubs: Map<string, Club>;
  clubAdminAssignments: ClubAdminAssignment[];
  memberships: Membership[];
  invitations: Map<string, Invitation>;
  joinRequests: Map<string, JoinRequest>;
  tournaments: Map<string, Tournament>;
  creationAuditEvents: CreationAuditEvent[];
}

let store: MemoryStore | null = null;

export function createEmptyStore(): MemoryStore {
  return {
    accounts: new Map(),
    passwordCredentials: new Map(),
    googleIdentities: new Map(),
    sessions: new Map(),
    passwordResetTokens: new Map(),
    clubs: new Map(),
    clubAdminAssignments: [],
    memberships: [],
    invitations: new Map(),
    joinRequests: new Map(),
    tournaments: new Map(),
    creationAuditEvents: [],
  };
}

export function getStore(): MemoryStore {
  if (!store) {
    store = createEmptyStore();
  }
  return store;
}

export function resetStore(next?: MemoryStore): void {
  store = next ?? createEmptyStore();
}

export function findAccountByEmail(email: string): Account | undefined {
  const normalized = email.trim().toLowerCase();
  for (const account of getStore().accounts.values()) {
    if (account.email.toLowerCase() === normalized) return account;
  }
  return undefined;
}