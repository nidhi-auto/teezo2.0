import { Router } from "express";
import { config } from "../config.js";
import { createSession } from "../auth/sessions.js";
import { getStore } from "../store/memory-store.js";
import { serializeAccount } from "../serializers/account.js";
import { HttpError, sendError } from "../utils/errors.js";

export const previewRouter = Router();

previewRouter.post("/demo-session", (req, res) => {
  try {
    if (!config.enablePreviewAuth) {
      throw new HttpError(404, "Preview auth disabled");
    }
    const { email } = req.body as { email?: string };
    if (!email) {
      throw new HttpError(400, "email is required");
    }
    const store = getStore();
    const account = [...store.accounts.values()].find(
      (a) => a.email.toLowerCase() === email.toLowerCase(),
    );
    if (!account) {
      throw new HttpError(404, "Account not found");
    }
    const { bearerToken } = createSession(account.id);
    res.json({
      accessToken: bearerToken,
      account: serializeAccount(account),
    });
  } catch (err) {
    sendError(res, err);
  }
});