import { describe, it } from "node:test";
import { createTestApp, useFreshSeed } from "./helpers.js";

describe("health", () => {
  useFreshSeed();
  const { request } = createTestApp();

  it("GET /api/v1/health returns 200", async () => {
    await request.get("/api/v1/health").expect(200);
  });
});