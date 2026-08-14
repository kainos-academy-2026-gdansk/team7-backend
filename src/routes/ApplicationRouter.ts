import { Role } from "@prisma/client";
import express from "express";
import { CreateApplicationSchema, UpdateApplicationStatusSchema } from "../Dto/ApplicationDTO";
import { ApplicationController } from "../controllers/ApplicationController";
import { authenticate, authorize } from "../middlewares/AuthMiddleware";
import {
  applicationParamsSchema,
  idParamSchema,
  validateBody,
  validateParams,
} from "../middlewares/ValidationMiddleware";
import prisma from "../prismaClient";
import { ApplicationService } from "../services/ApplicationService";

const router = express.Router();

const applicationService = new ApplicationService(prisma);
const applicationController = new ApplicationController(applicationService);

router.post(
  "/job-roles/:id/apply",
  authenticate,
  authorize(Role.USER),
  validateParams(idParamSchema),
  validateBody(CreateApplicationSchema),
  applicationController.applyForJobRole,
);
router.get(
  "/applications",
  authenticate,
  authorize(Role.USER),
  applicationController.getMyApplications,
);

router.get(
  "/:id/applications",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(idParamSchema),
  applicationController.getApplicationsByJobRoleId,
);

router.patch(
  "/:id/applications/:applicationId",
  authenticate,
  authorize(Role.ADMIN),
  validateParams(applicationParamsSchema),
  validateBody(UpdateApplicationStatusSchema),
  applicationController.updateStatus,
);

export default router;
