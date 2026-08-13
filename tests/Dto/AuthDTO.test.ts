import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema } from "../../src/Dto/AuthDTO";

const validRegistration = {
  email: "applicant@example.com",
  password: "Password!",
};

describe("RegisterSchema", () => {
  it("accepts a valid registration payload", () => {
    expect(RegisterSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    expect(RegisterSchema.safeParse({ ...validRegistration, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it.each(["password!", "PASSWORD!", "Password1", "Pass!"])(
    "rejects a password without all required character classes: %s",
    (password) => {
      expect(RegisterSchema.safeParse({ ...validRegistration, password }).success).toBe(false);
    },
  );

  it("rejects server-owned role input", () => {
    expect(RegisterSchema.safeParse({ ...validRegistration, role: "ADMIN" }).success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts an email and non-empty password", () => {
    expect(LoginSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(LoginSchema.safeParse({ ...validRegistration, password: "" }).success).toBe(false);
  });
});
