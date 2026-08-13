import type { NextFunction, Request, Response } from "express";
import { ApplicationMapper } from "../mappers/ApplicationMapper";
import { ApplicationConflictError, type ApplicationService } from "../services/ApplicationService";

export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  applyForJobRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applicantId = req.user?.sub;
      if (!applicantId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const jobRoleId = Number(req.params.id);
      const application = await this.applicationService.createApplication(
        applicantId,
        jobRoleId,
        req.body,
      );

      if (!application) {
        res.status(404).json({ message: "Job role not found" });
        return;
      }

      res.status(201).json(ApplicationMapper.toApplicationResponseDto(application));
    } catch (error) {
      if (error instanceof ApplicationConflictError) {
        res.status(409).json({ message: error.message });
        return;
      }

      next(error);
    }
  };

  getMyApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applicantId = req.user?.sub;
      if (!applicantId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const applications = await this.applicationService.findByApplicantId(applicantId);
      res.status(200).json(applications.map(ApplicationMapper.toApplicationResponseDto));
    } catch (error) {
      next(error);
    }
  };
}
