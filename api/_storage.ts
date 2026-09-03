import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "adjuntos";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por archivo

let client: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        "Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  return client;
}

export function validarTamanoArchivo(bytes: number) {
  if (bytes > MAX_BYTES) {
    throw new Error(
      `El archivo es demasiado grande (máximo ${Math.floor(MAX_BYTES / (1024 * 1024))} MB).`
    );
  }
}

export async function subirArchivoStorage(
  path: string,
  contenido: Buffer,
  tipoMime: string
) {
  const { error } = await storageClient()
    .storage.from(BUCKET)
    .upload(path, contenido, { contentType: tipoMime, upsert: false });

  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
}

export async function urlFirmadaDescarga(path: string, segundosValidez = 300) {
  const { data, error } = await storageClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, segundosValidez);

  if (error || !data) {
    throw new Error(`Error generando el enlace de descarga: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function borrarArchivoStorage(path: string) {
  const { error } = await storageClient().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Error borrando archivo: ${error.message}`);
}