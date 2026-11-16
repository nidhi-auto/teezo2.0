import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStore } from "../src/store/memory-store.js";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

describe("creation metadata", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("super admin can read creation audit events", async () => {
    const token = await signIn(request, "super@teezo.local", "password123");
    const res = await request
      .get("/api/admin/platform/creation-audit-events")
      .set(authHeader(token))
      .expect(200);
    assert.ok(res.body.items.length >= 1);
  });

  it("creating tournament adds audit row", async () => {
    const store = getStore();
    const clubId = [...store.clubs.values()][0].id;
    const before = store.creationAuditEvents.length;
    const token = await signIn(request, "clubadmin@teezo.local", "password123");
    const created = await request
      .post(`/api/admin/clubs/${clubId}/tournaments`)
      .set(authHeader(token))
      .send({ name: "Audit Cup" })
      .expect(201);
    assert.ok(created.body.tournament.id);
    assert.ok(store.creationAuditEvents.length > before);
  });

  it("player cannot read audit", async () => {
    const token = await signIn(request, "player@teezo.local", "password123");
    await request
      .get("/api/admin/audit/creation-events")
      .set(authHeader(token))
      .expect(403);
  });
});