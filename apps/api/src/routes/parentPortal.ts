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

parentPortalRouter.get("/photos", async (req: AuthRequest, res) => {
  const parent = await findParent(req.user!.sub);
  if (!parent) return res.status(404).json({ message: "Parent profile not found" });

  const filterGroupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
  const filterSwimmerId = typeof req.query.swimmerId === "string" ? req.query.swimmerId : undefined;

  const swimmers = await prisma.swimmer.findMany({
    where: { parentId: parent.id },
    select: { id: true, firstName: true, lastName: true, groupId: true }
  });

  const swimmerIds = swimmers.map((item) => item.id);
  const groupIds = [...new Set(swimmers.map((item) => item.groupId).filter(Boolean))] as string[];

  if (filterSwimmerId && !swimmerIds.includes(filterSwimmerId)) {
    return res.status(403).json({ message: "You can only filter by your own swimmers" });
  }

  if (filterGroupId && !groupIds.includes(filterGroupId)) {
    return res.status(403).json({ message: "You can only filter by your swimmers' groups" });
  }

  const data = await prisma.photo.findMany({
    where: {
      groupId: { in: groupIds },
      ...(filterGroupId ? { groupId: filterGroupId } : {}),
      ...(filterSwimmerId
        ? { tags: { some: { swimmerId: filterSwimmerId } } }
        : {})
    },
    include: {
      group: { select: { id: true, name: true } },
      tags: {
        where: { swimmerId: { in: swimmerIds } },
        include: {
          swimmer: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const visibleGroups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true }
  });

  return res.json({
    data,
    filters: {
      groups: visibleGroups,
      swimmers: swimmers.map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        groupId: item.groupId
      }))
    }
  });
});

parentPortalRouter.get("/announcements", (_req, res) => {
  return res.json({ data: [] });
});
