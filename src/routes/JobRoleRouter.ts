import { Role } from "@prisma/client";
import express from "express";
import { AddJobRoleSchema, updateJobRoleSchema } from "../Dto/JobRoleDTO";
import { JobRoleController } from "../controllers/JobRoleController";
import { authenticate, authorize } from "../middlewares/AuthMiddleware";
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

router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  validateBody(AddJobRoleSchema),
  jobRoleController.addJobRole,
);
router.put(
  "/:id",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateJobRoleSchema),
  jobRoleController.updateJobRole,
);
router.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  (req, res, next) => jobRoleController.deleteJobRole(req, res, next),
);

export default router;
