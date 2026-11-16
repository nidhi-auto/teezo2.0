import { describe, it } from "node:test";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

describe("role permissions", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("super admin can list club admins", async () => {
    const token = await signIn(request, "super@teezo.local", "password123");
    await request
      .get("/api/admin/platform/club-admins")
      .set(authHeader(token))
      .expect(200);
  });

  it("player cannot list club admins", async () => {
    const token = await signIn(request, "player@teezo.local", "password123");
    await request
      .get("/api/admin/platform/club-admins")
      .set(authHeader(token))
      .expect(403);
  });

  it("club admin can list assigned club players", async () => {
    const token = await signIn(request, "clubadmin@teezo.local", "password123");
    const clubs = await request
      .get("/api/me/clubs")
      .set(authHeader(token))
      .expect(403);
    void clubs;
    const platform = await request
      .get("/api/admin/platform/clubs")
      .set(authHeader(token))
      .expect(403);
    void platform;
    const superToken = await signIn(request, "super@teezo.local", "password123");
    const allClubs = await request
      .get("/api/admin/platform/clubs")
      .set(authHeader(superToken))
      .expect(200);
    const clubId = allClubs.body.items[0].id as string;
    await request
      .get(`/api/admin/clubs/${clubId}/players`)
      .set(authHeader(token))
      .expect(200);
  });
});