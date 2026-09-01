import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

import logoAlcaldia from "../../logos/logoalcaldia.png";
import logoTeEscuchamos from "../../logos/teescuchamos.png";

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (token && rawUser) {
      nav("/", { replace: true });
    }
  }, [nav]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "");

      if (!username || !password) {
        alert("Ingrese usuario y contraseña");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Credenciales inválidas");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      nav("/", { replace: true });
    } catch (e: any) {
      alert(e?.message || "Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2">
        <div className="text-white">
          <div className="mb-6 flex items-center gap-6">
            <img
              src={logoAlcaldia}
              alt="Alcaldía de Copacabana"
              className="h-14 object-contain"
            />
            <img
              src={logoTeEscuchamos}
              alt="Personería de Copacabana"
              className="h-14 object-contain"
            />
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            Atención de Usuarios
            <span className="mt-2 block text-2xl font-semibold text-white/80">
              Registro • Asignación • Seguimiento
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-white/80">
            Personería Municipal de Copacabana. Ingresa con tu usuario para
            registrar, asignar o hacer seguimiento a las atenciones.
          </p>
        </div>

        <Card className="p-6 lg:p-8">
          <div className="text-xl font-black text-brand-800">Iniciar sesión</div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input name="username" label="Usuario" placeholder="usuario" required />

            <Input
              name="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              required
            />

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
