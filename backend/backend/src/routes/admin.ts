import { Router } from "express";
import {
  authenticate,
  requirePermission,
  type AuthedRequest,
} from "../middleware/auth.js";
import { assertClubAdminForClub, accountHasPermission } from "../authorize.js";
import { getStore, findAccountByEmail } from "../store/memory-store.js";
import { serializeAccount } from "../serializers/account.js";
import { HttpError, sendError } from "../utils/errors.js";
import { newId } from "../utils/ids.js";
import type {
  Account,
  Membership,
  Tournament,
  TournamentLifecycle,
  Invitation,
} from "../types.js";
import { hashPassword } from "../auth/password.js";
import { recordCreation } from "../services/audit.js";
import { config } from "../config.js";

export const adminRouter = Router();
adminRouter.use(authenticate);

function ensureSuperAdmin(req: AuthedRequest): Account {
  const account = req.account!;
  if (!accountHasPermission(account, "platform:admin")) {
    throw new HttpError(403, "Super admin required");
  }
  return account;
}

adminRouter.get(
  "/platform/club-admins",
  requirePermission("platform:admin"),
  (_req, res) => {
    const items = [...getStore().accounts.values()].filter(
      (a) => a.role === "club_admin",
    );
    res.json({ items: items.map(serializeAccount) });
  },
);

