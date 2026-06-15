import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type AuthPayload = {
  sub: string;
  role: "ADMIN" | "INSTRUCTOR" | "PARENT";
};

export type AuthRequest = Request & {
  user?: AuthPayload;
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ message: "You must sign in first" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

export function requireRole(roles: AuthPayload["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this area" });
    }

    return next();
  };
}
