import { useEffect, useState } from "react";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { getReporte } from "../services/reportes";
import type { Reporte } from "../services/reportes";

function primerDiaDelMesLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Reportes() {
  const [desde, setDesde] = useState(primerDiaDelMesLocal());
  const [hasta, setHasta] = useState(hoyLocal());
  const [data, setData] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await getReporte(desde, hasta);
      setData(r);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando el reporte");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = data
    ? [
        { label: "Casos nuevos", value: data.totales.nuevos, color: "text-sky-700" },
        { label: "Seguimientos", value: data.totales.seguimientos, color: "text-indigo-700" },
        { label: "Pendientes (asignados)", value: data.totales.pendientes, color: "text-amber-700" },
        { label: "En seguimiento", value: data.totales.en_seguimiento, color: "text-sky-700" },
        { label: "Finalizados", value: data.totales.finalizados, color: "text-green-700" },
        { label: "Total atenciones", value: data.totales.total, color: "text-brand-800" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-black text-brand-800">Reportes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Reparto de casos por funcionario y por asunto, en el rango de fechas que elijas.
        </p>

        <Card className="mt-6 p-5">
          <div className="grid items-end gap-3 md:grid-cols-4">
            <Input
              label="Desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
            <Input
              label="Hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
            <Button onClick={load} disabled={loading}>
              {loading ? "Consultando..." : "Consultar"}
            </Button>
          </div>

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </Card>

        {data && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <Card key={c.label} className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {c.label}
                  </div>
                  <div className={`mt-1 text-3xl font-black ${c.color}`}>{c.value}</div>
                </Card>
              ))}
            </div>

            <Card className="mt-6 p-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">Por funcionario</div>

              {data.porFuncionario.length === 0 && (
                <div className="text-sm text-slate-500">Sin datos en este rango.</div>
              )}

              {data.porFuncionario.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Funcionario</th>
                        <th className="px-4 py-3 text-left font-semibold">Nuevos</th>
                        <th className="px-4 py-3 text-left font-semibold">Seguimientos</th>
                        <th className="px-4 py-3 text-left font-semibold">Pendientes</th>
                        <th className="px-4 py-3 text-left font-semibold">En seguimiento</th>
                        <th className="px-4 py-3 text-left font-semibold">Finalizados</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.porFuncionario.map((f) => (
                        <tr key={f.funcionario_id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium">{f.funcionario}</td>
                          <td className="px-4 py-3">{f.nuevos}</td>
                          <td className="px-4 py-3">{f.seguimientos}</td>
                          <td className="px-4 py-3">{f.pendientes}</td>
                          <td className="px-4 py-3">{f.en_seguimiento}</td>
                          <td className="px-4 py-3">{f.finalizados}</td>
                          <td className="px-4 py-3 font-semibold">{f.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="mt-6 p-5">
              <div className="mb-3 text-sm font-semibold text-slate-700">Por asunto</div>

              {data.porAsunto.length === 0 && (
                <div className="text-sm text-slate-500">Sin datos en este rango.</div>
              )}

              {data.porAsunto.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Asunto</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.porAsunto.map((a) => (
                        <tr key={a.asunto} className="border-t border-slate-100">
                          <td className="px-4 py-3">{a.asunto}</td>
                          <td className="px-4 py-3 font-semibold">{a.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}