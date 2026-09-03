import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

import fondoPersoneria from "../../logos/personeria-fondo.jpeg";

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
    <div
      className="min-h-screen bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${fondoPersoneria})`, backgroundPosition: "center 30%" }}
    >
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900/90 via-brand-800/85 to-brand-700/80 px-4 pt-40 pb-12">
        <Card className="w-full max-w-md p-6 lg:p-8">
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