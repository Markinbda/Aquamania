import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __aquamaniaPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__aquamaniaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__aquamaniaPrisma = prisma;
}
