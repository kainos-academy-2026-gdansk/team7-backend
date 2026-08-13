import type { RequestHandler } from "express";
import z, { type ZodError, type ZodSchema } from "zod";

export function toFieldErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateParams(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({ errors: toFieldErrors(result.error) });
      return;
    }
    next();
  };
}

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: toFieldErrors(result.error) });
      return;
    }
    next();
  };
}

const positiveIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Id must be a positive integer")
  .transform(Number);

export const idParamSchema = z.object({ id: positiveIdSchema });

export const applicationParamsSchema = z.object({
  id: positiveIdSchema,
  applicationId: positiveIdSchema,
});
