import { Role, type User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "../../src/controllers/AuthController";
import type { AuthService } from "../../src/services/AuthService";

const register = vi.fn();
const login = vi.fn();
const authServiceMock = { register, login } as unknown as AuthService;

const user: User = {
  id: 1,
  email: "applicant@example.com",
  passwordHash: "hashed-password",
  role: Role.USER,
  createdAt: new Date("2026-08-13T00:00:00.000Z"),
  updatedAt: new Date("2026-08-13T00:00:00.000Z"),
};

describe("AuthController", () => {
  let authController: AuthController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let status: ReturnType<typeof vi.fn>;
  let json: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    json = vi.fn();
    status = vi.fn(() => ({ json }));
    req = { body: { email: user.email, password: "Password!" } } as Request;
    res = { status, json } as unknown as Response;
    next = vi.fn();
    authController = new AuthController(authServiceMock);
  });

  it("returns 201 without the password hash when registration succeeds", async () => {
    register.mockResolvedValue(user);

    await authController.register(req, res, next);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ id: user.id, email: user.email, role: Role.USER });
  });

  it("returns 200 with a token when login succeeds", async () => {
    login.mockResolvedValue({ token: "token", user });

    await authController.login(req, res, next);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      token: "token",
      user: { id: user.id, email: user.email, role: Role.USER },
    });
  });

  it("returns 401 with a generic message when login fails", async () => {
    login.mockResolvedValue(null);

    await authController.login(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: "Invalid email or password" });
  });

  it("forwards service errors to the error handler", async () => {
    const error = new Error("Service failure");
    register.mockRejectedValue(error);

    await authController.register(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
