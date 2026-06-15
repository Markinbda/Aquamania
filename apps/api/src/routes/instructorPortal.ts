import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const instructorPortalRouter = Router();

function getRouteId(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

async function findInstructor(userId: string) {
  return prisma.instructor.findUnique({ where: { userId } });
}

instructorPortalRouter.get("/dashboard", async (req: AuthRequest, res) => {
  const instructor = await findInstructor(req.user!.sub);
  if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const sessions = await prisma.session.findMany({
    where: {
      group: { instructorId: instructor.id },
      date: { gte: start, lt: end }
    },
    include: { group: true },
    orderBy: { date: "asc" }
  });

  return res.json({ sessions });
});

instructorPortalRouter.get("/schedule", async (req: AuthRequest, res) => {
  const instructor = await findInstructor(req.user!.sub);
  if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

  const groups = await prisma.group.findMany({
    where: { instructorId: instructor.id, isActive: true },
    include: {
      sessions: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 20
      }
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  return res.json({ data: groups });
});

instructorPortalRouter.get("/groups/:id/swimmers", async (req: AuthRequest, res) => {
  const instructor = await findInstructor(req.user!.sub);
  if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

  const groupId = getRouteId(req.params.id);

  const group = await prisma.group.findFirst({
    where: { id: groupId, instructorId: instructor.id },
    include: {
      swimmers: true
    }
  });

  if (!group) return res.status(404).json({ message: "Group not found" });
  return res.json({ data: group.swimmers });
});

instructorPortalRouter.post("/sessions/:id/attendance", async (req: AuthRequest, res) => {
  const instructor = await findInstructor(req.user!.sub);
  if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

  const sessionId = getRouteId(req.params.id);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { group: true }
  });

  if (!session || session.group.instructorId !== instructor.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const attendance = Array.isArray(req.body?.attendance) ? req.body.attendance : [];

  await prisma.$transaction(
    attendance.map((item: any) =>
      prisma.attendance.upsert({
        where: {
          sessionId_swimmerId: {
            sessionId,
            swimmerId: item.swimmerId
          }
        },
        update: {
          present: Boolean(item.present),
          notes: typeof item.notes === "string" ? item.notes : undefined
        },
        create: {
          sessionId,
          swimmerId: item.swimmerId,
          present: Boolean(item.present),
          notes: typeof item.notes === "string" ? item.notes : undefined
        }
      })
    )
  );

  return res.json({ message: "Attendance saved" });
});
