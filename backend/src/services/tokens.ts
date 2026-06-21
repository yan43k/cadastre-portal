import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessPayload = { sub: string; role: string };

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL,
    issuer: "cadastre-ip-api",
    audience: "cadastre-ip-spa",
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "cadastre-ip-api",
    audience: "cadastre-ip-spa",
  });
  if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return { sub: decoded.sub, role: String(decoded.role) };
}
