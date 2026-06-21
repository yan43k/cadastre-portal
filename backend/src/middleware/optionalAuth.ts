import type { NextFunction, Response } from "express";
import { verifyAccessToken } from "../services/tokens";
import type { AuthRequest } from "../types/express";

/** Не выбрасывает ошибку: при отсутствии или неверном токене просто пропускает. */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    /* гость */
  }
  next();
}
