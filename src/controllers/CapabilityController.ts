import type { NextFunction, Request, Response } from "express";
import type { CapabilityService } from "../services/CapabilityService";

export class CapabilityController {
  constructor(private readonly capabilityService: CapabilityService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const capabilities = await this.capabilityService.findAll();
      res.status(200).json(capabilities);
    } catch (error) {
      next(error);
    }
  };
}
