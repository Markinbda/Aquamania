import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const idParamSchema = z.object({ id: z.string().trim().min(1) });

const cancelSchema = z.object({
  reason: z.string().trim().min(3)
});

const attendanceItemSchema = z.object({
  swimmerId: z.string().trim().min(1),
  present: z.boolean(),
  notes: z.string().trim().optional()
});

const attendanceSchema = z.union([
  attendanceItemSchema,
  z.object({
    attendance: z.array(attendanceItemSchema)
  })
]);

export const sessionsRouter = Router();

sessionsRouter.get("/", async (req, res) => {
  const groupId = z.string().trim().optional().parse(req.query.groupId);

  const sessions = await prisma.session.findMany({
    where: groupId ? { groupId } : undefined,
    include: {
      group: true,
      attendance: {
        include: {
          swimmer: true
        }
      }
    },
    orderBy: { date: "asc" }
  });

  return res.json({ data: sessions });
});

sessionsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      group: true,
      attendance: {
        include: {
          swimmer: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  return res.json({ data: session });
});

sessionsRouter.patch("/:id/cancel", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = cancelSchema.parse(req.body);

  const updated = await prisma.session.update({
    where: { id },
    data: {
      isCancelled: true,
      cancelReason: body.reason
    }
  });

  return res.json({ message: "Session cancelled", data: updated });
});

sessionsRouter.post("/:id/attendance", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = attendanceSchema.parse(req.body);

  const entries = "attendance" in body ? body.attendance : [body];

  const result = await prisma.$transaction(
    entries.map((entry) =>
      prisma.attendance.upsert({
        where: {
          sessionId_swimmerId: {
            sessionId: id,
            swimmerId: entry.swimmerId
          }
        },
        update: {
          present: entry.present,
          notes: entry.notes
        },
        create: {
          sessionId: id,
          swimmerId: entry.swimmerId,
          present: entry.present,
          notes: entry.notes
        }
      })
    )
  );

  return res.json({ message: "Attendance saved", data: result });
});
