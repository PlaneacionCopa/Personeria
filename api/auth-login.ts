import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { db } from "./_db.js";
import { signToken } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "POST,OPTIONS")) return;

  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Método no permitido" });
    }

    const { username, password } = req.body || {};

    if (!username || !password) {
      return sendJson(res, 400, { error: "Ingrese usuario y contraseña" });
    }

    const r = await db().query(
      `
        select id, username, full_name, role, password_hash, is_active
        from public.app_users
        where username = $1
      `,
      [String(username).trim()]
    );

    const u = r.rows[0];

    if (!u || !u.is_active) {
      return sendJson(res, 401, { error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(String(password), String(u.password_hash));

    if (!ok) {
      return sendJson(res, 401, { error: "Credenciales inválidas" });
    }

    const token = signToken({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
    });

    return sendJson(res, 200, {
      ok: true,
      token,
      user: {
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
      },
    });
  } catch (e: any) {
    console.error("POST /api/auth-login error:", e);
    return sendJson(res, 500, { error: e?.message ?? "Error interno" });
  }
}
