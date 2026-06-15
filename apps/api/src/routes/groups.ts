import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const dayMap: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

const createSchema = z.object({
  name: z.string().trim().min(2),
  programLevelId: z.string().trim().min(1),
  poolLocationId: z.string().trim().min(1),
  instructorId: z.string().trim().min(1),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().trim().min(4),
  endTime: z.string().trim().min(4),
  capacity: z.number().int().positive().default(10),
  termId: z.string().trim().optional()
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional()
});

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const groupsRouter = Router();

groupsRouter.get("/", async (_req, res) => {
  const data = await prisma.group.findMany({
    include: {
      programLevel: { select: { id: true, name: true } },
      poolLocation: { select: { id: true, name: true } },
      instructor: { include: { user: true } },
      term: { select: { id: true, name: true } },
      _count: { select: { swimmers: true, sessions: true } }
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return res.json({ data });
});

groupsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  const created = await prisma.group.create({
    data: {
      name: body.name,
      programLevelId: body.programLevelId,
      poolLocationId: body.poolLocationId,
      instructorId: body.instructorId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      capacity: body.capacity,
      termId: body.termId
    }
  });

  return res.status(201).json({ message: "Group created", data: created });
});

groupsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      programLevel: true,
      poolLocation: true,
      instructor: { include: { user: true } },
      term: true,
      swimmers: {
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      },
      sessions: {
        orderBy: { date: "asc" }
      }
    }
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  return res.json(group);
});

groupsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const updated = await prisma.group.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.programLevelId !== undefined ? { programLevelId: body.programLevelId } : {}),
      ...(body.poolLocationId !== undefined ? { poolLocationId: body.poolLocationId } : {}),
      ...(body.instructorId !== undefined ? { instructorId: body.instructorId } : {}),
      ...(body.dayOfWeek !== undefined ? { dayOfWeek: body.dayOfWeek } : {}),
      ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
      ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
      ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
      ...(body.termId !== undefined ? { termId: body.termId } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
    }
  });

  return res.json({ message: "Group updated", data: updated });
});

groupsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.$transaction(async (tx) => {
    const group = await tx.group.update({
      where: { id },
      data: { isActive: false }
    });

    await tx.swimmer.updateMany({
      where: { groupId: id },
      data: {
        groupId: null,
        registrationStatus: "WAITLISTED"
      }
    });

    return group;
  });

  return res.json({ message: "Group deactivated and swimmers moved to waitlist", data: updated });
});

groupsRouter.post("/:id/generate-sessions", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const group = await prisma.group.findUnique({ where: { id }, include: { term: true } });
  if (!group || !group.term) {
    return res.status(400).json({ message: "Group with an assigned term is required" });
  }

  const dayNumber = dayMap[group.dayOfWeek];
  const start = new Date(group.term.startDate);
  const end = new Date(group.term.endDate);

  const existing = await prisma.session.findMany({
    where: { groupId: id },
    select: { date: true }
  });
  const existingSet = new Set(existing.map((item) => item.date.toISOString().slice(0, 10)));

  const toCreate: Array<{ groupId: string; date: Date }> = [];
  const cursor = new Date(start);

  while (cursor.getDay() !== dayNumber) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    if (!existingSet.has(key)) {
      toCreate.push({ groupId: id, date: new Date(cursor) });
    }
    cursor.setDate(cursor.getDate() + 7);
  }

  if (toCreate.length > 0) {
    await prisma.session.createMany({ data: toCreate });
  }

  return res.json({ message: `Generated ${toCreate.length} sessions`, count: toCreate.length });
});
