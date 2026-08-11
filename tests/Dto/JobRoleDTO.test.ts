import { describe, expect, it } from "vitest";
import { updateJobRoleSchema } from "../../src/Dto/JobRoleDTO";

const validBody = {
  jobRoleName: "Software Engineer",
  location: "Gdansk",
  status: "OPEN",
  bandName: "Senior Associate",
  capabilityName: "Engineering",
  description: "Builds things",
  responsibilities: "Writes code",
  sharePointLink: "https://example.com/role/1",
  openPositions: 3,
  closingDate: "2026-12-31T00:00:00.000Z",
};

function parse(overrides: Record<string, unknown> = {}) {
  return updateJobRoleSchema.safeParse({ ...validBody, ...overrides });
}

function fieldErrors(result: ReturnType<typeof parse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
}

describe("updateJobRoleSchema", () => {
  it("accepts a valid payload", () => {
    const result = parse();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validBody);
  });

  it("accepts null for every nullable field", () => {
    const result = parse({
      description: null,
      responsibilities: null,
      sharePointLink: null,
      openPositions: null,
      closingDate: null,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      description: null,
      responsibilities: null,
      sharePointLink: null,
      openPositions: null,
      closingDate: null,
    });
  });

  it("trims surrounding whitespace from string fields", () => {
    const result = parse({
      jobRoleName: "  Software Engineer  ",
      location: "  Gdansk  ",
      bandName: "  Senior Associate  ",
      capabilityName: "  Engineering  ",
      description: "  Builds things  ",
      responsibilities: "  Writes code  ",
    });

    expect(result.data).toMatchObject({
      jobRoleName: "Software Engineer",
      location: "Gdansk",
      bandName: "Senior Associate",
      capabilityName: "Engineering",
      description: "Builds things",
      responsibilities: "Writes code",
    });
  });

  describe("required fields", () => {
    const requiredFields = [
      "jobRoleName",
      "location",
      "status",
      "bandName",
      "capabilityName",
      "description",
      "responsibilities",
      "sharePointLink",
      "openPositions",
      "closingDate",
    ];

    it.each(requiredFields)("rejects a payload without %s", (field) => {
      const body: Record<string, unknown> = { ...validBody };
      delete body[field];

      const result = updateJobRoleSchema.safeParse(body);

      expect(result.success).toBe(false);
      expect(fieldErrors(result)).toContainEqual(expect.objectContaining({ field }));
    });

    it.each(["jobRoleName", "location", "bandName", "capabilityName"])(
      "rejects %s when it is not a string",
      (field) => {
        const result = parse({ [field]: 42 });

        expect(fieldErrors(result)).toContainEqual(expect.objectContaining({ field }));
      },
    );
  });

  describe("non-empty strings", () => {
    const nonEmptyFields = [
      { field: "jobRoleName", message: "Role name is required" },
      { field: "location", message: "Location is required" },
      { field: "bandName", message: "Band is required" },
      { field: "capabilityName", message: "Capability is required" },
    ];

    it.each(nonEmptyFields)("rejects an empty $field", ({ field, message }) => {
      const result = parse({ [field]: "" });

      expect(fieldErrors(result)).toContainEqual({ field, message });
    });

    it.each(nonEmptyFields)("rejects a whitespace-only $field", ({ field, message }) => {
      const result = parse({ [field]: "   " });

      expect(fieldErrors(result)).toContainEqual({ field, message });
    });
  });

  describe("max lengths", () => {
    const maxLengthFields = [
      { field: "jobRoleName", max: 100 },
      { field: "location", max: 100 },
      { field: "description", max: 2000 },
      { field: "responsibilities", max: 2000 },
    ];

    it.each(maxLengthFields)("accepts $field at exactly $max characters", ({ field, max }) => {
      const result = parse({ [field]: "a".repeat(max) });

      expect(result.success).toBe(true);
    });

    it.each(maxLengthFields)("rejects $field longer than $max characters", ({ field, max }) => {
      const result = parse({ [field]: "a".repeat(max + 1) });

      expect(fieldErrors(result)).toContainEqual(expect.objectContaining({ field }));
    });
  });

  describe("status", () => {
    it.each(["OPEN", "CLOSED"])("accepts %s", (status) => {
      expect(parse({ status }).success).toBe(true);
    });

    it.each(["PENDING", "open", "", null])("rejects %s", (status) => {
      const result = parse({ status });

      expect(fieldErrors(result)).toContainEqual(expect.objectContaining({ field: "status" }));
    });
  });

  describe("sharePointLink", () => {
    it("accepts a valid url", () => {
      expect(parse({ sharePointLink: "https://example.com/role/2" }).success).toBe(true);
    });

    it.each(["not-a-url", "example.com", ""])("rejects %s", (sharePointLink) => {
      const result = parse({ sharePointLink });

      expect(fieldErrors(result)).toContainEqual({
        field: "sharePointLink",
        message: "Must be a valid URL",
      });
    });
  });

  describe("openPositions", () => {
    it.each([0, 1, 250])("accepts %s", (openPositions) => {
      expect(parse({ openPositions }).success).toBe(true);
    });

    it.each([-1, 1.5, "3"])("rejects %s", (openPositions) => {
      const result = parse({ openPositions });

      expect(fieldErrors(result)).toContainEqual(
        expect.objectContaining({ field: "openPositions" }),
      );
    });
  });

  describe("closingDate", () => {
    it("accepts an ISO 8601 date-time", () => {
      expect(parse({ closingDate: "2027-01-31T23:59:59.000Z" }).success).toBe(true);
    });

    it.each(["2027-01-31", "31/01/2027", "not-a-date", ""])("rejects %s", (closingDate) => {
      const result = parse({ closingDate });

      expect(fieldErrors(result)).toContainEqual({
        field: "closingDate",
        message: "Must be an ISO 8601 date-time",
      });
    });
  });

  it("rejects unknown fields", () => {
    const result = parse({ id: 99 });

    expect(result.success).toBe(false);
  });

  it("reports every invalid field at once", () => {
    const result = parse({ jobRoleName: "", location: "", status: "PENDING" });

    expect(fieldErrors(result).map((error) => error.field)).toEqual(
      expect.arrayContaining(["jobRoleName", "location", "status"]),
    );
  });
});
