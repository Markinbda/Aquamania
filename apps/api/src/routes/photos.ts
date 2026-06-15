import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const uploadSchema = z.object({
  groupId: z.string().trim().min(1),
  url: z.string().trim().url(),
  thumbnailUrl: z.string().trim().url().optional(),
  caption: z.string().trim().optional(),
  takenDate: z.coerce.date().optional()
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const photosRouter = Router();

photosRouter.get("/", async (req, res) => {
  const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;

  const data = await prisma.photo.findMany({
    where: groupId ? { groupId } : undefined,
    orderBy: { createdAt: "desc" }
  });

  return res.json({ data });
});

photosRouter.post("/upload", async (req: AuthRequest, res) => {
  const body = uploadSchema.parse(req.body);

  const data = await prisma.photo.create({
    data: {
      groupId: body.groupId,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      caption: body.caption,
      takenDate: body.takenDate,
      uploadedById: req.user!.sub
    }
  });

  return res.status(201).json({ message: "Photo uploaded", data });
});

photosRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  await prisma.photo.delete({ where: { id } });
  return res.json({ message: "Photo deleted" });
});
