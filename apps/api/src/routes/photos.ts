import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const uploadSchema = z.object({
  groupId: z.string().trim().min(1),
  url: z.string().trim().url(),
  thumbnailUrl: z.string().trim().url().optional(),
  caption: z.string().trim().optional(),
  takenDate: z.coerce.date().optional(),
  taggedSwimmerIds: z.array(z.string().trim().min(1)).optional().default([])
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const photosRouter = Router();

photosRouter.get("/", async (req, res) => {
  const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
  const swimmerId = typeof req.query.swimmerId === "string" ? req.query.swimmerId : undefined;

  const data = await prisma.photo.findMany({
    where: {
      ...(groupId ? { groupId } : {}),
      ...(swimmerId ? { tags: { some: { swimmerId } } } : {})
    },
    include: {
      group: { select: { id: true, name: true } },
      tags: {
        include: {
          swimmer: {
            select: { id: true, firstName: true, lastName: true, groupId: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ data });
});

photosRouter.post("/upload", async (req: AuthRequest, res) => {
  const body = uploadSchema.parse(req.body);

  const taggedSwimmerIds = [...new Set(body.taggedSwimmerIds ?? [])];

  if (taggedSwimmerIds.length > 0) {
    const swimmers = await prisma.swimmer.findMany({
      where: { id: { in: taggedSwimmerIds } },
      select: { id: true, groupId: true }
    });

    if (swimmers.length !== taggedSwimmerIds.length) {
      return res.status(400).json({ message: "One or more tagged swimmers were not found" });
    }

    const hasCrossGroupTag = swimmers.some((swimmer) => swimmer.groupId !== body.groupId);
    if (hasCrossGroupTag) {
      return res.status(400).json({ message: "Tagged swimmers must belong to the selected group" });
    }
  }

  const data = await prisma.photo.create({
    data: {
      groupId: body.groupId,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      caption: body.caption,
      takenDate: body.takenDate,
      uploadedById: req.user!.sub,
      tags: {
        create: taggedSwimmerIds.map((swimmerId) => ({ swimmerId }))
      }
    },
    include: {
      group: { select: { id: true, name: true } },
      tags: {
        include: {
          swimmer: {
            select: { id: true, firstName: true, lastName: true, groupId: true }
          }
        }
      }
    }
  });

  return res.status(201).json({ message: "Photo uploaded", data });
});

photosRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  await prisma.photo.delete({ where: { id } });
  return res.json({ message: "Photo deleted" });
});
