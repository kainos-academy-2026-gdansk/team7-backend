import type { Request, Response } from "express";
import Logger from "../lib/logger";
import { JobRoleMapper } from "../mappers/JobRoleMapper";
import type { JobRoleService } from "../services/JobRoleService";

export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.jobRoleService.findAll();
      res.status(200).json(roles.map((r) => JobRoleMapper.toAllResponseDto(r)));
    } catch (error) {
      Logger.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
