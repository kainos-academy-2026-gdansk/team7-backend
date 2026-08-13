import express from "express";
import { StatusController } from "../controllers/StatusController";
import prisma from "../prismaClient";
import { StatusService } from "../services/StatusService";

const router = express.Router();

const statusService = new StatusService(prisma);
const statusController = new StatusController(statusService);

router.get("/", statusController.getAll);

export default router;
