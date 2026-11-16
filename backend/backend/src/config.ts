function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: envInt("PORT", 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  sessionTtlSeconds: envInt("SESSION_TTL_SECONDS", 86_400),
  passwordResetTtlSeconds: envInt("PASSWORD_RESET_TTL_SECONDS", 3600),
  inviteTtlSeconds: envInt("INVITE_TTL_SECONDS", 604_800),
  joinReapplyWaitSeconds: envInt("JOIN_REAPPLY_WAIT_SECONDS", 86_400),
  enablePreviewAuth: process.env.ENABLE_PREVIEW_AUTH === "1",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
};