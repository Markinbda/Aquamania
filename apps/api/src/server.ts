import dotenv from "dotenv";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

dotenv.config();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[aquamania-api] listening on http://localhost:${env.PORT}`);
});
