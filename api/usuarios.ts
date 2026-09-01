import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { db } from "./_db.js";
import { requireRole, requireUser, HttpError } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,POST,PATCH,OPTIONS")) return;

  try {
    if (req.method === "GET") {
      const requester = requireUser(req);
      const roleFilter = String(req.query.role ?? "").trim();

      // El secretario (y el funcionario) solo pueden pedir la lista de
      // funcionarios activos, para armar el combo de "Asignar a".
      if (requester.role !== "admin") {
        if (roleFilter !== "funcionario") {
          throw new HttpError(403, "No tiene permisos para esta acción");
        }
      }

      const params: any[] = [];
      const conditions: string[] = [];

      // El admin puede ver también usuarios inactivos (para reactivarlos).
      if (requester.role !== "admin") {
        conditions.push("is_active = true");
      }

      if (roleFilter) {
        params.push(roleFilter);
        conditions.push(`role = $${params.length}`);
      }

      const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

      const r = await db().query(
        `
          select id, username, full_name, role, is_active, created_at
          from public.app_users
          ${where}
          order by full_name asc
        `,
        params
      );

      return sendJson(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      requireRole(req, ["admin"]);

      const body = req.body ?? {};
      const username = String(body.username ?? "").trim();
      const password = String(body.password ?? "");
      const fullName = String(body.full_name ?? "").trim();
      const role = String(body.role ?? "").trim();

      if (!username || !password || !fullName || !role) {
        return sendJson(res, 400, {
          error: "Campos requeridos: username, password, full_name, role",
        });
      }

      if (!["admin", "secretario", "funcionario"].includes(role)) {
        return sendJson(res, 400, { error: "Rol inválido" });
      }

      if (password.length < 6) {
        return sendJson(res, 400, { error: "La contraseña debe tener al menos 6 caracteres" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const r = await db().query(
        `
          insert into public.app_users (username, password_hash, full_name, role)
          values ($1, $2, $3, $4)
          returning id, username, full_name, role, is_active, created_at
        `,
        [username, passwordHash, fullName, role]
      );

      return sendJson(res, 200, { ok: true, item: r.rows[0] });
    }

    if (req.method === "PATCH") {
      requireRole(req, ["admin"]);

      const body = req.body ?? {};
      const id = String(body.id ?? "").trim();

      if (!id) {
        return sendJson(res, 400, { error: "Campo requerido: id" });
      }

      const sets: string[] = [];
      const params: any[] = [];

      if (typeof body.is_active === "boolean") {
        params.push(body.is_active);
        sets.push(`is_active = $${params.length}`);
      }

      if (body.password) {
        if (String(body.password).length < 6) {
          return sendJson(res, 400, { error: "La contraseña debe tener al menos 6 caracteres" });
        }
        const passwordHash = await bcrypt.hash(String(body.password), 10);
        params.push(passwordHash);
        sets.push(`password_hash = $${params.length}`);
      }

      if (body.full_name) {
        params.push(String(body.full_name));
        sets.push(`full_name = $${params.length}`);
      }

      if (!sets.length) {
        return sendJson(res, 400, { error: "Nada para actualizar" });
      }

      params.push(id);

      const r = await db().query(
        `
          update public.app_users
          set ${sets.join(", ")}
          where id = $${params.length}
          returning id, username, full_name, role, is_active, created_at
        `,
        params
      );

      if (!r.rows[0]) {
        return sendJson(res, 404, { error: "Usuario no encontrado" });
      }

      return sendJson(res, 200, { ok: true, item: r.rows[0] });
    }

    return sendJson(res, 405, { error: "Método no permitido" });
  } catch (e: any) {
    console.error("/api/usuarios error:", e);

    if (e?.code === "23505") {
      return sendJson(res, 409, { error: "Ese nombre de usuario ya existe. Elige otro." });
    }

    const status = e?.statusCode ?? 500;
    return sendJson(res, status, { error: e?.message ?? "Error interno" });
  }
}
