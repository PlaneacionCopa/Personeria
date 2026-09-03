import { useEffect, useRef, useState } from "react";
import { listarArchivos, obtenerUrlDescarga, subirArchivo } from "../services/archivos";
import type { Archivo } from "../services/archivos";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdjuntosPanel({
  atencionId,
  puedeSubir = false,
}: {
  atencionId: string;
  puedeSubir?: boolean;
}) {
  const [items, setItems] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [descripcionNueva, setDescripcionNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const r = await listarArchivos(atencionId);
      setItems(r.items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando documentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atencionId]);

  async function handleDescargar(archivoId: string) {
    try {
      const r = await obtenerUrlDescarga(archivoId);
      window.open(r.url, "_blank");
    } catch (e: any) {
      alert(e?.message ?? "Error obteniendo el archivo");
    }
  }

  async function handleSeleccionarArchivo(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    setSubiendo(true);
    setError(null);

    try {
      await subirArchivo(atencionId, file, descripcionNueva);
      setDescripcionNueva("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      cargar();
    } catch (e: any) {
      setError(e?.message ?? "Error subiendo el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-700">Documentos adjuntos</div>

      {loading && <div className="text-sm text-slate-500">Cargando documentos...</div>}

      {!loading && items.length === 0 && (
        <div className="text-sm text-slate-500">No hay documentos adjuntos todavía.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-700">
                  {a.nombre_original}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({formatBytes(a.tamano_bytes)})
                  </span>
                </div>
                {a.descripcion && (
                  <div className="text-xs text-slate-500">{a.descripcion}</div>
                )}
                {a.subido_por_nombre && (
                  <div className="text-xs text-slate-400">Subido por {a.subido_por_nombre}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDescargar(a.id)}
                className="whitespace-nowrap text-sm font-semibold text-brand-800 hover:underline"
              >
                Descargar
              </button>
            </div>
          ))}
        </div>
      )}

      {puedeSubir && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs text-slate-500">
            Adjuntar un nuevo documento (PDF, foto, etc. — máx. 8 MB)
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="¿Qué es este archivo?"
              value={descripcionNueva}
              onChange={(e) => setDescripcionNueva(e.target.value)}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <input
              ref={fileInputRef}
              type="file"
              disabled={subiendo}
              onChange={(e) => handleSeleccionarArchivo(e.target.files)}
              className="text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
            />
          </div>
          {subiendo && <div className="mt-1 text-xs text-sky-700">Subiendo...</div>}
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}