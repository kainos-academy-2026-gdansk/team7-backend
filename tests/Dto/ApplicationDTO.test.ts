import { describe, expect, it } from "vitest";
import { CreateApplicationSchema } from "../../src/Dto/ApplicationDTO";

const validBody = {
  experience: "Three years building backend services",
  salaryExpectation: "60000 GBP annually",
  skills: "TypeScript, Node.js, PostgreSQL",
};

function parse(overrides: Record<string, unknown> = {}) {
  return CreateApplicationSchema.safeParse({ ...validBody, ...overrides });
}

function fieldErrors(result: ReturnType<typeof parse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
}

describe("CreateApplicationSchema", () => {
  it("accepts a valid application request", () => {
    expect(parse().success).toBe(true);
  });

  it.each(["experience", "salaryExpectation", "skills"])(
    "rejects a request without %s",
    (field) => {
      const body: Record<string, unknown> = { ...validBody };
      delete body[field];

      expect(fieldErrors(CreateApplicationSchema.safeParse(body))).toContainEqual(
        expect.objectContaining({ field }),
      );
    },
  );

  it.each(["experience", "salaryExpectation", "skills"])("rejects whitespace-only %s", (field) => {
    expect(fieldErrors(parse({ [field]: "   " }))).toContainEqual(
      expect.objectContaining({ field }),
    );
  });

  it.each([
    { field: "experience", max: 1000 },
    { field: "salaryExpectation", max: 100 },
    { field: "skills", max: 2000 },
  ])("accepts $field at exactly $max characters", ({ field, max }) => {
    expect(parse({ [field]: "a".repeat(max) }).success).toBe(true);
  });

  it.each([
    { field: "experience", max: 1000 },
    { field: "salaryExpectation", max: 100 },
    { field: "skills", max: 2000 },
  ])("rejects $field above its database limit", ({ field, max }) => {
    expect(fieldErrors(parse({ [field]: "a".repeat(max + 1) }))).toContainEqual(
      expect.objectContaining({ field }),
    );
  });

  it.each(["experience", "salaryExpectation", "skills"])("rejects non-string %s", (field) => {
    expect(fieldErrors(parse({ [field]: 42 }))).toContainEqual(expect.objectContaining({ field }));
  });

  it("trims surrounding whitespace from submitted fields", () => {
    const result = CreateApplicationSchema.safeParse({
      experience: "  Three years  ",
      salaryExpectation: "  60000 GBP  ",
      skills: "  TypeScript  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      experience: "Three years",
      salaryExpectation: "60000 GBP",
      skills: "TypeScript",
    });
  });

  it.each(["cv", "id", "statusId"])("rejects server-owned or deferred field %s", (field) => {
    expect(parse({ [field]: "not accepted" }).success).toBe(false);
  });
});
