import { Routes, Route, Navigate } from "react-router-dom";
import { currentUser } from "../services/http";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Crear from "../pages/Create";
import Buscar from "../pages/Search";
import MisAsignaciones from "../pages/MisAsignaciones";
import Usuarios from "../pages/Usuarios";
import Reportes from "../pages/Reportes";

import type { Rol } from "../types/atencion";

function RequireAuth({
  roles,
  children,
}: {
  roles?: Rol[];
  children: JSX.Element;
}) {
  const token = localStorage.getItem("token");
  const user = currentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/crear"
        element={
          <RequireAuth roles={["secretario", "admin"]}>
            <Crear />
          </RequireAuth>
        }
      />

     <Route
        path="/buscar"
        element={
          <RequireAuth roles={["secretario", "admin", "funcionario"]}>
            <Buscar />
          </RequireAuth>
        }
      />

      <Route
        path="/asignaciones"
        element={
          <RequireAuth roles={["funcionario", "admin"]}>
            <MisAsignaciones />
          </RequireAuth>
        }
      />

      <Route
        path="/usuarios"
        element={
          <RequireAuth roles={["admin"]}>
            <Usuarios />
          </RequireAuth>
        }
      />

      <Route
        path="/reportes"
        element={
          <RequireAuth roles={["admin"]}>
            <Reportes />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}