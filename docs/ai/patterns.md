# Repository memory — patterns

Copy-paste-grade patterns that are already used in this codebase, plus the anti-patterns we have
agreed to avoid. When code and this file disagree, the code wins — raise the discrepancy.

## Router: wiring and middleware order

```ts
const router = express.Router();

const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAll);
router.get("/:id", validateParams(idParamSchema), jobRoleController.getJobRoleById);
router.post("/", validateBody(AddJobRoleSchema), jobRoleController.addJobRole);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateJobRoleSchema),
  jobRoleController.updateJobRole,
);
router.delete("/:id", validateParams(idParamSchema), jobRoleController.deleteJobRole);

export default router;
```

Params middleware first, then body middleware, then the controller method.

## Controller: arrow-function handlers, HTTP only

```ts
export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  getJobRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const jobRole = await this.jobRoleService.getJobRoleById(id);
      if (!jobRole) {
        res.status(404).json({ message: "Job role not found" });
        return;
      }
      res.status(200).json(JobRoleMapper.toJobRoleDetailedDto(jobRole));
    } catch (error) {
      next(error);
    }
  };
}
```

Arrow properties keep `this` bound when the method is passed directly to Express.

## Service: constructor-injected Prisma, `null` for not found

```ts
export class JobRoleService {
  constructor(private readonly prisma: PrismaClient) {}

  async getJobRoleById(id: number): Promise<JobRoleDetailed | null> {
    const jobRole = await this.prisma.jobRole.findUnique({
      where: { id },
      include: { band: true, capability: true },
    });
    return jobRole ? this.toDetailed(jobRole) : null;
  }
}
```

Expected absence → `null`. Genuine failure → throw and let `next(error)` reach the error handler.

## DTO: Zod as the single source of truth

```ts
export const AddJobRoleSchema = z
  .object({
    roleName: z.string().min(1, "Role name is required"),
    closingDate: z.iso.datetime("Must be an ISO 8601 date-time").nullable(),
    bandId: z.number().int().positive(),
    capabilityId: z.number().int().positive(),
  })
  .strict();

export type AddJobRoleRequestDTO = z.infer<typeof AddJobRoleSchema>;
```

`.strict()` rejects unknown fields. Never hand-write an interface that mirrors a schema.

## Shared id param schema

```ts
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "Id must be a positive integer")
    .transform(Number),
});
```

Reuse it. Do not create per-route id schemas.

## Validation middleware contract

```ts
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
```

`safeParse`, `400 { errors: [{ field, message }] }`, and `req` is left untouched.

## Mapper: static methods, no logic

```ts
export class JobRoleMapper {
  static toJobRoleDetailedDto(jobRole: JobRoleDetailed): JobRoleDetailedDto {
    return {
      id: jobRole.id,
      roleName: jobRole.roleName,
      band: jobRole.band.name,
      capability: jobRole.capability.name,
      closingDate: jobRole.closingDate ? jobRole.closingDate.toISOString() : null,
    };
  }
}
```

Dates become ISO strings; relations are flattened to primitives.

## Global error handler

```ts
Logger.error(err.stack ?? err.message);

if (err instanceof ZodError) {
  res.status(400).json({ errors: toFieldErrors(err) });
  return;
}

const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
res.status(500).json({ message });
```

Registered last in `app.ts`, after all routers.

## Response shapes

| Situation | Status | Body |
| --------- | ------ | ---- |
| Validation failure | 400 | `{ "errors": [{ "field": "roleName", "message": "..." }] }` |
| Not found | 404 | `{ "message": "Job role not found" }` |
| Delete success | 204 | *(empty)* |
| Unexpected error | 500 | `{ "message": "Internal Server Error" }` in production |

## Anti-patterns

- Prisma imported or called inside a controller.
- `req` / `res` / `next` or any Express import inside a service.
- Services importing `prismaClient` directly instead of receiving it in the constructor.
- Repositories, DI containers, factories, base controllers/services, domain entity layers.
- Hand-written interfaces duplicating a Zod schema.
- `console.log` in `src/`, `any`, non-null assertions (all Biome errors).
- Business logic inside a mapper or inside a route callback.
- `200 OK` carrying an error payload.
- Returning `null` for a genuine failure, or throwing for an expected "not found".
