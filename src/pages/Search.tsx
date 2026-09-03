import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import AdjuntosPanel from "../components/AdjuntosPanel";
import { searchByDocumento } from "../services/atenciones";
import type { Atencion } from "../types/atencion";

const ESTADO_LABEL: Record<string, string> = {
  ASIGNADO: "Asignado",
  EN_SEGUIMIENTO: "En seguimiento",
  FINALIZADO: "Finalizado",
};

const ESTADO_COLOR: Record<string, string> = {
  ASIGNADO: "bg-amber-50 text-amber-700 border-amber-100",
  EN_SEGUIMIENTO: "bg-sky-50 text-sky-700 border-sky-100",
  FINALIZADO: "bg-green-50 text-green-700 border-green-100",
};

export default function Search() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Atencion[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Atencion | null>(null);
  const nav = useNavigate();

  async function handleSearch() {
    setMsg(null);
    setLoading(true);
    setItems([]);

    try {
      const documento = id.trim();
      const r = await searchByDocumento(documento);

      if (!r.found || !r.items || r.items.length === 0) {
        setMsg("No hay información para ese documento.");
      } else {
        setItems(r.items);
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Error consultando.");
    } finally {
      setLoading(false);
    }
  }

  function preview(text: string | null | undefined, max = 60) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-2xl font-black text-brand-800">Buscar</h2>
        <p className="mt-1 text-sm text-slate-600">Consulta por documento.</p>

        <Card className="mt-6 p-5">
          <div className="grid items-end gap-3 md:grid-cols-3">
            <Input
              label="Documento"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Ej: 123456789"
            />

            <Button onClick={handleSearch} disabled={!id.trim() || loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>

            {id.trim() && (
              <Button variant="primary" onClick={() => nav("/crear")}>
                Nueva atención
              </Button>
            )}
          </div>

          {msg && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <div>{msg}</div>
              <Button variant="primary" onClick={() => nav("/crear")}>
                Crear registro
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Asunto</th>
                    <th className="px-4 py-3 text-left font-semibold">Asignado a</th>
                    <th className="px-4 py-3 text-left font-semibold">Resp. límite</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Observación</th>
                    <th className="px-4 py-3 text-left font-semibold">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{item.fecha}</td>
                      <td className="px-4 py-3">{item.nombre_completo}</td>
                      <td className="px-4 py-3">{item.asunto}</td>
                      <td className="px-4 py-3">{item.asignado_a_nombre}</td>
                      <td className="px-4 py-3">{item.fecha_respuesta ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold ${ESTADO_COLOR[item.estado]}`}
                        >
                          {ESTADO_LABEL[item.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate" title={item.observaciones ?? ""}>
                          {preview(item.observaciones)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" onClick={() => setSelected(item)}>
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Detalle de atención</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-xl text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
              <div><b>Documento</b><div>{selected.documento}</div></div>
              <div><b>Nombre</b><div>{selected.nombre_completo}</div></div>
              <div><b>Fecha</b><div>{selected.fecha}</div></div>
              <div><b>Asunto</b><div>{selected.asunto}</div></div>
              <div><b>Hora de ingreso</b><div>{selected.hora_ingreso}</div></div>
              <div><b>Hora de atención</b><div>{selected.hora_atencion}</div></div>
              <div><b>Canal de ingreso</b><div>{selected.canal ?? "—"}</div></div>
              <div><b>Fecha límite de respuesta</b><div>{selected.fecha_respuesta ?? "—"}</div></div>
              <div><b>Plazo ampliado</b><div>{selected.plazo_ampliado ? "Sí" : "No"}</div></div>
              <div><b>Asignado a</b><div>{selected.asignado_a_nombre}</div></div>
              <div><b>Estado</b><div>{ESTADO_LABEL[selected.estado]}</div></div>

              <div className="md:col-span-2">
                <b>Observaciones</b>
                <div className="mt-2 rounded-lg bg-slate-50 p-3 whitespace-pre-wrap">
                  {selected.observaciones || "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <AdjuntosPanel atencionId={selected.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}