import { Router } from "express";
import {
  findAccountByEmail,
  getStore,
} from "../store/memory-store.js";
import { hashPassword, hashToken, generateToken, verifyPassword } from "../auth/password.js";
import { createSession, revokeSessionByToken } from "../auth/sessions.js";
import {
  serializeAccount,
  serializeAuthSession,
  serializeAuthUser,
} from "../serializers/account.js";
import { HttpError, sendError } from "../utils/errors.js";
import { newId } from "../utils/ids.js";
import { config } from "../config.js";
import type { Account, GoogleIdentity } from "../types.js";
import { authenticate, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
    };
    if (!email || !password || !fullName) {
      throw new HttpError(400, "email, password, and fullName are required");
    }
    if (findAccountByEmail(email)) {
      throw new HttpError(409, "Email already registered");
    }
    const store = getStore();
    const now = new Date().toISOString();
    const account: Account = {
      id: newId(),
      email: email.trim().toLowerCase(),
      role: "player",
      status: "active",
      fullName,
      createdAt: now,
      createdByAccountId: null,
      deactivatedAt: null,
    };
    const creds = await hashPassword(password);
    store.accounts.set(account.id, account);
    store.passwordCredentials.set(account.id, {
      accountId: account.id,
      salt: creds.salt,
      hash: creds.hash,
    });
    const { bearerToken } = createSession(account.id);
    res.status(201).json(serializeAuthSession(account, bearerToken));
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      throw new HttpError(400, "email and password are required");
    }
    const account = findAccountByEmail(email);
    if (!account) {
      throw new HttpError(401, "Invalid credentials");
    }
    const creds = getStore().passwordCredentials.get(account.id);
    if (!creds) {
      throw new HttpError(401, "Invalid credentials");
    }
    const ok = await verifyPassword(password, creds.salt, creds.hash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }
    const client = (req.headers["x-teezo-client"] ?? "") as string;
    if (client === "player-mobile" && account.role !== "player") {
      throw new HttpError(403, "Player mobile access is not enabled for this role");
    }
    const { bearerToken } = createSession(account.id);
    res.json(serializeAuthSession(account, bearerToken));
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.get("/me", authenticate, (req: AuthedRequest, res) => {
  res.json({ user: serializeAuthUser(req.account!) });
});

authRouter.get("/sessions", authenticate, (req: AuthedRequest, res) => {
  const accountId = req.account!.id;
  const store = getStore();
  const tokenHash = req.bearerToken
    ? hashToken(req.bearerToken)
    : undefined;
  const sessions = [...store.sessions.values()]
    .filter((s) => s.accountId === accountId && !s.revokedAt)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: Boolean(tokenHash && s.tokenHash === tokenHash),
      userAgent: null,
      ipAddress: null,
    }));
  res.json({ sessions });
});

authRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  (req: AuthedRequest, res) => {
    try {
      const store = getStore();
      const session = store.sessions.get(req.params.sessionId);
      if (!session || session.accountId !== req.account!.id) {
        throw new HttpError(404, "Session not found");
      }
      session.revokedAt = new Date().toISOString();
      res.status(204).send();
    } catch (err) {
      sendError(res, err);
    }
  },
);

authRouter.post("/google", async (req, res) => {
  try {
    const { googleSub, email, fullName } = req.body as {
      googleSub?: string;
      email?: string;
      fullName?: string;
      idToken?: string;
    };
    if (!googleSub || !email || !fullName) {
      throw new HttpError(400, "googleSub, email, and fullName are required");
    }
    const store = getStore();
    const normalizedEmail = email.trim().toLowerCase();
    let identity: GoogleIdentity | undefined = [...store.googleIdentities.values()].find(
      (g) => g.googleSub === googleSub,
    );
    let account: Account | undefined;
    if (identity) {
      account = store.accounts.get(identity.accountId);
    } else {
      const byEmail = findAccountByEmail(normalizedEmail);
      if (byEmail && !store.googleIdentities.values().some((g) => g.accountId === byEmail.id)) {
        const hasPassword = store.passwordCredentials.has(byEmail.id);
        if (hasPassword) {
          throw new HttpError(409, "Email already registered with password");
        }
      }
      if (byEmail) {
        account = byEmail;
      } else {
        const now = new Date().toISOString();
        account = {
          id: newId(),
          email: normalizedEmail,
          role: "player",
          status: "active",
          fullName,
          createdAt: now,
          createdByAccountId: null,
          deactivatedAt: null,
        };
        store.accounts.set(account.id, account);
      }
      identity = {
        accountId: account.id,
        googleSub,
        verifiedEmail: normalizedEmail,
      };
      store.googleIdentities.set(googleSub, identity);
    }
    if (!account || account.status !== "active") {
      throw new HttpError(401, "Account inactive");
    }
    const client = (req.headers["x-teezo-client"] ?? "") as string;
    if (client === "player-mobile" && account.role !== "player") {
      throw new HttpError(403, "Player mobile access is not enabled for this role");
    }
    const { bearerToken } = createSession(account.id);
    res.json(serializeAuthSession(account, bearerToken));
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post("/password-reset/request", (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      throw new HttpError(400, "email is required");
    }
    const account = findAccountByEmail(email);
    if (account && getStore().passwordCredentials.has(account.id)) {
      const token = generateToken();
      const expires = new Date(
        Date.now() + config.passwordResetTtlSeconds * 1000,
      );
      const resetId = newId();
      getStore().passwordResetTokens.set(resetId, {
        id: resetId,
        accountId: account.id,
        tokenHash: hashToken(token),
        expiresAt: expires.toISOString(),
        usedAt: null,
      });
      if (process.env.NODE_ENV !== "test") {
        console.info("[password-reset] token for", email, token);
      }
    }
    res.status(202).json({ accepted: true });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post("/password-reset/confirm", async (req, res) => {
  try {
    const { token, newPassword } = req.body as {
      token?: string;
      newPassword?: string;
    };
    if (!token || !newPassword) {
      throw new HttpError(400, "token and newPassword are required");
    }
    const store = getStore();
    const tokenHash = hashToken(token);
    const record = [...store.passwordResetTokens.values()].find(
      (t) => t.tokenHash === tokenHash && !t.usedAt,
    );
    if (!record || new Date(record.expiresAt) <= new Date()) {
      throw new HttpError(400, "Invalid or expired token");
    }
    const creds = await hashPassword(newPassword);
    store.passwordCredentials.set(record.accountId, {
      accountId: record.accountId,
      salt: creds.salt,
      hash: creds.hash,
    });
    record.usedAt = new Date().toISOString();
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post("/sessions/revoke", authenticate, (req: AuthedRequest, res) => {
  try {
    const token = req.bearerToken;
    if (!token) {
      throw new HttpError(401, "Unauthorized");
    }
    revokeSessionByToken(token);
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
});