import express from "express";
import type { Request, Response } from "express";
import errorHandlerMiddleware from "./middlewares/ErrorHandlerMiddleware";
import morganMiddleware from "./middlewares/morganMiddleware";
import jobRoleRouter from "./routes/JobRoleRouter";
const app = express();

app.use(express.json());

app.use(morganMiddleware);



app.get("/health", (_req: Request, res: Response) => {
  return res.json({ status: "UP", timestamp: new Date().toISOString() });
});
app.use("/api/job-roles", jobRoleRouter);

app.use(errorHandlerMiddleware);
export default app;
