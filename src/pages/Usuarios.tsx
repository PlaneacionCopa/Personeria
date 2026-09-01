import { useEffect, useState } from "react";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import { actualizarUsuario, crearUsuario, listarUsuarios } from "../services/usuarios";
import type { Rol, Usuario } from "../types/atencion";

const ROLE_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  secretario: "Secretario",
  funcionario: "Funcionario",
};

export default function Usuarios() {
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "funcionario" as Rol,
  });

  async function load() {
    setLoading(true);
    try {
      const r = await listarUsuarios();
      setItems(r.items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCrear() {
    setError(null);

    if (!form.username || !form.password || !form.full_name) {
      setError("Completa usuario, contraseña y nombre completo.");
      return;
    }

    try {
      await crearUsuario(form);
      setForm({ username: "", password: "", full_name: "", role: "funcionario" });
      load();
    } catch (e: any) {
      setError(e?.message ?? "Error creando usuario");
    }
  }

  async function toggleActivo(u: Usuario) {
    try {
      await actualizarUsuario(u.id, { is_active: !u.is_active });
      load();
    } catch (e: any) {
      alert(e?.message ?? "Error actualizando usuario");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-black text-brand-800">Usuarios</h2>
        <p className="mt-1 text-sm text-slate-600">
          Crea las cuentas de los secretarios y de cada funcionario que recibe asignaciones.
        </p>

        <Card className="mt-6 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Crear nuevo usuario</div>

          <div className="grid gap-4 md:grid-cols-4">
            <Input
              label="Usuario (login)"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="ej: jorge.perez"
            />

            <Input
              label="Nombre completo"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="ej: Jorge Pérez"
            />

            <Input
              label="Contraseña"
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Contraseña temporal"
            />

            <Select
              label="Rol"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Rol })}
            >
              <option value="funcionario">Funcionario</option>
              <option value="secretario">Secretario</option>
              <option value="admin">Administrador</option>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleCrear}>Crear usuario</Button>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Usuarios existentes</div>

          {loading && <div className="text-sm text-slate-500">Cargando...</div>}

          {!loading && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                    <th className="px-4 py-3 text-left font-semibold">Rol</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{u.full_name}</td>
                      <td className="px-4 py-3">{u.username}</td>
                      <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="rounded-lg border border-green-100 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                            Activo
                          </span>
                        ) : (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" onClick={() => toggleActivo(u)}>
                          {u.is_active ? "Desactivar" : "Activar"}
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
    </div>
  );
}
