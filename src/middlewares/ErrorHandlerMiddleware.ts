import type { NextFunction, Request, Response } from "express";
import Logger from "../lib/logger";
export default function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  Logger.error(err.stack ?? err.message);

  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  res.status(500).json({ message });
}
