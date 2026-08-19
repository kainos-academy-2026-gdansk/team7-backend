import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt";

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.header("authorization");
  const [scheme, token, ...rest] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token || rest.length > 0) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export function authorize(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
