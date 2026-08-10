import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app";
import prisma from "../../src/prismaClient";

vi.mock("../../src/prismaClient", () => ({
  default: {
    jobRole: {
      findMany: vi.fn(),
    },
  },
}));

describe("JobRoleRouter - GET /", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with all roles", async () => {
    vi.mocked(prisma.jobRole.findMany).mockResolvedValue([
      {
        roleName: "Front-End Engineer",
        location: "Gdansk",
        closingDate: new Date("2026-08-31T00:00:00.000Z"),
        band: { name: "Associate" },
        capability: { name: "Engineering" },
      },
      {
        roleName: "Back-End Engineer",
        location: "Gdansk",
        closingDate: new Date("2026-08-31T00:00:00.000Z"),
        band: { name: "Associate" },
        capability: { name: "Engineering" },
      },
    ] as any);

    const response = await request(app).get("/job-roles");

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
  });

  it("should return 500 when service fails", async () => {
    vi.mocked(prisma.jobRole.findMany).mockRejectedValueOnce(
      new Error("Database connection failed"),
    );

    const response = await request(app).get("/job-roles");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal Server Error" });
  });

  it("should return 200 with empty list", async () => {
    vi.mocked(prisma.jobRole.findMany).mockResolvedValueOnce([]);

    const response = await request(app).get("/job-roles");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
