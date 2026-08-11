import express from "express";
import { BandController } from "../controllers/BandController";
import prisma from "../prismaClient";
import { BandService } from "../services/BandService";

const router = express.Router();

const bandService = new BandService(prisma);
const bandController = new BandController(bandService);

router.get("/", bandController.getAll);

export default router;
