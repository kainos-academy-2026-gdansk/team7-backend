import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ConflictError } from "../lib/HttpError";
import Logger from "../lib/logger";
import { toFieldErrors } from "./ValidationMiddleware";
export default function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  Logger.error(err.stack ?? err.message);

  if (err instanceof ZodError) {
    res.status(400).json({ errors: toFieldErrors(err) });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ message: err.message });
    return;
  }

  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  res.status(500).json({ message });
}
