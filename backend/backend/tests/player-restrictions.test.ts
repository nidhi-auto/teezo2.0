import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStore } from "../src/store/memory-store.js";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

describe("player restrictions", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("player can list own clubs and live tournaments", async () => {
    const token = await signIn(request, "player@teezo.local", "password123");
    const clubs = await request
      .get("/api/me/clubs")
      .set(authHeader(token))
      .expect(200);
    assert.ok(clubs.body.items.length >= 1);
    const live = await request
      .get("/api/clubs/live-tournaments")
      .set(authHeader(token))
      .expect(200);
    assert.ok(live.body.items.length >= 1);
  });

  it("player cannot access admin tournament routes", async () => {
    const store = getStore();
    const clubId = store.memberships.find((m) =>
      store.accounts.get(m.accountId)?.email === "player@teezo.local",
    )!.clubId;
    const token = await signIn(request, "player@teezo.local", "password123");
    await request
      .get(`/api/admin/clubs/${clubId}/tournaments`)
      .set(authHeader(token))
      .expect(403);
  });

  it("club admin cannot use player join-requests", async () => {
    const token = await signIn(request, "clubadmin@teezo.local", "password123");
    await request
      .post("/api/join-requests")
      .set(authHeader(token))
      .send({ clubId: "x" })
      .expect(403);
  });
});