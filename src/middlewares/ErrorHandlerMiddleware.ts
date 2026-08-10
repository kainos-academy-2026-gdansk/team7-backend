import type { NextFunction, Request, Response } from "express";
import Logger from "../lib/logger";
export default function ErrorHandleMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  Logger.error(err.stack ?? err.message);
  res.status(500).json({ message: err.message });
}
