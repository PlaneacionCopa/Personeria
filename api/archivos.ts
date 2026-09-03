import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { db } from "./_db.js";
import { requireUser, HttpError } from "./_auth.js";
import { allowCors, sendJson } from "./_http.js";
import {
  subirArchivoStorage,
  urlFirmadaDescarga,
  validarTamanoArchivo,
} from "./_storage.js";

async function verificarAcceso(atencionId: string, userId: string, role: string) {
  const r = await db().query(
    `select asignado_a, creado_por from public.atenciones where id = $1`,
    [atencionId]
  );

  if (!r.rows[0]) {
    throw new HttpError(404, "Atención no encontrada");
  }

  const { asignado_a, creado_por } = r.rows[0];

  const tieneAcceso =
    role === "admin" ||
    role === "secretario" || // el secretario ve/adjunta en cualquier caso que gestione
    asignado_a === userId ||
    creado_por === userId;

  if (!tieneAcceso) {
    throw new HttpError(403, "No tiene acceso a esta atención");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,POST,DELETE,OPTIONS")) return;

  try {
    const requester = requireUser(req);

    if (req.method === "GET") {
      const atencionId = String(req.query.atencion_id ?? "").trim();
      const descargarId = String(req.query.descargar_id ?? "").trim();

      // Pedir el link de descarga de UN archivo puntual.
      if (descargarId) {
        const r = await db().query(
          `select id, atencion_id, storage_path, nombre_original from public.archivos where id = $1`,
          [descargarId]
        );

        if (!r.rows[0]) {
          return sendJson(res, 404, { error: "Archivo no encontrado" });
        }

        await verificarAcceso(r.rows[0].atencion_id, requester.id, requester.role);

        const url = await urlFirmadaDescarga(r.rows[0].storage_path);
        return sendJson(res, 200, { url, nombre: r.rows[0].nombre_original });
      }

      if (!atencionId) {
        return sendJson(res, 400, { error: "Falta atencion_id" });
      }

      await verificarAcceso(atencionId, requester.id, requester.role);

      const r = await db().query(
        `
          select a.id, a.nombre_original, a.descripcion, a.tipo_mime, a.tamano_bytes,
                 a.created_at, u.full_name as subido_por_nombre
          from public.archivos a
          left join public.app_users u on u.id = a.subido_por
          where a.atencion_id = $1
          order by a.created_at desc
        `,
        [atencionId]
      );

      return sendJson(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      const body = req.body ?? {};
      const atencionId = String(body.atencion_id ?? "").trim();
      const nombreOriginal = String(body.nombre_original ?? "").trim();
      const tipoMime = String(body.tipo_mime ?? "application/octet-stream");
      const descripcion = body.descripcion ? String(body.descripcion) : null;
      const dataBase64 = String(body.data_base64 ?? "");

      if (!atencionId || !nombreOriginal || !dataBase64) {
        return sendJson(res, 400, {
          error: "Campos requeridos: atencion_id, nombre_original, data_base64",
        });
      }

      await verificarAcceso(atencionId, requester.id, requester.role);

      const buffer = Buffer.from(dataBase64, "base64");
      validarTamanoArchivo(buffer.length);

      const path = `${atencionId}/${randomUUID()}-${nombreOriginal}`;
      await subirArchivoStorage(path, buffer, tipoMime);

      const r = await db().query(
        `
          insert into public.archivos (
            atencion_id, nombre_original, descripcion, storage_path,
            tipo_mime, tamano_bytes, subido_por
          ) values ($1, $2, $3, $4, $5, $6, $7)
          returning id, nombre_original, descripcion, tipo_mime, tamano_bytes, created_at
        `,
        [atencionId, nombreOriginal, descripcion, path, tipoMime, buffer.length, requester.id]
      );

      return sendJson(res, 200, { ok: true, item: r.rows[0] });
    }

    return sendJson(res, 405, { error: "Método no permitido" });
  } catch (e: any) {
    console.error("/api/archivos error:", e);
    const status = e?.statusCode ?? 500;
    return sendJson(res, status, { error: e?.message ?? "Error interno" });
  }
}