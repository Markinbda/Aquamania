import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { adminRegistrationsRouter } from "./routes/adminRegistrations.js";
import { announcementsRouter } from "./routes/announcements.js";
import { authRouter } from "./routes/auth.js";
import { consentFormsRouter } from "./routes/consentForms.js";
import { groupsRouter } from "./routes/groups.js";
import { healthRouter } from "./routes/health.js";
import { instructorsRouter } from "./routes/instructors.js";
import { instructorPortalRouter } from "./routes/instructorPortal.js";
import { parentPortalRouter } from "./routes/parentPortal.js";
import { paymentsRouter } from "./routes/payments.js";
import { photosRouter } from "./routes/photos.js";
import { poolLocationsRouter } from "./routes/poolLocations.js";
import { programLevelsRouter } from "./routes/programLevels.js";
import { sessionsRouter } from "./routes/sessions.js";
import { swimmersRouter } from "./routes/swimmers.js";
import { termsRouter } from "./routes/terms.js";

dotenv.config();

export function createApp() {
  const app = express();
  const allowedOrigins = env.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server calls and same-origin requests without Origin.
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.get("/api", (_req, res) => {
    res.json({ message: "Aquamania API is running" });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin/registrations", requireAuth, requireRole(["ADMIN"]), adminRegistrationsRouter);
  app.use("/api/groups", requireAuth, requireRole(["ADMIN"]), groupsRouter);
  app.use("/api/instructors", requireAuth, requireRole(["ADMIN"]), instructorsRouter);
  app.use("/api/swimmers", requireAuth, requireRole(["ADMIN"]), swimmersRouter);
  app.use("/api/sessions", requireAuth, requireRole(["ADMIN", "INSTRUCTOR"]), sessionsRouter);
  app.use("/api/payments", requireAuth, requireRole(["ADMIN"]), paymentsRouter);
  app.use("/api/photos", requireAuth, requireRole(["ADMIN", "PARENT"]), photosRouter);
  app.use("/api/consent-forms", requireAuth, requireRole(["ADMIN", "PARENT"]), consentFormsRouter);
  app.use("/api/announcements", requireAuth, requireRole(["ADMIN", "PARENT", "INSTRUCTOR"]), announcementsRouter);
  app.use("/api/program-levels", requireAuth, requireRole(["ADMIN"]), programLevelsRouter);
  app.use("/api/pool-locations", requireAuth, requireRole(["ADMIN"]), poolLocationsRouter);
  app.use("/api/terms", requireAuth, requireRole(["ADMIN"]), termsRouter);
  app.use("/api/parent", requireAuth, requireRole(["PARENT"]), parentPortalRouter);
  app.use("/api/instructor", requireAuth, requireRole(["INSTRUCTOR"]), instructorPortalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
