import express from "express";
import { AddJobRoleSchema } from "../Dto/JobRoleDTO";
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

export default router;
