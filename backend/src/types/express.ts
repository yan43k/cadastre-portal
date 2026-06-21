import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    validatedQuery?: unknown;
  }
}

export type AuthRequest = Request & {
  user?: { id: string; role: string };
};
