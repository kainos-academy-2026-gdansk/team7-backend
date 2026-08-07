import express from "express";
import type { Request, Response } from "express";
import Logger from "./lib/logger";
import morganMiddleware from "./middlewares/morganMiddleware";
const app = express();

app.use(express.json());

app.use(morganMiddleware);

app.get("/health", (_req: Request, res: Response) => {
  // Logger.warn("Health check endpoint was called - custon warn");
  return res.json({ status: "UP", timestamp: new Date().toISOString() });
});

app.post("/login", (req: Request, res: Response) => {
  Logger.info(`${req.body.login}`);
  return res.json({ test: "test" });
});

export default app;
