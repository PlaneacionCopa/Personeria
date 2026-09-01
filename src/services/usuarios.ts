import type { Rol, Usuario } from "../types/atencion";
import { authHeaders, parseResponse } from "./http";

export async function listarUsuarios(role?: Rol): Promise<{ items: Usuario[] }> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await fetch(`/api/usuarios${qs}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

export async function crearUsuario(payload: {
  username: string;
  password: string;
  full_name: string;
  role: Rol;
}): Promise<{ ok: true; item: Usuario }> {
  const res = await fetch("/api/usuarios", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function actualizarUsuario(
  id: string,
  cambios: { is_active?: boolean; password?: string; full_name?: string }
): Promise<{ ok: true; item: Usuario }> {
  const res = await fetch("/api/usuarios", {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify({ id, ...cambios }),
  });
  return parseResponse(res);
}
