import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  applicationParamsSchema,
  idParamSchema,
  toFieldErrors,
  validateBody,
  validateParams,
} from "../../src/middlewares/ValidationMiddleware";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nested: z.object({ value: z.number() }).optional(),
});

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("idParamSchema", () => {
  it.each(["1", "42", "1000"])("accepts %s", (id) => {
    const result = idParamSchema.safeParse({ id });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id });
  });

  it.each(["0", "-1", "1.5", "01", "abc", "1a", "", " 1"])("rejects %s", (id) => {
    const result = idParamSchema.safeParse({ id });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Id must be a positive integer");
  });

  it("rejects a missing id", () => {
    expect(idParamSchema.safeParse({}).success).toBe(false);
  });
});

describe("applicationParamsSchema", () => {
  it("accepts positive job role and application ids", () => {
    const result = applicationParamsSchema.safeParse({ id: "1", applicationId: "2" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "1", applicationId: "2" });
  });

  it("rejects an invalid application id", () => {
    const result = applicationParamsSchema.safeParse({ id: "1", applicationId: "0" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["applicationId"]);
  });
});

describe("toFieldErrors", () => {
  it("maps issues to field and message pairs", () => {
    const result = schema.safeParse({ name: "" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error)).toEqual([{ field: "name", message: "Name is required" }]);
  });

  it("joins nested paths with a dot", () => {
    const result = schema.safeParse({ name: "ok", nested: { value: "no" } });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error)[0].field).toBe("nested.value");
  });
});

describe("validateBody", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next when the body is valid", () => {
    const res = createResponse();

    validateBody(schema)({ body: { name: "ok" } } as Request, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds with 400 and the field errors when the body is invalid", () => {
    const res = createResponse();

    validateBody(schema)({ body: { name: "" } } as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "name", message: "Name is required" }],
    });
  });
});

describe("validateParams", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it("calls next when the params are valid", () => {
    const res = createResponse();

    validateParams(idParamSchema)({ params: { id: "1" } } as unknown as Request, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds with 400 and the field errors when the params are invalid", () => {
    const res = createResponse();

    validateParams(idParamSchema)({ params: { id: "abc" } } as unknown as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "id", message: "Id must be a positive integer" }],
    });
  });
});
