import { Role } from "@prisma/client";
import express from "express";
import { CreateApplicationSchema } from "../Dto/ApplicationDTO";
import { ApplicationController } from "../controllers/ApplicationController";
import { authenticate, authorize } from "../middlewares/AuthMiddleware";
import { idParamSchema, validateBody, validateParams } from "../middlewares/ValidationMiddleware";
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

export default router;
