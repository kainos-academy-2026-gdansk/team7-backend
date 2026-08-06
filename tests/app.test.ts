import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("App.ts", () => {
  describe("/health", () => {
    it("should return code 200 with json body", async () => {
      const result = await request(app).get("/health");

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("timestamp");
      expect(result.body).toHaveProperty("status", "UP");
      expect(typeof result.body.timestamp).toBe("string");
      const date = new Date(result.body.timestamp);
      expect(Number.isNaN(date.getTime())).toBe(false);
    });
  });
});
