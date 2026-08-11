import express from "express";
import { CapabilityController } from "../controllers/CapabilityController";
import prisma from "../prismaClient";
import { CapabilityService } from "../services/CapabilityService";

const router = express.Router();

const capabilityService = new CapabilityService(prisma);
const capabilityController = new CapabilityController(capabilityService);

router.get("/", capabilityController.getAll);

export default router;
