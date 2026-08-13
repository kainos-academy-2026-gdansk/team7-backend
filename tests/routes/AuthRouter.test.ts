import { execSync } from "node:child_process";
import type { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type Express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const CONTAINER_TIMEOUT_MS = 120_000;

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: Express.Application;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = "test-secret";

  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  prisma = (await import("../../src/prismaClient")).default;
  app = (await import("../../src/app")).default;
}, CONTAINER_TIMEOUT_MS);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

describe("POST /api/auth/register", () => {
  it("returns 201 with a USER account and never exposes a password hash", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "applicant@example.com",
      password: "Password!",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
      email: "applicant@example.com",
      role: "USER",
    });
    expect(response.body).not.toHaveProperty("passwordHash");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "applicant@example.com" } });
    expect(user.passwordHash).not.toBe("Password!");
  });

  it("returns 400 for a duplicate email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "applicant@example.com",
      password: "Password!",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "email",
      message: "Email is already registered",
    });
  });

  it("returns 400 for invalid input before the service is reached", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "invalid-email",
      password: "short",
      role: "ADMIN",
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token and user when credentials match", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "applicant@example.com",
      password: "Password!",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      token: expect.any(String),
      user: { email: "applicant@example.com", role: "USER" },
    });
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("returns the same 401 response for unknown emails and incorrect passwords", async () => {
    const unknownEmail = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "Password!",
    });
    const incorrectPassword = await request(app).post("/api/auth/login").send({
      email: "applicant@example.com",
      password: "WrongPassword!",
    });

    expect(unknownEmail.status).toBe(401);
    expect(incorrectPassword.status).toBe(401);
    expect(unknownEmail.body).toEqual(incorrectPassword.body);
  });
});
