import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signToken } from "../../src/lib/jwt";
import { authenticate, authorize } from "../../src/middlewares/AuthMiddleware";

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe("authenticate", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("returns 401 when the bearer token is missing", () => {
    const req = { header: vi.fn().mockReturnValue(undefined) } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches a verified token payload to the request", () => {
    const token = signToken({ sub: 1, email: "admin@example.com", role: Role.ADMIN });
    const req = { header: vi.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual({ sub: 1, email: "admin@example.com", role: Role.ADMIN });
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 401 for an invalid token", () => {
    const req = { header: vi.fn().mockReturnValue("Bearer invalid") } as unknown as Request;
    const res = createResponse();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("authorize", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createResponse();
    next = vi.fn();
  });

  it("returns 403 when the authenticated user has the wrong role", () => {
    const req = { user: { sub: 1, email: "user@example.com", role: Role.USER } } as Request;

    authorize(Role.ADMIN)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the authenticated user has an allowed role", () => {
    const req = { user: { sub: 1, email: "admin@example.com", role: Role.ADMIN } } as Request;

    authorize(Role.ADMIN)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
