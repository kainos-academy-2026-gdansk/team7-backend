import express from "express";
import { LoginSchema, RegisterSchema } from "../Dto/AuthDTO";
import { AuthController } from "../controllers/AuthController";
import { validateBody } from "../middlewares/ValidationMiddleware";
import prisma from "../prismaClient";
import { AuthService } from "../services/AuthService";

const router = express.Router();

const authService = new AuthService(prisma);
const authController = new AuthController(authService);

router.post("/register", validateBody(RegisterSchema), authController.register);
router.post("/login", validateBody(LoginSchema), authController.login);

export default router;
