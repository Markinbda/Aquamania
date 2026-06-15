import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  name: z.string().trim().min(2),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional()
});

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const poolLocationsRouter = Router();

poolLocationsRouter.get("/", async (_req, res) => {
  const data = await prisma.poolLocation.findMany({
    orderBy: { name: "asc" }
  });
  return res.json({ data });
});

poolLocationsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  const created = await prisma.poolLocation.create({
    data: {
      name: body.name,
      address: body.address,
      notes: body.notes
    }
  });

  return res.status(201).json({ message: "Pool location added", data: created });
});

poolLocationsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const updated = await prisma.poolLocation.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
    }
  });

  return res.json({ message: "Pool location updated", data: updated });
});

poolLocationsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.poolLocation.update({
    where: { id },
    data: { isActive: false }
  });

  return res.json({ message: "Pool location deactivated", data: updated });
});
