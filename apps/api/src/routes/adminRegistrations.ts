import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "WAITLISTED", "REJECTED", "INACTIVE", "ALL"]).optional(),
  search: z.string().trim().optional()
});

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

const approveSchema = z.object({
  groupId: z.string().trim().min(1)
});

const rejectSchema = z.object({
  reason: z.string().trim().min(3)
});

export const adminRegistrationsRouter = Router();

adminRegistrationsRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);

  const where = {
    ...(query.status && query.status !== "ALL" ? { registrationStatus: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" as const } },
            { lastName: { contains: query.search, mode: "insensitive" as const } },
            {
              parent: {
                user: {
                  OR: [
                    { firstName: { contains: query.search, mode: "insensitive" as const } },
                    { lastName: { contains: query.search, mode: "insensitive" as const } },
                    { email: { contains: query.search, mode: "insensitive" as const } }
                  ]
                }
              }
            }
          ]
        }
      : {})
  };

  const swimmers = await prisma.swimmer.findMany({
    where,
    include: {
      parent: {
        include: {
          user: true
        }
      },
      group: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const data = swimmers.map((swimmer) => ({
    id: swimmer.id,
    swimmerName: `${swimmer.firstName} ${swimmer.lastName}`,
    dateOfBirth: swimmer.dateOfBirth,
    status: swimmer.registrationStatus,
    submittedAt: swimmer.createdAt,
    parentName: `${swimmer.parent.user.firstName} ${swimmer.parent.user.lastName}`,
    parentEmail: swimmer.parent.user.email,
    groupName: swimmer.group?.name ?? null
  }));

  return res.json({ data });
});

adminRegistrationsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const swimmer = await prisma.swimmer.findUnique({
    where: { id },
    include: {
      parent: {
        include: {
          user: true
        }
      },
      consentForms: true,
      group: true
    }
  });

  if (!swimmer) {
    return res.status(404).json({ message: "Registration not found" });
  }

  return res.json({
    id: swimmer.id,
    swimmer: {
      firstName: swimmer.firstName,
      lastName: swimmer.lastName,
      dateOfBirth: swimmer.dateOfBirth,
      medicalNotes: swimmer.medicalNotes,
      status: swimmer.registrationStatus,
      groupId: swimmer.groupId,
      groupName: swimmer.group?.name ?? null
    },
    parent: {
      firstName: swimmer.parent.user.firstName,
      lastName: swimmer.parent.user.lastName,
      email: swimmer.parent.user.email,
      phone: swimmer.parent.user.phone,
      address: swimmer.parent.address,
      emergencyName: swimmer.parent.emergencyName,
      emergencyPhone: swimmer.parent.emergencyPhone
    },
    consentForms: swimmer.consentForms.map((form) => ({
      id: form.id,
      formType: form.formType,
      signedAt: form.signedAt,
      signedByName: form.signedByName,
      version: form.version
    }))
  });
});

adminRegistrationsRouter.patch("/:id/approve", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = approveSchema.parse(req.body);

  const group = await prisma.group.findUnique({ where: { id: body.groupId }, select: { id: true } });
  if (!group) {
    return res.status(400).json({ message: "Please choose a valid group" });
  }

  const updated = await prisma.swimmer.update({
    where: { id },
    data: {
      registrationStatus: "APPROVED",
      groupId: body.groupId
    },
    select: {
      id: true,
      registrationStatus: true,
      groupId: true
    }
  });

  return res.json({
    message: "Registration approved",
    data: updated
  });
});

adminRegistrationsRouter.patch("/:id/waitlist", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const updated = await prisma.swimmer.update({
    where: { id },
    data: {
      registrationStatus: "WAITLISTED",
      groupId: null
    },
    select: {
      id: true,
      registrationStatus: true
    }
  });

  return res.json({
    message: "Registration moved to waitlist",
    data: updated
  });
});

adminRegistrationsRouter.patch("/:id/reject", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = rejectSchema.parse(req.body);

  const existing = await prisma.swimmer.findUnique({ where: { id }, select: { medicalNotes: true } });
  if (!existing) {
    return res.status(404).json({ message: "Registration not found" });
  }

  const reason = `\n\n[Admin rejection reason] ${body.reason}`;

  const updated = await prisma.swimmer.update({
    where: { id },
    data: {
      registrationStatus: "REJECTED",
      groupId: null,
      medicalNotes: `${existing.medicalNotes ?? ""}${reason}`.trim()
    },
    select: {
      id: true,
      registrationStatus: true
    }
  });

  return res.json({
    message: "Registration rejected",
    data: updated
  });
});
