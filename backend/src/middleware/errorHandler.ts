import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../lib/logger";
import { sendError } from "../utils/http";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Ошибка проверки данных", err.flatten());
  }
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message);
  }
  logger.error(err);
  return sendError(res, 500, "INTERNAL_ERROR", "Внутренняя ошибка сервера");
}
