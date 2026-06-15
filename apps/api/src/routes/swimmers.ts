import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  parentId: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  dateOfBirth: z.coerce.date(),
  medicalNotes: z.string().trim().optional(),
  groupId: z.string().trim().optional()
});

const updateSchema = createSchema.partial().omit({ parentId: true });

const moveSchema = z.object({
  groupId: z.string().trim().min(1)
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const swimmersRouter = Router();

swimmersRouter.get("/", async (req, res) => {
  const status = z.enum(["PENDING", "APPROVED", "WAITLISTED", "REJECTED", "INACTIVE"]).optional().parse(req.query.status);

  const swimmers = await prisma.swimmer.findMany({
    where: status ? { registrationStatus: status } : undefined,
    include: {
      parent: { include: { user: true } },
      group: true,
      consentForms: true,
      attendance: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({
    data: swimmers.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      dateOfBirth: item.dateOfBirth,
      registrationStatus: item.registrationStatus,
      parentName: `${item.parent.user.firstName} ${item.parent.user.lastName}`,
      parentEmail: item.parent.user.email,
      groupName: item.group?.name ?? null,
      attendanceCount: item.attendance.length,
      consentSignedCount: item.consentForms.filter((form) => Boolean(form.signedAt)).length
    }))
  });
});

swimmersRouter.get("/export/csv", async (_req, res) => {
  const swimmers = await prisma.swimmer.findMany({
    include: {
      parent: { include: { user: true } },
      group: true
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });

  const header = ["id", "firstName", "lastName", "status", "parentName", "parentEmail", "groupName"];
  const rows = swimmers.map((item) => [
    item.id,
    item.firstName,
    item.lastName,
    item.registrationStatus,
    `${item.parent.user.firstName} ${item.parent.user.lastName}`,
    item.parent.user.email,
    item.group?.name ?? ""
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=swimmers.csv");
  return res.send(csv);
});

swimmersRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  const created = await prisma.swimmer.create({
    data: {
      parentId: body.parentId,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      medicalNotes: body.medicalNotes,
      groupId: body.groupId
    }
  });

  return res.status(201).json({ message: "Swimmer created", data: created });
});

swimmersRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const swimmer = await prisma.swimmer.findUnique({
    where: { id },
    include: {
      parent: { include: { user: true, payments: true } },
      group: true,
      attendance: { include: { session: true }, orderBy: { createdAt: "desc" } },
      consentForms: true
    }
  });

  if (!swimmer) {
    return res.status(404).json({ message: "Swimmer not found" });
  }

  return res.json({ data: swimmer });
});

swimmersRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const updated = await prisma.swimmer.update({
    where: { id },
    data: {
      ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
      ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
      ...(body.medicalNotes !== undefined ? { medicalNotes: body.medicalNotes } : {}),
      ...(body.groupId !== undefined ? { groupId: body.groupId } : {})
    }
  });

  return res.json({ message: "Swimmer updated", data: updated });
});

swimmersRouter.patch("/:id/group", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = moveSchema.parse(req.body);

  const updated = await prisma.swimmer.update({
    where: { id },
    data: {
      groupId: body.groupId,
      registrationStatus: "APPROVED"
    }
  });

  return res.json({ message: "Swimmer moved to new group", data: updated });
});

swimmersRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.swimmer.update({
    where: { id },
    data: { registrationStatus: "INACTIVE", groupId: null }
  });

  return res.json({ message: "Swimmer marked inactive", data: updated });
});
