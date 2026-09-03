import { authHeaders, parseResponse } from "./http";

export type Seguimiento = {
  id: string;
  atencion_id: string;
  fecha: string;
  hora: string;
  sintesis_caso: string | null;
  pregunta_problema: string | null;
  metodologia: string | null;
  accion_realizada: string | null;
  observaciones: string | null;
  funcionario_id: string | null;
  funcionario_nombre: string | null;
  created_at: string;
};

export async function listarSeguimientos(atencionId: string): Promise<{ items: Seguimiento[] }> {
  const res = await fetch(`/api/seguimientos?atencion_id=${encodeURIComponent(atencionId)}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

export async function agregarSeguimiento(
  atencionId: string,
  datos: {
    sintesis_caso?: string;
    pregunta_problema?: string;
    metodologia?: string;
    accion_realizada?: string;
    observaciones?: string;
  }
): Promise<{ ok: true; id: string }> {
  const res = await fetch("/api/seguimientos", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ atencion_id: atencionId, ...datos }),
  });
  return parseResponse(res);
}