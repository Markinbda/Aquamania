import bcrypt from "bcrypt";
import { ConsentFormType } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { buildSignedConsentRecords, hasAllRequiredConsents } from "../services/consentLogic.js";

const isProduction = env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: 900000
};

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const consentTypeEnum = z.enum(["WATER_SAFETY", "PHOTO_CONSENT", "MEDICAL_CONSENT", "GENERAL"]);

const registerSchema = z.object({
  account: z.object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(8),
    phone: z.string().trim().min(7).optional()
  }),
  parentProfile: z.object({
    address: z.string().trim().optional(),
    emergencyName: z.string().trim().optional(),
    emergencyPhone: z.string().trim().optional()
  }),
  swimmer: z.object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    dateOfBirth: z.coerce.date(),
    medicalNotes: z.string().trim().optional()
  }),
  consent: z.object({
    signedByName: z.string().trim().min(2),
    formTypes: z.array(consentTypeEnum).min(4),
    signatureAccepted: z.literal(true)
  })
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const payload = registerSchema.parse(req.body);

  if (!hasAllRequiredConsents(payload.consent.formTypes)) {
    return res.status(400).json({ message: "All required consent forms must be accepted" });
  }

  const existing = await prisma.user.findUnique({
    where: { email: payload.account.email.toLowerCase() },
    select: { id: true }
  });

  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(payload.account.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: payload.account.email.toLowerCase(),
        passwordHash,
        role: "PARENT",
        firstName: payload.account.firstName,
        lastName: payload.account.lastName,
        phone: payload.account.phone
      }
    });

    const parent = await tx.parent.create({
      data: {
        userId: user.id,
        address: payload.parentProfile.address,
        emergencyName: payload.parentProfile.emergencyName,
        emergencyPhone: payload.parentProfile.emergencyPhone
      }
    });

    const swimmer = await tx.swimmer.create({
      data: {
        parentId: parent.id,
        firstName: payload.swimmer.firstName,
        lastName: payload.swimmer.lastName,
        dateOfBirth: payload.swimmer.dateOfBirth,
        medicalNotes: payload.swimmer.medicalNotes,
        registrationStatus: "PENDING"
      }
    });

    await tx.consentForm.createMany({
      data: buildSignedConsentRecords(payload.consent.signedByName, req.ip ?? null, payload.consent.formTypes).map(
        (record) => ({
          swimmerId: swimmer.id,
          formType: record.formType as ConsentFormType,
          signedAt: record.signedAt,
          signedByName: record.signedByName,
          ipAddress: record.ipAddress,
          version: record.version
        })
      )
    });

    return {
      userId: user.id,
      swimmerId: swimmer.id
    };
  });

  return res.status(201).json({
    message: "Registration submitted and pending review",
    registrationStatus: "PENDING",
    ...created
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(204).send();
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    return res.status(401).json({ message: "Not signed in" });
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });

  if (!user) {
    return res.status(401).json({ message: "Account not found" });
  }

  return res.json({ user });
});
