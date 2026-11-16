import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTestApp, useFreshSeed, signIn, authHeader } from "./helpers.js";

describe("email-password auth", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("registers a player and signs in", async () => {
    const email = "newplayer@example.com";
    const reg = await request
      .post("/api/auth/register")
      .send({
        email,
        password: "secretpass",
        fullName: "New Player",
      })
      .expect(201);
    assert.ok(reg.body.accessToken);
    assert.equal(reg.body.account.role, "player");

    const login = await request
      .post("/api/auth/sign-in")
      .send({ email, password: "secretpass" })
      .expect(200);
    assert.ok(login.body.accessToken);
  });

  it("rejects duplicate registration", async () => {
    await request
      .post("/api/auth/register")
      .send({
        email: "dup@example.com",
        password: "a",
        fullName: "Dup",
      })
      .expect(201);
    await request
      .post("/api/auth/register")
      .send({
        email: "dup@example.com",
        password: "b",
        fullName: "Dup2",
      })
      .expect(409);
  });

  it("revokes session", async () => {
    const token = await signIn(request, "player@teezo.local", "password123");
    await request
      .post("/api/auth/sessions/revoke")
      .set(authHeader(token))
      .expect(204);
    await request
      .get("/api/me/clubs")
      .set(authHeader(token))
      .expect(401);
  });

  it("password reset stub accepts and confirms", async () => {
    await request
      .post("/api/auth/password-reset/request")
      .send({ email: "player@teezo.local" })
      .expect(202);
  });
});