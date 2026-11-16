import supertest from "supertest";
import { beforeEach } from "node:test";
import { bootstrapStore, createApp } from "../src/app.js";

export function createTestApp() {
  const app = createApp();
  return { app, request: supertest(app) };
}

export function useFreshSeed() {
  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    await bootstrapStore({ seed: true });
  });
}

export async function signIn(
  request: supertest.SuperTest<supertest.Test>,
  email: string,
  password: string,
): Promise<string> {
  const res = await request
    .post("/api/auth/sign-in")
  .send({ email, password })
    .expect(200);
  return res.body.accessToken as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}