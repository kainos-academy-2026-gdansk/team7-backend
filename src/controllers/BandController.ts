import type { NextFunction, Request, Response } from "express";
import type { BandService } from "../services/BandService";

export class BandController {
  constructor(private readonly bandService: BandService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bands = await this.bandService.findAll();
      res.status(200).json(bands);
    } catch (error) {
      next(error);
    }
  };
}
