import { useEffect, useState } from "react";
import { agregarSeguimiento, listarSeguimientos } from "../services/seguimientos";
import type { Seguimiento } from "../services/seguimientos";

const emptyNuevo = {
  sintesis_caso: "",
  pregunta_problema: "",
  metodologia: "",
  accion_realizada: "",
  observaciones: "",
};

function adelanto(s: Seguimiento, max = 60) {
  const texto = s.sintesis_caso || s.accion_realizada || s.pregunta_problema || s.observaciones || "";
  if (!texto) return "(sin detalle)";
  return texto.length > max ? texto.slice(0, max) + "..." : texto;
}

export default function HiloSeguimientos({
  atencionId,
  onNuevaVisita,
}: {
  atencionId: string;
  onNuevaVisita?: () => void;
}) {
  const [items, setItems] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [nuevo, setNuevo] = useState(emptyNuevo);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const r = await listarSeguimientos(atencionId);
      setItems(r.items);
      // Si es la primera vez (todavía no hay ninguna visita), abre el
      // formulario de una vez en lugar de esconderlo detrás de un botón.
      if (r.items.length === 0) {
        setMostrarForm(true);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error cargando el hilo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atencionId]);

  async function handleGuardar() {
    setGuardando(true);
    setError(null);
    try {
      await agregarSeguimiento(atencionId, nuevo);
      setNuevo(emptyNuevo);
      setMostrarForm(false);
      await cargar();
      onNuevaVisita?.();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando la visita");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">
          {items.length === 0 ? "Registro de esta atención" : `Hilo de visitas (${items.length})`}
        </div>
        {!mostrarForm && (
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="text-sm font-semibold text-brand-800 hover:underline"
          >
            + Agregar visita
          </button>
        )}
      </div>

      {loading && <div className="text-sm text-slate-500">Cargando hilo...</div>}

      {!loading && items.length === 0 && !mostrarForm && (
        <div className="text-sm text-slate-500">Todavía no hay visitas registradas.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {[...items].reverse().map((s) => {
            const abierto = expandidoId === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 text-sm">
                <button
                  type="button"
                  onClick={() => setExpandidoId(abierto ? null : s.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-xs text-slate-500">
                      {s.fecha} · {s.hora}
                      {s.funcionario_nombre ? ` · ${s.funcionario_nombre}` : ""}
                    </span>
                    <span className="ml-2 text-slate-700">{adelanto(s)}</span>
                  </span>
                  <span className="shrink-0 text-slate-400">{abierto ? "▲" : "▼"}</span>
                </button>

                {abierto && (
                  <div className="border-t border-slate-200 px-3 py-2">
                    {s.sintesis_caso && (
                      <div className="mb-1"><b>Síntesis:</b> {s.sintesis_caso}</div>
                    )}
                    {s.pregunta_problema && (
                      <div className="mb-1"><b>Pregunta / problema:</b> {s.pregunta_problema}</div>
                    )}
                    {s.metodologia && (
                      <div className="mb-1"><b>Metodología:</b> {s.metodologia}</div>
                    )}
                    {s.accion_realizada && (
                      <div className="mb-1"><b>Acción realizada:</b> {s.accion_realizada}</div>
                    )}
                    {s.observaciones && (
                      <div><b>Observaciones:</b> {s.observaciones}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mostrarForm && (
        <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Síntesis del caso</div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
              rows={2}
              value={nuevo.sintesis_caso}
              onChange={(e) => setNuevo({ ...nuevo, sintesis_caso: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Pregunta / problema</div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
              rows={2}
              value={nuevo.pregunta_problema}
              onChange={(e) => setNuevo({ ...nuevo, pregunta_problema: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Metodología</div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
              rows={2}
              value={nuevo.metodologia}
              onChange={(e) => setNuevo({ ...nuevo, metodologia: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Acción realizada</div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
              rows={2}
              value={nuevo.accion_realizada}
              onChange={(e) => setNuevo({ ...nuevo, accion_realizada: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">Observaciones</div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
              rows={2}
              value={nuevo.observaciones}
              onChange={(e) => setNuevo({ ...nuevo, observaciones: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false);
                setNuevo(emptyNuevo);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardar}
              className="rounded-lg bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar visita"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}