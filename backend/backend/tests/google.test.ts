import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTestApp, useFreshSeed } from "./helpers.js";

describe("google auth", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("creates account via google", async () => {
    const res = await request
      .post("/api/auth/google")
      .send({
        googleSub: "google-sub-1",
        email: "guser@example.com",
        fullName: "Google User",
      })
      .expect(200);
    assert.ok(res.body.accessToken);
    assert.equal(res.body.account.email, "guser@example.com");
  });

  it("rejects duplicate email with password account", async () => {
    await request
      .post("/api/auth/register")
      .send({
        email: "both@example.com",
        password: "pass123",
        fullName: "Both",
      })
      .expect(201);
    await request
      .post("/api/auth/google")
      .send({
        googleSub: "google-sub-2",
        email: "both@example.com",
        fullName: "Both Google",
      })
      .expect(409);
  });

  it("reuses google identity on second sign-in", async () => {
    await request
      .post("/api/auth/google")
      .send({
        googleSub: "google-sub-3",
        email: "reuse@example.com",
        fullName: "Reuse",
      })
      .expect(200);
    const second = await request
      .post("/api/auth/google")
      .send({
        googleSub: "google-sub-3",
        email: "reuse@example.com",
        fullName: "Reuse",
      })
      .expect(200);
    assert.ok(second.body.accessToken);
  });
});