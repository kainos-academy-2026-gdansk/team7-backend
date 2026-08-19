import { Role } from "@prisma/client";
import express from "express";
import { UpdateApplicationStatusSchema } from "../Dto/ApplicationDTO";
import { AddJobRoleSchema, updateJobRoleSchema } from "../Dto/JobRoleDTO";
import { ApplicationController } from "../controllers/ApplicationController";
import { JobRoleController } from "../controllers/JobRoleController";
import { authenticate, authorize } from "../middlewares/AuthMiddleware";
import {
  applicationParamsSchema,
  idParamSchema,
  validateBody,
  validateParams,
} from "../middlewares/ValidationMiddleware";
import prisma from "../prismaClient";
import { ApplicationService } from "../services/ApplicationService";
import { JobRoleService } from "../services/JobRoleService";

const router = express.Router();

const applicationService = new ApplicationService(prisma);
const applicationController = new ApplicationController(applicationService);
const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);

router.post(
  "/job-roles",
  authenticate,
  authorize(Role.ADMIN),
  validateBody(AddJobRoleSchema),
  jobRoleController.addJobRole,
);

router.put(
  "/job-roles/:id",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateJobRoleSchema),
  jobRoleController.updateJobRole,
);

router.delete(
  "/job-roles/:id",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  (req, res, next) => jobRoleController.deleteJobRole(req, res, next),
);

router.get(
  "/applications",
  authenticate,
  authorize(Role.ADMIN),
  applicationController.getAllApplications,
);

router.get(
  "/job-roles/:id/applications",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  applicationController.getApplicationsByJobRoleId,
);

router.patch(
  "/job-roles/:id/applications/:applicationId",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(applicationParamsSchema),
  validateBody(UpdateApplicationStatusSchema),
  applicationController.updateStatus,
);

export default router;
