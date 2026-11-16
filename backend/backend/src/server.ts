import { config } from "./config.js";
import { bootstrapStore, createApp } from "./app.js";

await bootstrapStore({ seed: true });
const app = createApp();

app.listen(config.port, () => {
  console.info(`Teezo API listening on port ${config.port}`);
});