adminRouter.post(
  "/platform/club-admins",
  requirePermission("platform:admin"),
  async (req: AuthedRequest, res) => {
    try {
      const creator = ensureSuperAdmin(req);
      const { email, fullName, password, clubIds } = req.body as {
        email?: string;
        fullName?: string;
        password?: string;
        clubIds?: string[];
      };
      if (!email || !fullName || !password) {
        throw new HttpError(400, "email, fullName, and password are required");
      }
      if (findAccountByEmail(email)) {
        throw new HttpError(409, "Email already exists");
      }
      const store = getStore();
      const now = new Date().toISOString();
      const account: Account = {
        id: newId(),
        email: email.trim().toLowerCase(),
        role: "club_admin",
        status: "active",
        fullName,
        createdAt: now,
        createdByAccountId: creator.id,
        deactivatedAt: null,
      };
      const creds = await hashPassword(password);
      store.accounts.set(account.id, account);
      store.passwordCredentials.set(account.id, {
        accountId: account.id,
        salt: creds.salt,
        hash: creds.hash,
      });
      for (const clubId of clubIds ?? []) {
        if (!store.clubs.has(clubId)) continue;
        store.clubAdminAssignments.push({
          accountId: account.id,
          clubId,
        });
      }
      recordCreation(store, "club_admin", account.id, creator.id);
      res.status(201).json({ account: serializeAccount(account) });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.patch(
  "/platform/club-admins/:accountId",
  requirePermission("platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const store = getStore();
      const account = store.accounts.get(req.params.accountId);
      if (!account || account.role !== "club_admin") {
        throw new HttpError(404, "Club admin not found");
      }
      const { fullName, status, clubIds } = req.body as {
        fullName?: string;
        status?: Account["status"];
        clubIds?: string[];
      };
      if (fullName) account.fullName = fullName;
      if (status) account.status = status;
      if (clubIds) {
        store.clubAdminAssignments = store.clubAdminAssignments.filter(
          (a) => a.accountId !== account.id,
        );
        for (const clubId of clubIds) {
          if (store.clubs.has(clubId)) {
            store.clubAdminAssignments.push({
              accountId: account.id,
              clubId,
            });
          }
        }
      }
      res.json({ account: serializeAccount(account) });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.delete(
  "/platform/club-admins/:accountId",
  requirePermission("platform:admin"),
  (req, res) => {
    try {
      const store = getStore();
      const account = store.accounts.get(req.params.accountId);
      if (!account || account.role !== "club_admin") {
        throw new HttpError(404, "Club admin not found");
      }
      account.status = "deactivated";
      account.deactivatedAt = new Date().toISOString();
      res.status(204).send();
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.get(
  "/platform/clubs",
  requirePermission("platform:admin"),
  (_req, res) => {
    const items = [...getStore().clubs.values()];
    res.json({ items });
  },
);

adminRouter.get(
  "/platform/creation-audit-events",
  requirePermission("platform:admin"),
  (_req, res) => {
    res.json({ items: getStore().creationAuditEvents });
  },
);

adminRouter.get(
  "/audit/creation-events",
  requirePermission("platform:admin"),
  (_req, res) => {
    res.json({ items: getStore().creationAuditEvents });
  },
);

adminRouter.get(
  "/clubs/:clubId/players",
  requirePermission("club:admin_read", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const store = getStore();
      const memberIds = new Set(
        store.memberships
          .filter((m) => m.clubId === clubId)
          .map((m) => m.accountId),
      );
      const items = [...store.accounts.values()].filter(
        (a) => a.role === "player" && memberIds.has(a.id),
      );
      res.json({ items: items.map(serializeAccount) });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.post(
  "/clubs/:clubId/players",
  requirePermission("membership:manage", "platform:admin"),
  async (req: AuthedRequest, res) => {
    try {
      const creator = req.account!;
      const { clubId } = req.params;
      assertClubAdminForClub(creator, clubId);
      const { email, fullName, password } = req.body as {
        email?: string;
        fullName?: string;
        password?: string;
      };
      if (!email || !fullName || !password) {
        throw new HttpError(400, "email, fullName, and password are required");
      }
      const store = getStore();
      let account = findAccountByEmail(email);
      const now = new Date().toISOString();
      if (!account) {
        account = {
          id: newId(),
          email: email.trim().toLowerCase(),
          role: "player",
          status: "active",
          fullName,
          createdAt: now,
          createdByAccountId: creator.id,
          deactivatedAt: null,
        };
        const creds = await hashPassword(password);
        store.accounts.set(account.id, account);
        store.passwordCredentials.set(account.id, {
          accountId: account.id,
          salt: creds.salt,
          hash: creds.hash,
        });
        recordCreation(store, "player", account.id, creator.id);
      }
      const exists = store.memberships.some(
        (m) => m.accountId === account!.id && m.clubId === clubId,
      );
      if (!exists) {
        const membership: Membership = {
          accountId: account.id,
          clubId,
          joinedAt: now,
        };
        store.memberships.push(membership);
      }
      res.status(201).json({ account: serializeAccount(account) });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.patch(
  "/clubs/:clubId/players/:accountId",
  requirePermission("membership:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId, accountId } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const store = getStore();
      const account = store.accounts.get(accountId);
      if (!account || account.role !== "player") {
        throw new HttpError(404, "Player not found");
      }
      const isMember = store.memberships.some(
        (m) => m.accountId === accountId && m.clubId === clubId,
      );
      if (!isMember) {
        throw new HttpError(404, "Player not in club");
      }
      const { fullName, status } = req.body as {
        fullName?: string;
        status?: Account["status"];
      };
      if (fullName) account.fullName = fullName;
      if (status) {
        account.status = status;
        account.deactivatedAt =
          status === "deactivated" ? new Date().toISOString() : null;
      }
      res.json({ account: serializeAccount(account) });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.get(
  "/clubs/:clubId/tournaments",
  requirePermission("club:admin_read", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const items = [...getStore().tournaments.values()].filter(
        (t) => t.clubId === clubId,
      );
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.post(
  "/clubs/:clubId/tournaments",
  requirePermission("tournament:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const creator = req.account!;
      const { clubId } = req.params;
      assertClubAdminForClub(creator, clubId);
      const { name, entryLimit } = req.body as {
        name?: string;
        entryLimit?: number;
      };
      if (!name) {
        throw new HttpError(400, "name is required");
      }
      const store = getStore();
      const now = new Date().toISOString();
      const tournament: Tournament = {
        id: newId(),
        clubId,
        name,
        lifecycleState: "draft",
        entryLimit: entryLimit ?? null,
        startsAt: null,
        endsAt: null,
        createdAt: now,
        createdByAccountId: creator.id,
      };
      store.tournaments.set(tournament.id, tournament);
      recordCreation(store, "tournament", tournament.id, creator.id);
      res.status(201).json({ tournament });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.patch(
  "/clubs/:clubId/tournaments/:id",
  requirePermission("tournament:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId, id } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const store = getStore();
      const tournament = store.tournaments.get(id);
      if (!tournament || tournament.clubId !== clubId) {
        throw new HttpError(404, "Tournament not found");
      }
      const { name, entryLimit, startsAt, endsAt } = req.body as {
        name?: string;
        entryLimit?: number | null;
        startsAt?: string | null;
        endsAt?: string | null;
      };
      if (name) tournament.name = name;
      if (entryLimit !== undefined) tournament.entryLimit = entryLimit;
      if (startsAt !== undefined) tournament.startsAt = startsAt;
      if (endsAt !== undefined) tournament.endsAt = endsAt;
      res.json({ tournament });
    } catch (err) {
      sendError(res, err);
    }
  },
);

function transitionTournament(
  tournament: Tournament,
  next: TournamentLifecycle,
): void {
  const order: TournamentLifecycle[] = [
    "draft",
    "published",
    "live",
    "closed",
  ];
  const currentIdx = order.indexOf(tournament.lifecycleState);
  const nextIdx = order.indexOf(next);
  if (nextIdx !== currentIdx + 1) {
    throw new HttpError(400, `Invalid transition to ${next}`);
  }
  tournament.lifecycleState = next;
}

function lifecyclePost(
  action: "publish" | "go-live" | "close",
  next: TournamentLifecycle,
) {
  return (req: AuthedRequest, res: import("express").Response) => {
    try {
      const { clubId, id } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const tournament = getStore().tournaments.get(id);
      if (!tournament || tournament.clubId !== clubId) {
        throw new HttpError(404, "Tournament not found");
      }
      transitionTournament(tournament, next);
      if (action === "go-live" && !tournament.startsAt) {
        tournament.startsAt = new Date().toISOString();
      }
      if (action === "close") {
        tournament.endsAt = new Date().toISOString();
      }
      res.json({ tournament });
    } catch (err) {
      sendError(res, err);
    }
  };
}

adminRouter.post(
  "/clubs/:clubId/tournaments/:id/publish",
  requirePermission("tournament:manage", "platform:admin"),
  lifecyclePost("publish", "published"),
);

adminRouter.post(
  "/clubs/:clubId/tournaments/:id/go-live",
  requirePermission("tournament:manage", "platform:admin"),
  lifecyclePost("go-live", "live"),
);

adminRouter.post(
  "/clubs/:clubId/tournaments/:id/close",
  requirePermission("tournament:manage", "platform:admin"),
  lifecyclePost("close", "closed"),
);

adminRouter.post(
  "/clubs/:clubId/invitations",
  requirePermission("membership:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const creator = req.account!;
      const { clubId } = req.params;
      assertClubAdminForClub(creator, clubId);
      const { inviteeEmail } = req.body as { inviteeEmail?: string };
      if (!inviteeEmail) {
        throw new HttpError(400, "inviteeEmail is required");
      }
      const store = getStore();
      const expires = new Date(
        Date.now() + config.inviteTtlSeconds * 1000,
      ).toISOString();
      const invitation: Invitation = {
        id: newId(),
        clubId,
        inviteeEmail: inviteeEmail.trim().toLowerCase(),
        status: "pending",
        expiresAt: expires,
        createdByAccountId: creator.id,
        createdAt: new Date().toISOString(),
      };
      store.invitations.set(invitation.id, invitation);
      res.status(201).json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.get(
  "/clubs/:clubId/invitations",
  requirePermission("club:admin_read", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const items = [...getStore().invitations.values()].filter(
        (i) => i.clubId === clubId,
      );
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.get(
  "/clubs/:clubId/join-requests",
  requirePermission("club:admin_read", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const items = [...getStore().joinRequests.values()].filter(
        (j) => j.clubId === clubId,
      );
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.post(
  "/clubs/:clubId/join-requests/:id/approve",
  requirePermission("membership:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId, id } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const store = getStore();
      const jr = store.joinRequests.get(id);
      if (!jr || jr.clubId !== clubId) {
        throw new HttpError(404, "Join request not found");
      }
      if (jr.status !== "pending") {
        throw new HttpError(400, "Join request not pending");
      }
      jr.status = "approved";
      const exists = store.memberships.some(
        (m) => m.accountId === jr.accountId && m.clubId === clubId,
      );
      if (!exists) {
        store.memberships.push({
          accountId: jr.accountId,
          clubId,
          joinedAt: new Date().toISOString(),
        });
      }
      res.json({ joinRequest: jr });
    } catch (err) {
      sendError(res, err);
    }
  },
);

adminRouter.post(
  "/clubs/:clubId/join-requests/:id/reject",
  requirePermission("club:admin_read", "membership:manage", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId, id } = req.params;
      assertClubAdminForClub(req.account!, clubId);
      const store = getStore();
      const jr = store.joinRequests.get(id);
      if (!jr || jr.clubId !== clubId) {
        throw new HttpError(404, "Join request not found");
      }
      if (jr.status !== "pending") {
        throw new HttpError(400, "Join request not pending");
      }
      jr.status = "rejected";
      jr.rejectedAt = new Date().toISOString();
      jr.reapplyAfter = new Date(
        Date.now() + config.joinReapplyWaitSeconds * 1000,
      ).toISOString();
      res.json({ joinRequest: jr });
    } catch (err) {
      sendError(res, err);
    }
  },
);