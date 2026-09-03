import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_db.js";
import { requireRole } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";
import { fechaColombiaHoy } from "./_colombia-fechas.js";

function primerDiaDelMes(fechaISO: string) {
  return fechaISO.slice(0, 8) + "01";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,OPTIONS")) return;

  try {
    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "Método no permitido" });
    }

    requireRole(req, ["admin"]);

    const hoy = fechaColombiaHoy();
    const desde = String(req.query.desde ?? "").trim() || primerDiaDelMes(hoy);
    const hasta = String(req.query.hasta ?? "").trim() || hoy;

    // Reparto por funcionario: cuántos casos nuevos, seguimientos y
    // finalizados atendió cada uno en el rango de fechas (por fecha de
    // registro/asignación).
    const porFuncionario = await db().query(
      `
        select
          u.id as funcionario_id,
          u.full_name as funcionario,
          count(*) filter (where a.tipo_caso = 'NUEVO') as nuevos,
          count(*) filter (where a.tipo_caso = 'SEGUIMIENTO') as seguimientos,
          count(*) filter (where a.estado = 'ASIGNADO') as pendientes,
          count(*) filter (where a.estado = 'EN_SEGUIMIENTO') as en_seguimiento,
          count(*) filter (where a.estado = 'FINALIZADO') as finalizados,
          count(*) as total
        from public.atenciones a
        join public.app_users u on u.id = a.asignado_a
        where a.fecha between $1 and $2
        group by u.id, u.full_name
        order by u.full_name asc
      `,
      [desde, hasta]
    );

    // Reparto por asunto (tipo de trámite/consulta) en el mismo rango.
    const porAsunto = await db().query(
      `
        select a.asunto, count(*) as total
        from public.atenciones a
        where a.fecha between $1 and $2
        group by a.asunto
        order by total desc
      `,
      [desde, hasta]
    );

    const totales = await db().query(
      `
        select
          count(*) filter (where a.tipo_caso = 'NUEVO') as nuevos,
          count(*) filter (where a.tipo_caso = 'SEGUIMIENTO') as seguimientos,
          count(*) filter (where a.estado = 'ASIGNADO') as pendientes,
          count(*) filter (where a.estado = 'EN_SEGUIMIENTO') as en_seguimiento,
          count(*) filter (where a.estado = 'FINALIZADO') as finalizados,
          count(*) as total
        from public.atenciones a
        where a.fecha between $1 and $2
      `,
      [desde, hasta]
    );

    return sendJson(res, 200, {
      desde,
      hasta,
      totales: totales.rows[0],
      porFuncionario: porFuncionario.rows,
      porAsunto: porAsunto.rows,
    });
  } catch (e: any) {
    console.error("/api/reportes error:", e);
    const status = e?.statusCode ?? 500;
    return sendJson(res, status, { error: e?.message ?? "Error interno" });
  }
}