import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStore } from "../src/store/memory-store.js";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

describe("cross-club boundaries", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("club admin cannot read another club's players", async () => {
    const store = getStore();
    const clubs = [...store.clubs.values()];
    assert.ok(clubs.length >= 2);
    const assignedClub = store.clubAdminAssignments.find(
      (a) => a.accountId === [...store.accounts.values()].find((x) => x.email === "clubadmin@teezo.local")?.id,
    )!.clubId;
    const otherClub = clubs.find((c) => c.id !== assignedClub)!.id;
    store.clubAdminAssignments = store.clubAdminAssignments.filter(
      (a) => a.clubId === assignedClub,
    );
    const token = await signIn(request, "clubadmin@teezo.local", "password123");
    await request
      .get(`/api/admin/clubs/${otherClub}/players`)
      .set(authHeader(token))
      .expect(403);
  });
});