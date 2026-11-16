import type { NextFunction, Request, Response } from "express";
import { resolveSession } from "../auth/sessions.js";
import { getStore } from "../store/memory-store.js";
import type { Account } from "../types.js";
import {
  accountHasPermission,
  type Permission,
} from "../authorize.js";
import { HttpError, sendError } from "../utils/errors.js";

export interface AuthedRequest extends Request {
  account?: Account;
  bearerToken?: string;
}

export function authenticate(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    const session = resolveSession(token);
    if (!session) {
      throw new HttpError(401, "Invalid or expired session");
    }
    const account = getStore().accounts.get(session.accountId);
    if (!account || account.status !== "active") {
      throw new HttpError(401, "Account inactive or not found");
    }
    req.account = account;
    req.bearerToken = token;
    next();
  } catch (err) {
    sendError(res, err);
  }
}

export function requirePermission(...perms: Permission[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    try {
      const account = req.account;
      if (!account) {
        throw new HttpError(401, "Unauthorized");
      }
      const ok = perms.some((p) => accountHasPermission(account, p));
      if (!ok) {
        throw new HttpError(403, "Insufficient permissions");
      }
      next();
    } catch (err) {
      sendError(res, err);
    }
  };
}