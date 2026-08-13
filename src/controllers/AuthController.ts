import type { NextFunction, Request, Response } from "express";
import { AuthMapper } from "../mappers/AuthMapper";
import type { AuthService } from "../services/AuthService";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json(AuthMapper.toUserResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      if (!result) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      res.status(200).json({
        token: result.token,
        user: AuthMapper.toUserResponseDto(result.user),
      });
    } catch (error) {
      next(error);
    }
  };
}
