import express from "express";
import { AddJobRoleSchema, updateJobRoleSchema } from "../Dto/JobRoleDTO";
import { JobRoleController } from "../controllers/JobRoleController";
import { idParamSchema, validateBody, validateParams } from "../middlewares/ValidationMiddleware";
import prisma from "../prismaClient";
import { JobRoleService } from "../services/JobRoleService";
const router = express.Router();

const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAll);
router.get("/:id", validateParams(idParamSchema), (req, res, next) =>
  jobRoleController.getJobRoleById(req, res, next),
);

router.post("/", validateBody(AddJobRoleSchema), jobRoleController.addJobRole);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateJobRoleSchema),
  jobRoleController.updateJobRole,
);
router.delete("/:id", validateParams(idParamSchema), (req, res, next) =>
  jobRoleController.deleteJobRole(req, res, next),
);

export default router;
