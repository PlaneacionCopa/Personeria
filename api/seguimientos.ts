import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_db.js";
import { requireUser, HttpError } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";
import { addBusinessDaysColombia, fechaColombiaHoy, horaColombiaAhora } from "./_colombia-fechas.js";

const DIAS_HABILES_RESPUESTA = 15;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,POST,OPTIONS")) return;

  try {
    const requester = requireUser(req);

    if (req.method === "GET") {
      const atencionId = String(req.query.atencion_id ?? "").trim();

      if (!atencionId) {
        return sendJson(res, 400, { error: "Falta atencion_id" });
      }

      const caso = await db().query(`select id from public.atenciones where id = $1`, [
        atencionId,
      ]);

      if (!caso.rows[0]) {
        return sendJson(res, 404, { error: "Caso no encontrado" });
      }

      const r = await db().query(
        `
          select
            s.id, s.atencion_id,
            to_char(s.fecha, 'YYYY-MM-DD') as fecha,
            to_char(s.hora, 'HH24:MI') as hora,
            s.sintesis_caso, s.pregunta_problema, s.metodologia,
            s.accion_realizada, s.observaciones,
            s.funcionario_id, u.full_name as funcionario_nombre,
            s.created_at
          from public.seguimientos s
          left join public.app_users u on u.id = s.funcionario_id
          where s.atencion_id = $1
          order by s.fecha asc, s.hora asc, s.created_at asc
        `,
        [atencionId]
      );

      return sendJson(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      // Cualquier usuario autenticado (secretario, admin, o CUALQUIER
      // funcionario, no solo el asignado) puede agregar una visita al hilo
      // — así otro puede tomar el caso si el titular no está.
      const body = req.body ?? {};
      const atencionId = String(body.atencion_id ?? "").trim();

      if (!atencionId) {
        return sendJson(res, 400, { error: "Falta atencion_id" });
      }

      const caso = await db().query(
        `select id, estado, fecha_respuesta from public.atenciones where id = $1`,
        [atencionId]
      );

      if (!caso.rows[0]) {
        return sendJson(res, 404, { error: "Caso no encontrado" });
      }

      const tieneContenido =
        body.sintesis_caso?.trim() &&
        body.pregunta_problema?.trim() &&
        body.metodologia?.trim() &&
        body.accion_realizada?.trim();

      if (!tieneContenido) {
        return sendJson(res, 400, {
          error: "Síntesis, Pregunta/problema, Metodología y Acción realizada son obligatorios.",
        });
      }

      const fechaHoy = fechaColombiaHoy();
      const horaAhora = horaColombiaAhora();

      const r = await db().query(
        `
          insert into public.seguimientos (
            atencion_id, funcionario_id, fecha, hora,
            sintesis_caso, pregunta_problema, metodologia, accion_realizada, observaciones
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          returning id
        `,
        [
          atencionId,
          requester.role === "funcionario" ? requester.id : null,
          fechaHoy,
          horaAhora,
          body.sintesis_caso ? String(body.sintesis_caso) : null,
          body.pregunta_problema ? String(body.pregunta_problema) : null,
          body.metodologia ? String(body.metodologia) : null,
          body.accion_realizada ? String(body.accion_realizada) : null,
          body.observaciones ? String(body.observaciones) : null,
        ]
      );

      // Si es la primera visita del hilo y el caso sigue "Asignado", lo pasa
      // a "En seguimiento" y arranca el plazo legal de respuesta.
      if (caso.rows[0].estado === "ASIGNADO") {
        const sets = [`estado = 'EN_SEGUIMIENTO'`];
        const params: any[] = [];

        if (!caso.rows[0].fecha_respuesta) {
          const [y, m, d] = fechaHoy.split("-").map(Number);
          const fechaRespuesta = addBusinessDaysColombia(
            new Date(y, m - 1, d),
            DIAS_HABILES_RESPUESTA
          );
          params.push(fechaRespuesta);
          sets.push(`fecha_respuesta = $${params.length}`);
        }

        params.push(atencionId);
        await db().query(
          `update public.atenciones set ${sets.join(", ")} where id = $${params.length}`,
          params
        );
      }

      return sendJson(res, 200, { ok: true, id: r.rows[0].id });
    }

    return sendJson(res, 405, { error: "Método no permitido" });
  } catch (e: any) {
    console.error("/api/seguimientos error:", e);
    const status = e?.statusCode ?? 500;
    return sendJson(res, status, { error: e?.message ?? "Error interno" });
  }
}