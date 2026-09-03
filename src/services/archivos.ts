import { authHeaders, parseResponse } from "./http";

export type Archivo = {
  id: string;
  nombre_original: string;
  descripcion: string | null;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  created_at: string;
  subido_por_nombre?: string;
};

export async function listarArchivos(atencionId: string): Promise<{ items: Archivo[] }> {
  const res = await fetch(`/api/archivos?atencion_id=${encodeURIComponent(atencionId)}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      // "data:<mime>;base64,AAAA..." -> nos quedamos solo con la parte base64
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function subirArchivo(
  atencionId: string,
  file: File,
  descripcion: string
): Promise<{ ok: true; item: Archivo }> {
  const dataBase64 = await fileToBase64(file);

  const res = await fetch("/api/archivos", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({
      atencion_id: atencionId,
      nombre_original: file.name,
      tipo_mime: file.type || "application/octet-stream",
      descripcion,
      data_base64: dataBase64,
    }),
  });
  return parseResponse(res);
}

export async function obtenerUrlDescarga(
  archivoId: string
): Promise<{ url: string; nombre: string }> {
  const res = await fetch(`/api/archivos?descargar_id=${encodeURIComponent(archivoId)}`, {
    method: "GET",
    headers: authHeaders(true),
  });
  return parseResponse(res);
}