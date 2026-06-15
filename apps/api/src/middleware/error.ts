import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "PrismaClientInitializationError"
  ) {
    console.error("[api:error] Database unavailable", err);
    return res.status(503).json({
      message: "Database is unavailable. Check DATABASE_URL and database access, then try again."
    });
  }

  console.error("[api:error]", err);
  return res.status(500).json({ message: "Something went wrong" });
}
