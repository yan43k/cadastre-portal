import type { NextFunction, Request, Response } from "express";

export function asyncHandler<
  P = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
>(
  fn: (
    req: Request<P, unknown, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<Response<unknown> | void | unknown>
) {
  return (req: Request<P, unknown, ReqBody, ReqQuery>, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}
