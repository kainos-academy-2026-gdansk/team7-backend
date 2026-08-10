import express from "express";
import type { Request, Response } from "express";
import jobRoleRouter from "./routes/JobRoleRouter";
import morganMiddleware from "./middlewares/morganMiddleware";
const app = express();

app.use(express.json());

app.use(morganMiddleware);

app.use("/job-roles", jobRoleRouter);

app.get("/health", (_req: Request, res: Response) => {
  return res.json({ status: "UP", timestamp: new Date().toISOString() });
});

export default app;
