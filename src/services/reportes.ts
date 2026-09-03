import { authHeaders, parseResponse } from "./http";

export type ReporteFuncionario = {
  funcionario_id: string;
  funcionario: string;
  nuevos: number;
  seguimientos: number;
  pendientes: number;
  en_seguimiento: number;
  finalizados: number;
  total: number;
};

export type ReporteAsunto = {
  asunto: string;
  total: number;
};

export type ReporteTotales = {
  nuevos: number;
  seguimientos: number;
  pendientes: number;
  en_seguimiento: number;
  finalizados: number;
  total: number;
};

export type Reporte = {
  desde: string;
  hasta: string;
  totales: ReporteTotales;
  porFuncionario: ReporteFuncionario[];
  porAsunto: ReporteAsunto[];
};

export async function getReporte(desde?: string, hasta?: string): Promise<Reporte> {
  const qs = new URLSearchParams();
  if (desde) qs.set("desde", desde);
  if (hasta) qs.set("hasta", hasta);

  const res = await fetch(`/api/reportes?${qs.toString()}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}