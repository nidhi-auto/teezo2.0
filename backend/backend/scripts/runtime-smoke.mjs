import request from "supertest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

async function loadApp() {
  const mod = await import("../dist/app.js").catch(() => import("../src/app.ts"));
  const { createApp, bootstrapStore } = mod;
  process.env.NODE_ENV = "test";
  await bootstrapStore({ seed: true });
  return createApp();
}

async function signIn(app, email, password) {
  const res = await request(app)
    .post("/api/auth/sign-in")
    .send({ email, password });
  return res.body?.sessionToken ?? res.body?.session?.sessionToken;
}

async function main() {
  const app = await loadApp();
  const endpoints = [];
  const record = (method, path, status, note) => {
    endpoints.push({ method, path, status, ...(note ? { note } : {}) });
  };

  record("GET", "/api/v1/health", (await request(app).get("/api/v1/health")).status);
  record(
    "GET",
    "/api/me/clubs",
    (await request(app).get("/api/me/clubs")).status,
  );
  record(
    "GET",
    "/api/admin/platform/club-admins",
    (await request(app).get("/api/admin/platform/club-admins")).status,
  );

  const badGoogle = await request(app)
    .post("/api/auth/google")
    .send({ idToken: "" });
  record("POST", "/api/auth/google", badGoogle.status);

  const playerToken = await signIn(app, "player@teezo.local", "password123");
  if (playerToken) {
    record(
      "GET",
      "/api/me/clubs",
      (await request(app).get("/api/me/clubs").set("Authorization", `Bearer ${playerToken}`)).status,
    );
    record(
      "GET",
      "/api/clubs/live-tournaments",
      (
        await request(app)
          .get("/api/clubs/live-tournaments")
          .set("Authorization", `Bearer ${playerToken}`)
      ).status,
    );
  }

  const adminToken = await signIn(app, "super@teezo.local", "password123");
  if (adminToken) {
    record(
      "GET",
      "/api/admin/platform/clubs",
      (
        await request(app)
          .get("/api/admin/platform/clubs")
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    );
  }

  const out = { endpoints, generatedAt: new Date().toISOString() };
  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});