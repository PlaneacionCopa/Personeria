import { useEffect, useState } from "react";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import {
  actualizarSeguimiento,
  finalizarSesionAtencion,
  getTipificaciones,
  misAtenciones,
} from "../services/atenciones";
import type { Atencion, Estado, Tipificaciones } from "../types/atencion";

function formatMinutos(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

const TABS: { value: Estado | "TODOS"; label: string }[] = [
  { value: "ASIGNADO", label: "Nuevos" },
  { value: "EN_SEGUIMIENTO", label: "En seguimiento" },
  { value: "FINALIZADO", label: "Finalizados" },
  { value: "TODOS", label: "Todos" },
];

const ESTADO_COLOR: Record<string, string> = {
  ASIGNADO: "bg-amber-50 text-amber-700 border-amber-100",
  EN_SEGUIMIENTO: "bg-sky-50 text-sky-700 border-sky-100",
  FINALIZADO: "bg-green-50 text-green-700 border-green-100",
};

export default function MisAsignaciones() {
  const [tab, setTab] = useState<Estado | "TODOS">("ASIGNADO");
  const [items, setItems] = useState<Atencion[]>([]);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<Tipificaciones | null>(null);
  const [selected, setSelected] = useState<Atencion | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [finalizandoSesion, setFinalizandoSesion] = useState(false);

  useEffect(() => {
    getTipificaciones().then(setTips).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await misAtenciones(tab === "TODOS" ? undefined : tab);
      setItems(r.items);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openDetalle(item: Atencion) {
    setSelected({ ...item });
    setSessionStart(new Date());
  }

  async function guardarSeguimiento() {
    if (!selected) return;

    try {
      await actualizarSeguimiento(selected.id, {
        estado: selected.estado,
        saludo: selected.saludo ?? "",
        accion_realizada: selected.accion_realizada ?? "",
        observaciones: selected.observaciones ?? "",
        expediente: selected.expediente ?? "",
        plazo_ampliado: selected.plazo_ampliado,
      });

      setSelected(null);
      load();
    } catch (e: any) {
      alert(e?.message ?? "Error guardando seguimiento");
    }
  }

  async function handleFinalizarSesion() {
    if (!selected || !sessionStart) return;
    setFinalizandoSesion(true);

    try {
      const r = await finalizarSesionAtencion(selected.id, sessionStart.toISOString());
      alert(
        `Atención de hoy registrada: ${formatMinutos(r.minutosSesion)}.\n` +
          `Total acumulado en este caso: ${formatMinutos(r.item.tiempo_atencion_acumulado_minutos)}.`
      );
      setSelected(null);
      load();
    } catch (e: any) {
      alert(e?.message ?? "Error registrando la atención de hoy");
    } finally {
      setFinalizandoSesion(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-black text-brand-800">Mis asignaciones</h2>
        <p className="mt-1 text-sm text-slate-600">
          Casos que te asignó el secretario. Actualiza el estado y agrega el seguimiento.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.value
                  ? "bg-brand-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="mt-4 p-5">
          {loading && <div className="text-sm text-slate-500">Cargando...</div>}

          {!loading && items.length === 0 && (
            <div className="text-sm text-slate-500">No hay casos en esta categoría.</div>
          )}

          {!loading && items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Documento</th>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Asunto</th>
                    <th className="px-4 py-3 text-left font-semibold">Resp. límite</th>
                    <th className="px-4 py-3 text-left font-semibold">T. atención</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{item.fecha}</td>
                      <td className="px-4 py-3">{item.documento}</td>
                      <td className="px-4 py-3">{item.nombre_completo}</td>
                      <td className="px-4 py-3">{item.asunto}</td>
                      <td className="px-4 py-3">{item.fecha_respuesta ?? "—"}</td>
                      <td className="px-4 py-3">{formatMinutos(item.tiempo_atencion_acumulado_minutos)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold ${ESTADO_COLOR[item.estado]}`}
                        >
                          {item.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" onClick={() => openDetalle(item)}>
                          Abrir
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
              <h3 className="text-lg font-bold">
                {selected.nombre_completo} — {selected.documento}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-xl text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm mb-4">
              <div><b>Asunto</b><div>{selected.asunto}</div></div>
              <div><b>Tipo de caso</b><div>{selected.tipo_caso}</div></div>
              <div><b>Teléfono</b><div>{selected.telefono || "—"}</div></div>
              <div><b>Dirección</b><div>{selected.direccion || "—"}</div></div>
              <div><b>Hora de ingreso</b><div>{selected.hora_ingreso}</div></div>
              <div><b>Fecha límite de respuesta</b><div>{selected.fecha_respuesta ?? "—"}</div></div>
              <div><b>Tiempo total de atención (acumulado)</b><div>{formatMinutos(selected.tiempo_atencion_acumulado_minutos)}</div></div>
            </div>

            <label className="mb-4 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={selected.plazo_ampliado}
                disabled={selected.plazo_ampliado}
                onChange={(e) => setSelected({ ...selected, plazo_ampliado: e.target.checked })}
              />
              <span>
                {selected.plazo_ampliado ? (
                  <span className="font-semibold text-amber-800">
                    Plazo ampliado — ya se sumaron 15 días hábiles más a la fecha límite.
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-amber-800">Necesito más tiempo. </span>
                    Al marcar y guardar, la fecha límite de respuesta se amplía 15 días hábiles
                    más desde hoy. Solo se puede usar una vez por caso.
                  </>
                )}
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Estado"
                value={selected.estado}
                onChange={(e) => setSelected({ ...selected, estado: e.target.value as Estado })}
              >
                {(tips?.estado || ["ASIGNADO", "EN_SEGUIMIENTO", "FINALIZADO"]).map((v) => (
                  <option key={v} value={v}>{v.replace("_", " ")}</option>
                ))}
              </Select>

              <Input
                label="Expediente"
                value={selected.expediente ?? ""}
                onChange={(e) => setSelected({ ...selected, expediente: e.target.value })}
              />

              <Input
                label="Saludo"
                className="md:col-span-2"
                value={selected.saludo ?? ""}
                onChange={(e) => setSelected({ ...selected, saludo: e.target.value })}
              />

              <div className="md:col-span-2">
                <div className="mb-1 text-sm font-medium text-slate-700">Acción realizada</div>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  rows={3}
                  value={selected.accion_realizada ?? ""}
                  onChange={(e) => setSelected({ ...selected, accion_realizada: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 text-sm font-medium text-slate-700">Observaciones</div>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  rows={4}
                  value={selected.observaciones ?? ""}
                  onChange={(e) => setSelected({ ...selected, observaciones: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={handleFinalizarSesion}
                disabled={finalizandoSesion}
                className="mr-auto border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              >
                {finalizandoSesion ? "Registrando..." : "✓ Finalizar atención de hoy"}
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
              <Button onClick={guardarSeguimiento}>Guardar seguimiento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}