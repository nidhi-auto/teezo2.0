import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStore } from "../src/store/memory-store.js";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

const MOBILE_HEADERS = {
  "x-teezo-client": "player-mobile",
  "user-agent": "Teezo-Player-Mobile/1.0",
};

describe("mobile player workflows (REQ-049–051, 063–065, 083–085)", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("lists invitations and join requests for mobile clients", async () => {
    const token = await signIn(request, "player@teezo.local", "password123");
    const inv = await request
      .get("/api/invitations")
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.ok(Array.isArray(inv.body.invitations));
    assert.ok(inv.body.invitations.length >= 1);

    const jr = await request
      .get("/api/join-requests")
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.ok(Array.isArray(jr.body.joinRequests));
  });

  it("browse live tournaments and submit join request", async () => {
    const store = getStore();
    const clubB = [...store.clubs.values()].find((c) => c.name === "Ocean Links");
    assert.ok(clubB);
    const token = await signIn(request, "player@teezo.local", "password123");

    const live = await request
      .get("/api/clubs/live-tournaments")
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.ok(Array.isArray(live.body.clubs));
    assert.ok(live.body.clubs.length >= 1);

    const join = await request
      .post("/api/join-requests")
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .send({ clubId: clubB!.id })
      .expect(201);
    assert.equal(join.body.joinRequest.status, "pending");
    assert.ok(join.body.club?.id);
  });

  it("views joined clubs, tournaments, and accepts invitation", async () => {
    const store = getStore();
    const token = await signIn(request, "player@teezo.local", "password123");
    const clubs = await request
      .get("/api/me/clubs")
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.ok(Array.isArray(clubs.body.clubs));
    assert.ok(clubs.body.clubs.length >= 1);

    const clubId = clubs.body.clubs[0].id as string;
    const tournaments = await request
      .get(`/api/me/clubs/${clubId}/tournaments`)
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.ok(Array.isArray(tournaments.body.tournaments));

    const inviteId = [...store.invitations.values()].find(
      (i) => i.inviteeEmail === "player@teezo.local" && i.status === "pending",
    )?.id;
    assert.ok(inviteId);
    const accept = await request
      .post(`/api/invitations/${inviteId}/accept`)
      .set({ ...authHeader(token), ...MOBILE_HEADERS })
      .expect(200);
    assert.equal(accept.body.invitation.status, "accepted");
    assert.ok(accept.body.membership?.clubId);
  });
});