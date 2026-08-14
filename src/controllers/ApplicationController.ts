import type { NextFunction, Request, Response } from "express";
import type {
  UpdateApplicationStatusRequestDto,
  UpdateApplicationStatusResponseDto,
} from "../Dto/ApplicationDTO";
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

  getApplicationsByJobRoleId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const jobRoleId = Number(req.params.id);
      const applications = await this.applicationService.findByJobRoleId(jobRoleId);

      if (!applications) {
        res.status(404).json({ message: "Job role not found" });
        return;
      }

      res
        .status(200)
        .json(
          applications.map((application) =>
            ApplicationMapper.toApplicationListItemDto(application),
          ),
        );
    } catch (error) {
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

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobRoleId = Number(req.params.id);
      const applicationId = Number(req.params.applicationId);
      const body = req.body as UpdateApplicationStatusRequestDto;
      const result = await this.applicationService.updateStatus(
        jobRoleId,
        applicationId,
        body.status,
      );

      if (!result) {
        res.status(404).json({ message: "Application not found" });
        return;
      }

      const response: UpdateApplicationStatusResponseDto = {
        application: ApplicationMapper.toApplicationListItemDto(result.application),
        numberOfOpenPositions: result.numberOfOpenPositions,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
