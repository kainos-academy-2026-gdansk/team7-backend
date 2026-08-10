import express from "express";
import { JobRoleController } from "../controllers/JobRoleController";
import { validateParams } from "../middlewares/ValidationMiddleware";
import { idParamSchema } from "../middlewares/ValidationMiddleware";
import prisma from "../prismaClient";
import { JobRoleService } from "../services/JobRoleService";

const router = express.Router();

const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAll);
router.get("/:id", validateParams(idParamSchema), (req, res, next) =>
  jobRoleController.getJobRoleById(req, res, next),
);

export default router;
