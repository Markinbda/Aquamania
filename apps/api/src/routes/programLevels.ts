import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  minAge: z.number().int().nonnegative().nullable().optional(),
  maxAge: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0)
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional()
});

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const programLevelsRouter = Router();

programLevelsRouter.get("/", async (_req, res) => {
  const data = await prisma.programLevel.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  return res.json({ data });
});

programLevelsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);
  const created = await prisma.programLevel.create({
    data: {
      name: body.name,
      description: body.description,
      minAge: body.minAge ?? null,
      maxAge: body.maxAge ?? null,
      sortOrder: body.sortOrder
    }
  });

  return res.status(201).json({ message: "Programme level added", data: created });
});

programLevelsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const updated = await prisma.programLevel.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.minAge !== undefined ? { minAge: body.minAge } : {}),
      ...(body.maxAge !== undefined ? { maxAge: body.maxAge } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
    }
  });

  return res.json({ message: "Programme level updated", data: updated });
});

programLevelsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.programLevel.update({
    where: { id },
    data: { isActive: false }
  });

  return res.json({ message: "Programme level deactivated", data: updated });
});
