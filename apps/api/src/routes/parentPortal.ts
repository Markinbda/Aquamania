import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const parentPortalRouter = Router();

async function findParent(userId: string) {
  return prisma.parent.findUnique({ where: { userId }, include: { user: true } });
}

parentPortalRouter.get("/dashboard", async (req: AuthRequest, res) => {
  const parent = await findParent(req.user!.sub);
  if (!parent) return res.status(404).json({ message: "Parent profile not found" });

  const swimmers = await prisma.swimmer.findMany({ where: { parentId: parent.id }, include: { group: true } });
  const payments = await prisma.payment.findMany({ where: { parentId: parent.id, status: { not: "PAID" } } });

  return res.json({
    parent: {
      firstName: parent.user.firstName,
      lastName: parent.user.lastName
    },
    swimmers,
    outstandingPayments: payments
  });
});

parentPortalRouter.get("/swimmers", async (req: AuthRequest, res) => {
  const parent = await findParent(req.user!.sub);
  if (!parent) return res.status(404).json({ message: "Parent profile not found" });

  const data = await prisma.swimmer.findMany({ where: { parentId: parent.id }, include: { group: true } });
  return res.json({ data });
});

parentPortalRouter.get("/schedule", async (req: AuthRequest, res) => {
  const parent = await findParent(req.user!.sub);
  if (!parent) return res.status(404).json({ message: "Parent profile not found" });

  const swimmers = await prisma.swimmer.findMany({ where: { parentId: parent.id }, select: { id: true, groupId: true } });
  const groupIds = [...new Set(swimmers.map((item) => item.groupId).filter(Boolean))] as string[];

  const sessions = await prisma.session.findMany({
    where: { groupId: { in: groupIds }, date: { gte: new Date() } },
    include: { group: true },
    orderBy: { date: "asc" }
  });

  return res.json({ data: sessions });
});

parentPortalRouter.get("/payments", async (req: AuthRequest, res) => {
  const parent = await findParent(req.user!.sub);
  if (!parent) return res.status(404).json({ message: "Parent profile not found" });

  const data = await prisma.payment.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "desc" } });
  return res.json({ data });
});

parentPortalRouter.get("/photos", (_req, res) => {
  return res.json({ data: [] });
});

parentPortalRouter.get("/announcements", (_req, res) => {
  return res.json({ data: [] });
});
