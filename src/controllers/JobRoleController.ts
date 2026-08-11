import type { NextFunction, Request, Response } from "express";
import { JobRoleMapper } from "../mappers/JobRoleMapper";
import type { JobRoleService } from "../services/JobRoleService";

export class JobRoleController {
  constructor(private readonly jobRoleService: JobRoleService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.jobRoleService.findAll();
      res.status(200).json(roles.map((r) => JobRoleMapper.toAllResponseDto(r)));
    } catch (error) {
      next(error);
    }
  };

  getJobRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const jobRoleDetails = await this.jobRoleService.getJobRoleById(id);
      if (!jobRoleDetails) {
        res.status(404).json({ message: "Job role not found" });
        return;
      }
      res.status(200).json(JobRoleMapper.toJobRoleDetailedDto(jobRoleDetails));
    } catch (error) {
      next(error);
    }
  };

  addJobRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body;
      const newJobRole = await this.jobRoleService.createJobRole(body);

      res.status(201).json(JobRoleMapper.toAddJobRoleResponseDto(newJobRole));
    } catch (error) {
      next(error);
    }
  };

  updateJobRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const updatedJobRole = await this.jobRoleService.updateJobRole(id, req.body);
      if (!updatedJobRole) {
        res.status(404).json({ message: "Job role not found" });
        return;
      }
      res.status(200).json(JobRoleMapper.toJobRoleDetailedDto(updatedJobRole));
    } catch (error) {
      next(error);
    }
  };
}
