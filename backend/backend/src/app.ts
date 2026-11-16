import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { authRateLimiter } from "./middleware/rate-limit.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { playerRouter } from "./routes/player.js";
import { golfSuggestionsRouter } from "./routes/golf-suggestions.js";
import { previewRouter } from "./routes/preview.js";
import {
  createEmptyStore,
  getStore,
  resetStore,
} from "./store/memory-store.js";
import { seedDemoStore } from "./store/seed-demo-store.js";

export async function bootstrapStore(options?: {
  seed?: boolean;
}): Promise<void> {
  resetStore(createEmptyStore());
  const shouldSeed =
    options?.seed === true ||
    (options?.seed !== false && process.env.NODE_ENV !== "test");
  if (shouldSeed) {
    await seedDemoStore(getStore());
  }
}

export function createApp(): express.Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/api/v1", healthRouter);
  app.use("/api/auth", authRateLimiter, authRouter);
  app.use("/api/preview", previewRouter);
  app.use("/api/golf-suggestions", golfSuggestionsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", playerRouter);

  return app;
}