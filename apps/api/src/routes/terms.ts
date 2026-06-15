import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  name: z.string().trim().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false)
});

const updateSchema = createSchema.partial();

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const termsRouter = Router();

termsRouter.get("/", async (_req, res) => {
  const data = await prisma.term.findMany({
    orderBy: [{ startDate: "desc" }, { name: "asc" }]
  });

  return res.json({ data });
});

termsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  if (body.endDate < body.startDate) {
    return res.status(400).json({ message: "End date must be after start date" });
  }

  const created = await prisma.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.term.updateMany({ data: { isActive: false } });
    }

    return tx.term.create({
      data: {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        isActive: body.isActive
      }
    });
  });

  return res.status(201).json({ message: "Term added", data: created });
});

termsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  if (body.startDate && body.endDate && body.endDate < body.startDate) {
    return res.status(400).json({ message: "End date must be after start date" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.isActive) {
      await tx.term.updateMany({ data: { isActive: false } });
    }

    return tx.term.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
      }
    });
  });

  return res.json({ message: "Term updated", data: updated });
});
