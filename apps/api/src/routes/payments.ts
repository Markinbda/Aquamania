import { Router } from "express";
import { z } from "zod";
import { computePaymentStatus } from "../services/paymentStatus.js";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  parentId: z.string().trim().min(1),
  termId: z.string().trim().optional(),
  description: z.string().trim().min(3),
  amountDue: z.number().positive(),
  dueDate: z.coerce.date().optional()
});

const bulkSchema = z.object({
  groupId: z.string().trim().min(1),
  termId: z.string().trim().optional(),
  description: z.string().trim().min(3),
  amountDue: z.number().positive(),
  dueDate: z.coerce.date().optional()
});

const updateSchema = createSchema.partial().extend({
  amountPaid: z.number().nonnegative().optional(),
  status: z.enum(["OUTSTANDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]).optional(),
  bankReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  paidDate: z.coerce.date().optional()
});

const recordSchema = z.object({
  amountPaid: z.number().nonnegative(),
  paidDate: z.coerce.date(),
  bankReference: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const paymentsRouter = Router();

paymentsRouter.get("/", async (_req, res) => {
  const data = await prisma.payment.findMany({
    include: {
      parent: { include: { user: true } },
      term: true
    },
    orderBy: { createdAt: "desc" }
  });

  const summary = {
    totalOutstanding: data.filter((p) => p.status === "OUTSTANDING" || p.status === "PARTIAL" || p.status === "OVERDUE").reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0),
    totalPaid: data.reduce((sum, p) => sum + p.amountPaid, 0),
    overdueCount: data.filter((p) => p.status === "OVERDUE").length
  };

  return res.json({ data, summary });
});

paymentsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  const status = computePaymentStatus({
    amountDue: body.amountDue,
    amountPaid: 0,
    dueDate: body.dueDate,
    explicitStatus: undefined
  });

  const created = await prisma.payment.create({
    data: {
      parentId: body.parentId,
      termId: body.termId,
      description: body.description,
      amountDue: body.amountDue,
      dueDate: body.dueDate,
      status
    }
  });

  return res.status(201).json({ message: "Payment created", data: created });
});

paymentsRouter.post("/bulk", async (req, res) => {
  const body = bulkSchema.parse(req.body);

  const swimmers = await prisma.swimmer.findMany({ where: { groupId: body.groupId }, select: { parentId: true } });
  const parentIds = Array.from(new Set(swimmers.map((item) => item.parentId)));

  if (parentIds.length === 0) {
    return res.status(400).json({ message: "No swimmers found in the selected group" });
  }

  const status = computePaymentStatus({ amountDue: body.amountDue, amountPaid: 0, dueDate: body.dueDate, explicitStatus: undefined });

  await prisma.payment.createMany({
    data: parentIds.map((parentId) => ({
      parentId,
      termId: body.termId,
      description: body.description,
      amountDue: body.amountDue,
      dueDate: body.dueDate,
      status
    }))
  });

  return res.status(201).json({ message: `Created ${parentIds.length} payments` });
});

paymentsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const payment = await prisma.payment.findUnique({ where: { id }, include: { parent: { include: { user: true } }, term: true } });
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  return res.json({ data: payment });
});

paymentsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Payment not found" });
  }

  const amountDue = body.amountDue ?? existing.amountDue;
  const amountPaid = body.amountPaid ?? existing.amountPaid;
  const dueDate = body.dueDate ?? existing.dueDate ?? undefined;

  const nextStatus = computePaymentStatus({
    amountDue,
    amountPaid,
    dueDate,
    explicitStatus: body.status
  });

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      ...(body.termId !== undefined ? { termId: body.termId } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.amountDue !== undefined ? { amountDue: body.amountDue } : {}),
      ...(body.amountPaid !== undefined ? { amountPaid: body.amountPaid } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.bankReference !== undefined ? { bankReference: body.bankReference } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.paidDate !== undefined ? { paidDate: body.paidDate } : {}),
      status: nextStatus
    }
  });

  return res.json({ message: "Payment updated", data: updated });
});

paymentsRouter.post("/:id/record", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = recordSchema.parse(req.body);

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Payment not found" });
  }

  const nextAmountPaid = existing.amountPaid + body.amountPaid;
  const nextStatus = computePaymentStatus({
    amountDue: existing.amountDue,
    amountPaid: nextAmountPaid,
    dueDate: existing.dueDate ?? undefined,
    explicitStatus: undefined
  });

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      amountPaid: nextAmountPaid,
      paidDate: body.paidDate,
      bankReference: body.bankReference,
      notes: body.notes,
      status: nextStatus
    }
  });

  return res.json({ message: "Payment recorded", data: updated });
});

paymentsRouter.post("/:id/remind", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { parent: { include: { user: true } } }
  });

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  return res.json({
    message: `Reminder queued for ${payment.parent.user.email}`
  });
});
