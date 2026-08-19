import type { NextFunction, Request, Response } from "express";
import type { StatusService } from "../services/StatusService";

export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statuses = await this.statusService.findAll();
      res.status(200).json(statuses);
    } catch (error) {
      next(error);
    }
  };
}
