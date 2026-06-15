import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).default("Instructor2026!"),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  photoUrl: z.string().trim().url().optional(),
  qualifications: z.string().trim().optional(),
  certifications: z.string().trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: z.string().trim().optional(),
  emergencyName: z.string().trim().optional(),
  emergencyPhone: z.string().trim().optional(),
  employmentType: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const updateSchema = createSchema.partial().omit({ email: true, password: true }).extend({
  email: z.string().trim().email().optional(),
  resetPassword: z.string().min(8).optional()
});

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const instructorsRouter = Router();

instructorsRouter.get("/", async (_req, res) => {
  const data = await prisma.instructor.findMany({
    include: {
      user: true,
      groups: {
        select: {
          id: true,
          name: true,
          dayOfWeek: true,
          startTime: true
        }
      }
    },
    orderBy: {
      user: {
        firstName: "asc"
      }
    }
  });

  return res.json({
    data: data.map((item) => ({
      id: item.id,
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      email: item.user.email,
      phone: item.phone ?? item.user.phone,
      employmentType: item.employmentType,
      qualifications: item.qualifications,
      certifications: item.certifications,
      photoUrl: item.photoUrl,
      notes: item.notes,
      groups: item.groups
    }))
  });
});

instructorsRouter.get("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      user: true,
      groups: true
    }
  });

  if (!instructor) {
    return res.status(404).json({ message: "Instructor not found" });
  }

  return res.json({
    id: instructor.id,
    user: {
      firstName: instructor.user.firstName,
      lastName: instructor.user.lastName,
      email: instructor.user.email,
      phone: instructor.user.phone
    },
    profile: {
      bio: instructor.bio,
      photoUrl: instructor.photoUrl,
      qualifications: instructor.qualifications,
      certifications: instructor.certifications,
      dateOfBirth: instructor.dateOfBirth,
      address: instructor.address,
      phone: instructor.phone,
      emergencyName: instructor.emergencyName,
      emergencyPhone: instructor.emergencyPhone,
      employmentType: instructor.employmentType,
      notes: instructor.notes
    },
    groups: instructor.groups
  });
});

instructorsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() }, select: { id: true } });
  if (existing) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        role: "INSTRUCTOR",
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone
      }
    });

    return tx.instructor.create({
      data: {
        userId: user.id,
        bio: body.bio,
        photoUrl: body.photoUrl,
        qualifications: body.qualifications,
        certifications: body.certifications,
        dateOfBirth: body.dateOfBirth,
        address: body.address,
        phone: body.phone,
        emergencyName: body.emergencyName,
        emergencyPhone: body.emergencyPhone,
        employmentType: body.employmentType,
        notes: body.notes
      },
      include: {
        user: true
      }
    });
  });

  return res.status(201).json({
    message: "Instructor added",
    data: {
      id: created.id,
      firstName: created.user.firstName,
      lastName: created.user.lastName,
      email: created.user.email
    }
  });
});

instructorsRouter.put("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);

  const existing = await prisma.instructor.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!existing) {
    return res.status(404).json({ message: "Instructor not found" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: existing.userId },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.email !== undefined ? { email: body.email.toLowerCase() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.resetPassword ? { passwordHash: await bcrypt.hash(body.resetPassword, 10) } : {})
      }
    });

    const profile = await tx.instructor.update({
      where: { id },
      data: {
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
        ...(body.qualifications !== undefined ? { qualifications: body.qualifications } : {}),
        ...(body.certifications !== undefined ? { certifications: body.certifications } : {}),
        ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.emergencyName !== undefined ? { emergencyName: body.emergencyName } : {}),
        ...(body.emergencyPhone !== undefined ? { emergencyPhone: body.emergencyPhone } : {}),
        ...(body.employmentType !== undefined ? { employmentType: body.employmentType } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {})
      }
    });

    return { user, profile };
  });

  return res.json({
    message: "Instructor updated",
    data: {
      id,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      email: updated.user.email,
      employmentType: updated.profile.employmentType
    }
  });
});

instructorsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const existing = await prisma.instructor.findUnique({ where: { id }, include: { user: true } });
  if (!existing) {
    return res.status(404).json({ message: "Instructor not found" });
  }

  const deactivated = await prisma.instructor.update({
    where: { id },
    data: {
      employmentType: "Inactive",
      notes: `${existing.notes ?? ""}${existing.notes ? "\n" : ""}[Deactivated ${new Date().toISOString()}]`.trim()
    }
  });

  return res.json({
    message: "Instructor deactivated",
    data: {
      id: deactivated.id,
      employmentType: deactivated.employmentType
    }
  });
});
