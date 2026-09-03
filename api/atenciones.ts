import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_db.js";
import { requireRole, requireUser, HttpError } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";
import { addBusinessDaysColombia, horaColombiaAhora, fechaColombiaHoy } from "./_colombia-fechas.js";

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIPO_CASO_VALIDOS = ["NUEVO", "SEGUIMIENTO"];
const ESTADOS_VALIDOS = ["ASIGNADO", "EN_SEGUIMIENTO", "FINALIZADO"];
const DIAS_HABILES_RESPUESTA = 15;

const SELECT_FIELDS = `
  a.id,
  a.documento,
  a.tipo_documento,
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
  to_char(a.fecha, 'YYYY-MM-DD') as fecha,
  to_char(a.hora_ingreso, 'HH24:MI') as hora_ingreso,
  to_char(a.hora_atencion, 'HH24:MI') as hora_atencion,
  a.tiempo_espera_horas,
  to_char(a.fecha_respuesta, 'YYYY-MM-DD') as fecha_respuesta,
  a.plazo_ampliado,
  a.tiempo_atencion_acumulado_minutos,
  a.ultima_sesion_fin,
  a.asignado_a,
  u.full_name as asignado_a_nombre,
  a.estado,
  a.saludo,
  a.accion_realizada,
  a.observaciones,
  a.expediente,
  a.fin_atencion,
  a.creado_por,
  a.created_at,
  a.updated_at
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,POST,PATCH,OPTIONS")) return;

  try {
    if (req.method === "GET") {
      const requester = requireUser(req);

      const documento = String(req.query.documento ?? "").trim();
      const bandeja = String(req.query.bandeja ?? "").trim(); // "mias"
      const estado = String(req.query.estado ?? "").trim();

      // Historial por documento (cualquier rol autenticado, para precargar
      // datos de una persona que ya fue atendida antes).
      if (documento) {
        const r = await db().query(
          `
            select ${SELECT_FIELDS}
            from public.atenciones a
            left join public.app_users u on u.id = a.asignado_a
            where a.documento = $1
            order by a.fecha desc, a.created_at desc
          `,
          [documento]
        );

        return sendJson(res, 200, { found: r.rows.length > 0, items: r.rows });
      }

      // Bandeja del funcionario: solo lo que le asignaron a él.
      if (bandeja === "mias" || requester.role === "funcionario") {
        const params: any[] = [requester.id];
        let where = "where a.asignado_a = $1";

        if (estado) {
          params.push(estado);
          where += ` and a.estado = $${params.length}`;
        }

        const r = await db().query(
          `
            select ${SELECT_FIELDS}
            from public.atenciones a
            left join public.app_users u on u.id = a.asignado_a
            ${where}
            order by
              case a.estado when 'ASIGNADO' then 0 when 'EN_SEGUIMIENTO' then 1 else 2 end,
              a.created_at desc
            limit 300
          `,
          params
        );

        return sendJson(res, 200, { items: r.rows });
      }

      // Listado general (admin / secretario)
      const params: any[] = [];
      let where = "";

      if (estado) {
        params.push(estado);
        where += `${where ? " and" : "where"} a.estado = $${params.length}`;
      }

      const asignadoA = String(req.query.asignado_a ?? "").trim();
      if (asignadoA) {
        params.push(asignadoA);
        where += `${where ? " and" : "where"} a.asignado_a = $${params.length}`;
      }

      const r = await db().query(
        `
          select ${SELECT_FIELDS}
          from public.atenciones a
          left join public.app_users u on u.id = a.asignado_a
          ${where}
          order by a.created_at desc
          limit 300
        `,
        params
      );

      return sendJson(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      // Solo el secretario (o el admin) hace el registro inicial + asignación.
      const requester = requireRole(req, ["secretario", "admin"]);

      const body = req.body ?? {};
      const required = [
        "documento",
        "tipo_documento",
        "nombre_completo",
        "nacionalidad",
        "asunto",
        "tipo_caso",
        "hora_ingreso",
        "asignado_a",
      ];

      for (const field of required) {
        if (!body[field]) {
          return sendJson(res, 400, { error: `Campo requerido: ${field}` });
        }
      }

      if (!HORA_REGEX.test(String(body.hora_ingreso))) {
        return sendJson(res, 400, {
          error: "Hora de ingreso inválida. Formato esperado: HH:MM",
        });
      }

      if (!TIPO_CASO_VALIDOS.includes(String(body.tipo_caso))) {
        return sendJson(res, 400, {
          error: `tipo_caso inválido. Valores permitidos: ${TIPO_CASO_VALIDOS.join(", ")}`,
        });
      }

      // Verifica que el funcionario exista y esté activo antes de asignarle el caso
      // (evita romper por una lista de funcionarios desactualizada en el navegador).
      const funcionario = await db().query(
        `select id, role, is_active from public.app_users where id = $1`,
        [String(body.asignado_a)]
      );

      if (!funcionario.rows[0]) {
        return sendJson(res, 400, { error: "El funcionario seleccionado no existe" });
      }

      if (!funcionario.rows[0].is_active) {
        return sendJson(res, 400, {
          error: "El funcionario seleccionado está inactivo. Elige otro o actívalo primero.",
        });
      }

      const fechaHoy = fechaColombiaHoy();
      const [y, m, d] = fechaHoy.split("-").map(Number);
      const fechaRespuesta = addBusinessDaysColombia(new Date(y, m - 1, d), DIAS_HABILES_RESPUESTA);
      const horaAtencionAhora = horaColombiaAhora();

      const r = await db().query(
        `
          insert into public.atenciones (
            documento, tipo_documento, nombre_completo, nacionalidad, edad,
            poblacion, telefono, correo, direccion, barrio_vereda,
            asunto, tipo_caso, hora_ingreso, hora_atencion,
            asignado_a, estado, creado_por, fecha_respuesta, fecha
          ) values (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, 'ASIGNADO', $16, $17, $18
          )
          returning id
        `,
        [
          String(body.documento).trim(),
          String(body.tipo_documento),
          String(body.nombre_completo).toUpperCase(),
          String(body.nacionalidad),
          body.edad ? Number(body.edad) : null,
          body.poblacion ? String(body.poblacion) : null,
          body.telefono ? String(body.telefono) : null,
          body.correo ? String(body.correo) : null,
          body.direccion ? String(body.direccion).toUpperCase() : null,
          body.barrio_vereda ? String(body.barrio_vereda) : null,
          String(body.asunto),
          String(body.tipo_caso),
          String(body.hora_ingreso),
          horaAtencionAhora,
          String(body.asignado_a),
          requester.id,
          fechaRespuesta,
          fechaHoy,
        ]
      );

      const created = await db().query(
        `
          select ${SELECT_FIELDS}
          from public.atenciones a
          left join public.app_users u on u.id = a.asignado_a
          where a.id = $1
        `,
        [r.rows[0].id]
      );

      return sendJson(res, 200, { ok: true, id: r.rows[0].id, item: created.rows[0] });
    }

    if (req.method === "PATCH") {
      // El funcionario asignado (o el admin) actualiza el seguimiento.
      const requester = requireUser(req);
      const body = req.body ?? {};
      const id = String(body.id ?? "").trim();

      if (!id) {
        return sendJson(res, 400, { error: "Campo requerido: id" });
      }

      const current = await db().query(
        `select asignado_a, plazo_ampliado, tiempo_atencion_acumulado_minutos from public.atenciones where id = $1`,
        [id]
      );

      if (!current.rows[0]) {
        return sendJson(res, 404, { error: "Atención no encontrada" });
      }

      const isOwner = current.rows[0].asignado_a === requester.id;

      if (requester.role !== "admin" && !isOwner) {
        throw new HttpError(403, "Solo el funcionario asignado puede actualizar este registro");
      }

      // Acción especial: "Finalizar atención de hoy" — registra cuánto duró
      // esta sesión y la suma al acumulado, sin tocar el estado del caso.
      if (body.finalizar_sesion === true) {
        const sesionInicio = new Date(String(body.sesion_inicio ?? ""));

        if (isNaN(sesionInicio.getTime())) {
          return sendJson(res, 400, { error: "sesion_inicio inválido" });
        }

        const minutosSesion = Math.max(
          0,
          Math.round((Date.now() - sesionInicio.getTime()) / 60000)
        );

        const nuevoAcumulado =
          Number(current.rows[0].tiempo_atencion_acumulado_minutos ?? 0) + minutosSesion;

        await db().query(
          `
            update public.atenciones
            set tiempo_atencion_acumulado_minutos = $1, ultima_sesion_fin = now()
            where id = $2
          `,
          [nuevoAcumulado, id]
        );

        const updatedSesion = await db().query(
          `
            select ${SELECT_FIELDS}
            from public.atenciones a
            left join public.app_users u on u.id = a.asignado_a
            where a.id = $1
          `,
          [id]
        );

        return sendJson(res, 200, {
          ok: true,
          item: updatedSesion.rows[0],
          minutosSesion,
        });
      }

      if (body.estado !== undefined && !ESTADOS_VALIDOS.includes(String(body.estado))) {
        return sendJson(res, 400, {
          error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}`,
        });
      }

      const sets: string[] = [];
      const params: any[] = [];

      const editable = [
        "estado",
        "saludo",
        "accion_realizada",
        "observaciones",
        "expediente",
      ];

      for (const field of editable) {
        if (body[field] !== undefined) {
          params.push(body[field]);
          sets.push(`${field} = $${params.length}`);
        }
      }

      // "Necesito más tiempo": solo la primera vez que se marca (evita que
      // se reinicie el plazo cada vez que se guarda el seguimiento).
      if (body.plazo_ampliado === true && !current.rows[0].plazo_ampliado) {
        const fechaHoy = fechaColombiaHoy();
        const [y, m, d] = fechaHoy.split("-").map(Number);
        const nuevaFechaRespuesta = addBusinessDaysColombia(
          new Date(y, m - 1, d),
          DIAS_HABILES_RESPUESTA
        );

        params.push(true);
        sets.push(`plazo_ampliado = $${params.length}`);
        params.push(nuevaFechaRespuesta);
        sets.push(`fecha_respuesta = $${params.length}`);
      }

      if (body.estado === "FINALIZADO") {
        sets.push(`fin_atencion = now()`);
      }

      if (!sets.length) {
        return sendJson(res, 400, { error: "Nada para actualizar" });
      }

      params.push(id);

      await db().query(
        `update public.atenciones set ${sets.join(", ")} where id = $${params.length}`,
        params
      );

      const updated = await db().query(
        `
          select ${SELECT_FIELDS}
          from public.atenciones a
          left join public.app_users u on u.id = a.asignado_a
          where a.id = $1
        `,
        [id]
      );

      return sendJson(res, 200, { ok: true, item: updated.rows[0] });
    }

    return sendJson(res, 405, { error: "Método no permitido" });
  } catch (e: any) {
    console.error("/api/atenciones error:", e);

    if (e?.code === "23503") {
      return sendJson(res, 400, { error: "Referencia inválida (revisa el funcionario asignado)." });
    }

    if (e?.code === "23514") {
      return sendJson(res, 400, { error: "Alguno de los valores enviados no es válido." });
    }

    const status = e?.statusCode ?? 500;
    return sendJson(res, status, { error: e?.message ?? "Error interno" });
  }
}