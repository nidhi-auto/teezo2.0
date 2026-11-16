import { Router } from "express";
import {
  authenticate,
  requirePermission,
  type AuthedRequest,
} from "../middleware/auth.js";
import { assertMemberOfClub } from "../authorize.js";
import { getStore } from "../store/memory-store.js";
import { HttpError, sendError } from "../utils/errors.js";
import { newId } from "../utils/ids.js";
import type { JoinRequest, Tournament } from "../types.js";

export const playerRouter = Router();
playerRouter.use(authenticate);

playerRouter.get(
  "/me/clubs",
  requirePermission("player:self_service", "player:member", "platform:admin"),
  (req: AuthedRequest, res) => {
    try {
      const account = req.account!;
      const store = getStore();
      const clubIds = store.memberships
        .filter((m) => m.accountId === account.id)
        .map((m) => m.clubId);
      const items = clubIds
        .map((id) => store.clubs.get(id))
        .filter(Boolean);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  },
);

playerRouter.get(
  "/me/clubs/:clubId/tournaments",
  requirePermission("player:self_service", "player:member"),
  (req: AuthedRequest, res) => {
    try {
      const { clubId } = req.params;
      assertMemberOfClub(req.account!, clubId);
      const items = [...getStore().tournaments.values()].filter(
        (t) => t.clubId === clubId,
      );
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  },
);

playerRouter.get(
  "/join-requests",
  requirePermission("player:self_service"),
  (req: AuthedRequest, res) => {
    const account = req.account!;
    const items = [...getStore().joinRequests.values()].filter(
      (j) => j.accountId === account.id,
    );
    res.json({ items });
  },
);

playerRouter.post(
  "/join-requests",
  requirePermission("player:self_service"),
  (req: AuthedRequest, res) => {
    try {
      const account = req.account!;
      const { clubId } = req.body as { clubId?: string };
      if (!clubId) {
        throw new HttpError(400, "clubId is required");
      }
      const store = getStore();
      if (!store.clubs.has(clubId)) {
        throw new HttpError(404, "Club not found");
      }
      const isMember = store.memberships.some(
        (m) => m.accountId === account.id && m.clubId === clubId,
      );
      if (isMember) {
        throw new HttpError(409, "Already a member");
      }
      const prior = [...store.joinRequests.values()].filter(
        (j) => j.accountId === account.id && j.clubId === clubId,
      );
      const blocked = prior.find(
        (j) =>
          j.status === "rejected" &&
          j.reapplyAfter &&
          new Date(j.reapplyAfter) > new Date(),
      );
      if (blocked) {
        throw new HttpError(429, "Reapply not allowed yet");
      }
      const pending = prior.find((j) => j.status === "pending");
      if (pending) {
        res.json({ joinRequest: pending });
        return;
      }
      const joinRequest: JoinRequest = {
        id: newId(),
        accountId: account.id,
        clubId,
        status: "pending",
        rejectedAt: null,
        reapplyAfter: null,
        createdAt: new Date().toISOString(),
      };
      store.joinRequests.set(joinRequest.id, joinRequest);
      res.status(201).json({ joinRequest });
    } catch (err) {
      sendError(res, err);
    }
  },
);

playerRouter.get(
  "/invitations",
  requirePermission("player:self_service"),
  (req: AuthedRequest, res) => {
    const account = req.account!;
    const email = account.email.toLowerCase();
    const items = [...getStore().invitations.values()].filter(
      (i) => i.inviteeEmail === email,
    );
    res.json({ items });
  },
);

playerRouter.post(
  "/invitations/:id/accept",
  requirePermission("player:self_service"),
  (req: AuthedRequest, res) => {
    try {
      const account = req.account!;
      const store = getStore();
      const invitation = store.invitations.get(req.params.id);
      if (!invitation || invitation.inviteeEmail !== account.email) {
        throw new HttpError(404, "Invitation not found");
      }
      if (invitation.status !== "pending") {
        throw new HttpError(400, "Invitation not pending");
      }
      if (new Date(invitation.expiresAt) <= new Date()) {
        invitation.status = "expired";
        throw new HttpError(400, "Invitation expired");
      }
      invitation.status = "accepted";
      const exists = store.memberships.some(
        (m) => m.accountId === account.id && m.clubId === invitation.clubId,
      );
      if (!exists) {
        store.memberships.push({
          accountId: account.id,
          clubId: invitation.clubId,
          joinedAt: new Date().toISOString(),
        });
      }
      res.json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  },
);

playerRouter.post(
  "/invitations/:id/decline",
  requirePermission("player:self_service"),
  (req: AuthedRequest, res) => {
    try {
      const account = req.account!;
      const invitation = getStore().invitations.get(req.params.id);
      if (!invitation || invitation.inviteeEmail !== account.email) {
        throw new HttpError(404, "Invitation not found");
      }
      if (invitation.status !== "pending") {
        throw new HttpError(400, "Invitation not pending");
      }
      invitation.status = "declined";
      res.json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  },
);

playerRouter.get(
  "/clubs/live-tournaments",
  requirePermission("player:self_service", "player:member"),
  (_req, res) => {
    const store = getStore();
    const liveByClub = new Map<string, Tournament[]>();
    for (const t of store.tournaments.values()) {
      if (t.lifecycleState !== "live") continue;
      const list = liveByClub.get(t.clubId) ?? [];
      list.push(t);
      liveByClub.set(t.clubId, list);
    }
    const items = [...liveByClub.entries()].map(([clubId, tournaments]) => ({
      club: store.clubs.get(clubId),
      tournaments,
    }));
    res.json({ items });
  },
);