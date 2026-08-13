import { type PrismaClient, Role, type User } from "@prisma/client";
import argon2 from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { AuthService } from "../../src/services/AuthService";

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
  },
}));

const findUnique = vi.fn();
const create = vi.fn();
const dbMock = {
  user: { findUnique, create },
} as unknown as PrismaClient;

const user: User = {
  id: 1,
  email: "applicant@example.com",
  passwordHash: "hashed-password",
  role: Role.USER,
  createdAt: new Date("2026-08-13T00:00:00.000Z"),
  updatedAt: new Date("2026-08-13T00:00:00.000Z"),
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = "test-secret";
    authService = new AuthService(dbMock);
  });

  describe("register", () => {
    it("hashes the password and creates a USER account", async () => {
      findUnique.mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue("hashed-password");
      create.mockResolvedValue(user);

      const result = await authService.register({
        email: user.email,
        password: "Password!",
      });

      expect(result).toEqual(user);
      expect(create).toHaveBeenCalledWith({
        data: {
          email: user.email,
          passwordHash: "hashed-password",
          role: Role.USER,
        },
      });
    });

    it("returns a field validation error when the email is already registered", async () => {
      findUnique.mockResolvedValue({ id: user.id });

      await expect(
        authService.register({ email: user.email, password: "Password!" }),
      ).rejects.toBeInstanceOf(ZodError);
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns a token and the user when the password matches", async () => {
      findUnique.mockResolvedValue(user);
      vi.mocked(argon2.verify).mockResolvedValue(true);

      const result = await authService.login({ email: user.email, password: "Password!" });

      expect(result).toMatchObject({ user });
      expect(result?.token).toEqual(expect.any(String));
      expect(argon2.verify).toHaveBeenCalledWith(user.passwordHash, "Password!");
    });

    it("returns null when the email is not registered", async () => {
      findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: user.email, password: "Password!" }),
      ).resolves.toBeNull();
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it("returns null when the password does not match", async () => {
      findUnique.mockResolvedValue(user);
      vi.mocked(argon2.verify).mockResolvedValue(false);

      await expect(
        authService.login({ email: user.email, password: "Password!" }),
      ).resolves.toBeNull();
    });
  });
});
