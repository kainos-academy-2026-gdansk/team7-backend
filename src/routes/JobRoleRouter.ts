import express from "express";
import { JobRoleController } from "../controllers/JobRoleController";
import prisma from "../prismaClient";
import { JobRoleService } from "../services/JobRoleService";

const router = express.Router();

const jobRoleService = new JobRoleService(prisma);
const jobRoleController = new JobRoleController(jobRoleService);

router.get("/", jobRoleController.getAll);

export default router;
