import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import { currentUser, logout as doLogout } from "../services/http";

export default function BrandHeader() {
  const nav = useNavigate();
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);

  const user = currentUser();
  const role = user?.role;

  const go = (path: string) => {
    if (location.pathname === path) return;
    nav(path);
  };

  const logout = () => {
    doLogout();
    nav("/login", { replace: true });
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Sesión inválida. Vuelve a iniciar sesión.");
        nav("/login", { replace: true });
        return;
      }

      const res = await fetch("/api/export-atenciones", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let message = "No se pudo descargar la base de datos";
        try {
          const data = await res.json();
          message = data?.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "atenciones.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Error descargando la base de datos");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 font-black text-white">
            PC
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-800">
              Personería de Copacabana
            </div>
            <div className="text-xs text-slate-500">
              Atención de Usuarios
              {user?.full_name ? ` · ${user.full_name}` : ""}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {(role === "secretario" || role === "admin") && (
            <>
              <Button variant="ghost" onClick={() => go("/buscar")}>
                Buscar
              </Button>
              <Button variant="ghost" onClick={() => go("/crear")}>
                Crear registro
              </Button>
            </>
          )}

          {(role === "funcionario" || role === "admin") && (
            <Button variant="ghost" onClick={() => go("/asignaciones")}>
              Mis asignaciones
            </Button>
          )}

          {role === "admin" && (
            <>
              <Button variant="ghost" onClick={() => go("/usuarios")}>
                Usuarios
              </Button>
              <Button variant="ghost" onClick={handleDownload} disabled={downloading}>
                {downloading ? "Descargando..." : "Descargar base"}
              </Button>
            </>
          )}

          <Button onClick={logout}>Salir</Button>
        </nav>
      </div>
    </header>
  );
}
