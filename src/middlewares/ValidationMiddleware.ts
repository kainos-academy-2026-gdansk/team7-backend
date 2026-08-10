import type { RequestHandler } from "express";
import { z, type ZodSchema } from "zod";

export function validateParams(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    // Apply any Zod transforms (e.g. string -> number)
    req.params = result.data as any;
    next();
  };
}

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "Id must be a positive integer")
    .transform(Number),
});
