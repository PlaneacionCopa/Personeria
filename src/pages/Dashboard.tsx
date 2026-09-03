import { useNavigate } from "react-router-dom";
import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { currentUser } from "../services/http";

export default function Dashboard() {
  const nav = useNavigate();
  const user = currentUser();
  const role = user?.role;

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div>
          <h2 className="text-2xl font-black text-brand-800">
            Hola, {user?.full_name ?? "usuario"}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {role === "secretario" && "Registra la atención de un usuario y asígnala a un funcionario."}
            {role === "funcionario" && "Consulta y da seguimiento a los casos que te asignaron."}
            {role === "admin" && "Panel de administración: usuarios, registros y exportación."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {(role === "secretario" || role === "admin") && (
            <>
              <Card className="p-5">
                <div className="text-sm font-semibold text-slate-700">Crear registro</div>
                <div className="text-xs text-slate-500 mt-1">
                  Registra el ingreso de un usuario y asígnalo a un funcionario.
                </div>
                <Button variant="ghost" className="mt-4" onClick={() => nav("/crear")}>
                  Crear →
                </Button>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-semibold text-slate-700">Buscar</div>
                <div className="text-xs text-slate-500 mt-1">
                  Busca por documento y revisa el historial de atenciones.
                </div>
                <Button variant="ghost" className="mt-4" onClick={() => nav("/buscar")}>
                  Ir a buscar →
                </Button>
              </Card>
            </>
          )}

          {(role === "funcionario" || role === "admin") && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-700">Mis asignaciones</div>
              <div className="text-xs text-slate-500 mt-1">
                Casos nuevos, en seguimiento y finalizados que te asignaron.
              </div>
              <Button variant="ghost" className="mt-4" onClick={() => nav("/asignaciones")}>
                Ver asignaciones →
              </Button>
            </Card>
          )}

          {role === "funcionario" && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-700">Buscar</div>
              <div className="text-xs text-slate-500 mt-1">
                Busca por documento — útil para tomar un caso si el titular no está.
              </div>
              <Button variant="ghost" className="mt-4" onClick={() => nav("/buscar")}>
                Ir a buscar →
              </Button>
            </Card>
          )}

          {role === "admin" && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-700">Usuarios</div>
              <div className="text-xs text-slate-500 mt-1">
                Crea y administra cuentas de secretarios y funcionarios.
              </div>
              <Button variant="ghost" className="mt-4" onClick={() => nav("/usuarios")}>
                Administrar →
              </Button>
            </Card>
          )}

          {role === "admin" && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-700">Reportes</div>
              <div className="text-xs text-slate-500 mt-1">
                Reparto de casos por funcionario y por asunto, en el rango de fechas que elijas.
              </div>
              <Button variant="ghost" className="mt-4" onClick={() => nav("/reportes")}>
                Ver reportes →
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}