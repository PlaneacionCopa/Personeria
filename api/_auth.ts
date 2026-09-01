import jwt from "jsonwebtoken";
import type { VercelRequest } from "@vercel/node";

export type Role = "admin" | "secretario" | "funcionario";

export type AuthUser = {
  id: string;
  username: string;
  full_name: string;
  role: Role;
};

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET");
  return jwt.sign(user, secret, { expiresIn: "12h" });
}

export function requireUser(req: VercelRequest): AuthUser {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET");

  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (!token) throw new HttpError(401, "No autorizado");

  try {
    return jwt.verify(token, secret) as AuthUser;
  } catch {
    throw new HttpError(401, "Sesión inválida o expirada");
  }
}

export function requireRole(req: VercelRequest, roles: Role[]): AuthUser {
  const user = requireUser(req);
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "No tiene permisos para esta acción");
  }
  return user;
}
