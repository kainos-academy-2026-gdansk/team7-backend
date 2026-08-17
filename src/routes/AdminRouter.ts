import { Role } from "@prisma/client";
import express from "express";
import { UpdateApplicationStatusSchema } from "../Dto/ApplicationDTO";
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
