import express from "express";
import type { Request, Response } from "express";
const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  return res.json({ status: "UP", timestamp: new Date().toISOString() });
});

export default app;
