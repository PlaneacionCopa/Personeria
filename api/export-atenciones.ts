import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as XLSX from "xlsx";
import { db } from "./_db.js";
import { requireRole } from "./_auth.js";
import { allowCors } from "./_http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,OPTIONS")) return;

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    requireRole(req, ["admin"]);

    const result = await db().query(`
      select
        a.documento,
        a.tipo_documento,
        to_char(a.fecha, 'DD/MM/YYYY') as fecha,
        a.nombre_completo,
        a.nacionalidad,
        a.edad,
        a.poblacion,
        a.telefono,
        a.correo,
        a.direccion,
        a.barrio_vereda,
        a.asunto,
        a.tipo_caso,
        to_char(a.hora_ingreso, 'HH24:MI') as hora_ingreso,
        to_char(a.hora_atencion, 'HH24:MI') as hora_atencion,
        a.tiempo_espera_minutos,
        u.full_name as asignado_a,
        a.estado,
        a.saludo,
        a.accion_realizada,
        a.observaciones,
        a.expediente,
        a.fin_atencion,
        a.created_at,
        a.updated_at
      from public.atenciones a
      left join public.app_users u on u.id = a.asignado_a
      order by a.fecha desc, a.created_at desc
    `);

    const rows = result.rows.map((row) => ({
      Documento: row.documento,
      "Tipo documento": row.tipo_documento,
      Fecha: row.fecha,
      "Nombre completo": row.nombre_completo,
      Nacionalidad: row.nacionalidad,
      Edad: row.edad,
      Población: row.poblacion,
      Teléfono: row.telefono,
      "Correo electrónico": row.correo,
      Dirección: row.direccion,
      "Barrio / Vereda": row.barrio_vereda,
      Asunto: row.asunto,
      "Nuevo / Seguimiento": row.tipo_caso,
      "Hora de ingreso": row.hora_ingreso,
      "Hora de atención": row.hora_atencion,
      "Tiempo de espera (min)": row.tiempo_espera_minutos,
      "Atendido por": row.asignado_a,
      Estado: row.estado,
      Saludo: row.saludo,
      "Acción realizada": row.accion_realizada,
      Observaciones: row.observaciones,
      Expediente: row.expediente,
      "Fin de atención": row.fin_atencion,
      "Creado en": row.created_at,
      "Actualizado en": row.updated_at,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Atenciones");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="atenciones.xlsx"');

    return res.status(200).send(buffer);
  } catch (e: any) {
    const status = e?.statusCode ?? 500;
    console.error("/api/export-atenciones error:", e);
    return res.status(status).json({ error: e?.message ?? "Error interno" });
  }
}
