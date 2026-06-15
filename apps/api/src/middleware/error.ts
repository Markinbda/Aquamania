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

    const prismaErr = err as { errorCode?: string; message?: string };
    const rawMessage = prismaErr.message ?? "";
    const shortMessage = rawMessage.split("\n")[0] ?? "Prisma initialization failed";

    let hint = "Check DATABASE_URL and database access, then try again.";
    if (prismaErr.errorCode === "P1000") {
      hint = "Database authentication failed. Verify username/password and URL encoding in DATABASE_URL.";
    } else if (prismaErr.errorCode === "P1001") {
      hint = "Cannot reach database host. Verify host, port, and network access.";
    } else if (rawMessage.toLowerCase().includes("ssl")) {
      hint = "SSL connection failed. Ensure DATABASE_URL includes sslmode=require.";
    }

    return res.status(503).json({
      message: "Database is unavailable.",
      hint,
      prismaCode: prismaErr.errorCode ?? null,
      details: shortMessage
    });
  }

  console.error("[api:error]", err);
  return res.status(500).json({ message: "Something went wrong" });
}
