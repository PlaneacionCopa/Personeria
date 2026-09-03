import { useEffect, useMemo, useState } from "react";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import { crearAtencion, getTipificaciones, searchByDocumento } from "../services/atenciones";
import { listarUsuarios } from "../services/usuarios";
import type { NuevaAtencionInput, Tipificaciones, Usuario } from "../types/atencion";

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function upper(value: string) {
  return value.toUpperCase();
}

const emptyForm: NuevaAtencionInput = {
  documento: "",
  tipo_documento: "CÉDULA DE CIUDADANÍA",
  nombre_completo: "",
  nacionalidad: "COLOMBIANA",
  edad: 0,
  poblacion: "",
  telefono: "",
  correo: "",
  direccion: "",
  barrio_vereda: "",
  asunto: "",
  tipo_caso: "NUEVO",
  canal: "",
  hora_ingreso: nowHHMM(),
  asignado_a: "",
};

export default function Create() {
  const [tips, setTips] = useState<Tipificaciones | null>(null);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); 
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [form, setForm] = useState<NuevaAtencionInput>(emptyForm);

  useEffect(() => {
    getTipificaciones()
      .then(setTips)
      .catch((e) => console.error("Error cargando tipificaciones:", e));

    listarUsuarios("funcionario")
      .then((r) => setFuncionarios(r.items))
      .catch((e) => console.error("Error cargando funcionarios:", e));
  }, []);

  async function handleBuscarDocumento(documento: string) {
    if (!documento.trim()) return;
    setPrefillLoading(true);
    setError(null);

    try {
      const r = await searchByDocumento(documento.trim());

      if (r.found && r.items.length > 0) {
        const last = r.items[0];
        setForm((prev) => ({
          ...prev,
          documento: last.documento,
          tipo_documento: last.tipo_documento,
          nombre_completo: last.nombre_completo,
          nacionalidad: last.nacionalidad,
          edad: last.edad ?? 0,
          poblacion: last.poblacion ?? "",
          telefono: last.telefono ?? "",
          correo: last.correo ?? "",
          direccion: last.direccion ?? "",
          barrio_vereda: last.barrio_vereda ?? "",
          tipo_caso: "SEGUIMIENTO",
        }));
      } else {
        setForm((prev) => ({ ...prev, tipo_caso: "NUEVO" }));
      }
    } catch (e: any) {
      console.error("Error buscando historial:", e);
    } finally {
      setPrefillLoading(false);
    }
  }

  const canSubmit = useMemo(() => {
    return (
      form.documento.trim().length > 0 &&
      form.tipo_documento.trim().length > 0 &&
      form.nombre_completo.trim().length > 0 &&
      form.nacionalidad.trim().length > 0 &&
      form.asunto.trim().length > 0 &&
      form.tipo_caso.trim().length > 0 &&
      form.hora_ingreso.trim().length > 0 &&
      form.asignado_a.trim().length > 0
    );
  }, [form]);

  async function handleSubmit() {
    setError(null);
    setDoneId(null);
    setLoading(true);

    try {
      const payload: NuevaAtencionInput = {
        ...form,
        nombre_completo: upper(form.nombre_completo),
        direccion: upper(form.direccion),
      };

      const r = await crearAtencion(payload);
      setDoneId(r.id);

      setForm({ ...emptyForm, hora_ingreso: nowHHMM() });
    } catch (e: any) {
      setError(e?.message ?? "Error guardando.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-black text-brand-800">Registrar y asignar atención</h2>
        <p className="mt-1 text-sm text-slate-600">
          La hora de atención y el tiempo de espera se calculan automáticamente al guardar.
        </p>

        <Card className="mt-6 p-5">
          {prefillLoading && (
            <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
              Buscando historial del documento...
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Documento"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              onBlur={(e) => handleBuscarDocumento(e.target.value)}
              placeholder="Ej: 123456789"
            />

            <Select
              label="Tipo de documento"
              value={form.tipo_documento}
              onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
            >
              {(tips?.tipo_documento || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Input
              label="Nombre completo"
              className="uppercase"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: upper(e.target.value) })}
            />

            <Select
              label="Nacionalidad"
              value={form.nacionalidad}
              onChange={(e) => setForm({ ...form, nacionalidad: e.target.value })}
            >
              {(tips?.nacionalidad || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Input
              label="Edad"
              type="number"
              value={String(form.edad)}
              onChange={(e) => setForm({ ...form, edad: Number(e.target.value) })}
            />

            <Select
              label="Población"
              value={form.poblacion}
              onChange={(e) => setForm({ ...form, poblacion: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {(tips?.poblacion || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />

            <Input
              label="Correo electrónico"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />

            <Input
              label="Dirección"
              className="uppercase"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: upper(e.target.value) })}
            />

            <Select
              label="Barrio / Vereda"
              value={form.barrio_vereda}
              onChange={(e) => setForm({ ...form, barrio_vereda: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {(tips?.barrio_vereda || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Select
              label="Asunto"
              value={form.asunto}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {(tips?.asunto || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Select
              label="Nuevo / Seguimiento"
              value={form.tipo_caso}
              onChange={(e) => setForm({ ...form, tipo_caso: e.target.value as any })}
            >
              {(tips?.tipo_caso || ["NUEVO", "SEGUIMIENTO"]).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <Input
              label="Hora de ingreso"
              type="time"
              value={form.hora_ingreso}
              onChange={(e) => setForm({ ...form, hora_ingreso: e.target.value })}
            />

            <Select
              label="Asignar a"
              value={form.asignado_a}
              onChange={(e) => setForm({ ...form, asignado_a: e.target.value })}
            >
              <option value="">Seleccione un funcionario...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.full_name}</option>
              ))}
            </Select>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button disabled={!canSubmit || loading} onClick={handleSubmit}>
              {loading ? "Guardando..." : "Guardar y asignar"}
            </Button>

            {doneId && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                Guardado y asignado correctamente.
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
