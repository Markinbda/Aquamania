import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(5),
  audience: z.enum(["ALL", "GROUP", "INSTRUCTORS"]).default("ALL"),
  groupId: z.string().trim().optional()
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const announcementsRouter = Router();

announcementsRouter.get("/", async (_req, res) => {
  const data = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" }
  });

  return res.json({ data });
});

announcementsRouter.post("/", async (req: AuthRequest, res) => {
  const body = createSchema.parse(req.body);

  const data = await prisma.announcement.create({
    data: {
      title: body.title,
      body: body.body,
      audience: body.audience,
      groupId: body.groupId,
      createdById: req.user!.sub
    }
  });

  return res.status(201).json({ message: "Announcement drafted", data });
});

announcementsRouter.post("/:id/send", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      sentAt: new Date()
    }
  });

  return res.json({ message: "Announcement sent", data: updated });
});
