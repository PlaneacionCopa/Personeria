import type { Atencion, Estado, NuevaAtencionInput, Tipificaciones } from "../types/atencion";
import { authHeaders, parseResponse } from "./http";

export async function getTipificaciones(): Promise<Tipificaciones> {
  const res = await fetch("/api/tipificaciones", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return parseResponse<Tipificaciones>(res);
}

export async function searchByDocumento(
  documento: string
): Promise<{ found: boolean; items: Atencion[] }> {
  const res = await fetch(`/api/atenciones?documento=${encodeURIComponent(documento)}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

export async function crearAtencion(
  payload: NuevaAtencionInput
): Promise<{ ok: true; id: string; item: Atencion }> {
  const res = await fetch("/api/atenciones", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function misAtenciones(estado?: Estado): Promise<{ items: Atencion[] }> {
  const qs = new URLSearchParams({ bandeja: "mias" });
  if (estado) qs.set("estado", estado);

  const res = await fetch(`/api/atenciones?${qs.toString()}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

export async function listarAtenciones(filtros?: {
  estado?: Estado;
  asignado_a?: string;
}): Promise<{ items: Atencion[] }> {
  const qs = new URLSearchParams();
  if (filtros?.estado) qs.set("estado", filtros.estado);
  if (filtros?.asignado_a) qs.set("asignado_a", filtros.asignado_a);

  const res = await fetch(`/api/atenciones?${qs.toString()}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

export async function actualizarSeguimiento(
  id: string,
  cambios: Partial<
    Pick<Atencion, "estado" | "saludo" | "accion_realizada" | "observaciones" | "expediente">
  >
): Promise<{ ok: true; item: Atencion }> {
  const res = await fetch("/api/atenciones", {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify({ id, ...cambios }),
  });
  return parseResponse(res);
}
