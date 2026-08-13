import express from "express";
import type { Request, Response } from "express";
import errorHandlerMiddleware from "./middlewares/ErrorHandlerMiddleware";
import morganMiddleware from "./middlewares/morganMiddleware";
import authRouter from "./routes/AuthRouter";
import bandRouter from "./routes/BandRouter";
import capabilityRouter from "./routes/CapabilityRouter";
import jobRoleRouter from "./routes/JobRoleRouter";
import statusRouter from "./routes/StatusRouter";
const app = express();

app.use(express.json());

app.use(morganMiddleware);

app.get("/health", (_req: Request, res: Response) => {
  return res.json({ status: "UP", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRouter);
app.use("/api/bands", bandRouter);
app.use("/api/capabilities", capabilityRouter);
app.use("/api/statuses", statusRouter);
app.use("/api/job-roles", jobRoleRouter);

app.use(errorHandlerMiddleware);
export default app;
