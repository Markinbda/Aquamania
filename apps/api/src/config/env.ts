import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  SENDGRID_FROM_EMAIL: z.string().email().default("noreply@aquamania.bm")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Keep this concise so startup failures are easy for non-technical admins to relay.
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
