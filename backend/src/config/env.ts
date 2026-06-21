import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TTL: z.string().default("15m"),
  REFRESH_TTL_DAYS: z.coerce.number().default(14),
  CORS_ORIGINS: z.string().default("http://localhost:5174"),
  FRONTEND_URL: z.string().default("http://localhost:5174"),
  API_PUBLIC_URL: z.string().default("http://localhost:4001"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  REFRESH_COOKIE_NAME: z.string().default("rt_cadastre"),
  STORAGE_ROOT: z.string().default("./storage"),
  UPLOAD_SUBDIR: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().default(15),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_CLIENT_EMAIL: z.string().email().optional(),
  SEED_CLIENT_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsOriginList =
  env.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
