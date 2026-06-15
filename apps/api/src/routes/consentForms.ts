import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const signSchema = z.object({
  swimmerId: z.string().trim().min(1),
  formType: z.enum(["WATER_SAFETY", "PHOTO_CONSENT", "MEDICAL_CONSENT", "GENERAL"]),
  signedByName: z.string().trim().min(2)
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const consentFormsRouter = Router();

consentFormsRouter.get("/", async (req, res) => {
  const swimmerId = typeof req.query.swimmerId === "string" ? req.query.swimmerId : undefined;

  const data = await prisma.consentForm.findMany({
    where: swimmerId ? { swimmerId } : undefined,
    orderBy: { createdAt: "desc" }
  });

  return res.json({ data });
});

consentFormsRouter.post("/sign", async (req: AuthRequest, res) => {
  const body = signSchema.parse(req.body);

  const existing = await prisma.consentForm.findFirst({
    where: { swimmerId: body.swimmerId, formType: body.formType },
    orderBy: { createdAt: "desc" }
  });

  const data = existing
    ? await prisma.consentForm.update({
        where: { id: existing.id },
        data: {
          signedAt: new Date(),
          signedByName: body.signedByName,
          ipAddress: req.ip ?? null
        }
      })
    : await prisma.consentForm.create({
        data: {
          swimmerId: body.swimmerId,
          formType: body.formType,
          signedAt: new Date(),
          signedByName: body.signedByName,
          ipAddress: req.ip ?? null
        }
      });

  return res.json({ message: "Consent signed", data });
});

consentFormsRouter.get("/:id/download", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const form = await prisma.consentForm.findUnique({ where: { id } });
  if (!form) {
    return res.status(404).json({ message: "Consent form not found" });
  }

  return res.json({
    id: form.id,
    swimmerId: form.swimmerId,
    formType: form.formType,
    signedAt: form.signedAt,
    signedByName: form.signedByName,
    version: form.version,
    fileUrl: form.fileUrl
  });
});
