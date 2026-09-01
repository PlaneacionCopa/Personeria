# Atención de Usuarios — Personería de Copacabana (React + Vite + Tailwind)

Aplicación para **registrar**, **asignar** y hacer **seguimiento** a las
atenciones de la Personería. Colores base: `#21294C`.

## Roles

- **Secretario**: registra el ingreso de un usuario y lo **asigna** a un
  funcionario. Puede buscar por documento.
- **Funcionario**: tiene su propio usuario. Al entrar ve **"Mis
  asignaciones"**: los casos nuevos, en seguimiento y finalizados que le
  asignó el secretario, y puede actualizarlos.
- **Administrador**: crea/desactiva usuarios (secretarios y funcionarios) y
  puede descargar toda la base en Excel.

## Flujo

1. El secretario registra al usuario que llega (documento, nombre, asunto,
   hora de ingreso, etc.) y elige a qué **funcionario** se asigna.
2. Al guardar, el sistema toma automáticamente la **hora de atención**
   (momento de la asignación) y calcula el **tiempo de espera** =
   hora de atención − hora de ingreso. La **fecha** también es automática.
3. El funcionario asignado ve el caso en "Mis asignaciones" → pestaña
   **Nuevos**. Lo abre, diligencia saludo / acción realizada / observaciones
   / expediente, y cambia el estado: `Asignado → En seguimiento →
   Finalizado`.

## Requisitos
- Node.js 18+
- npm
- Base de datos Postgres (Supabase u otro)

## 1. Crear las tablas

Ejecuta `sql/schema.sql` en el editor SQL de tu base de datos (Supabase:
*SQL Editor*). Crea las tablas `app_users` y `atenciones`.

## 2. Crear el primer usuario administrador

```bash
npm install
node scripts/crear-usuario.mjs admin "TuClaveSegura123" "Administrador" admin
```

Copia el `INSERT` que imprime el script y ejecútalo en el SQL Editor de
Supabase. Con ese usuario ya puedes entrar a la app y crear desde allí
(menú **Usuarios**) a los secretarios y a cada funcionario.

Funcionarios sugeridos según el histórico de atención (puedes crear los que
necesites, con el nombre que prefieras): Marcela, Elvis, Jorge, Angie, Laura,
Susana, Isabella, Luis, Mariana, Claudia, Nelson, Estefanía, Daniel,
Valentina, Julián, Andrea, David, Personero.

## 3. Variables de entorno

- `SUPABASE_DB_URL` — cadena de conexión a Postgres.
- `JWT_SECRET` — cualquier cadena secreta larga, para firmar las sesiones.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Por defecto la app usa `/api`. Puedes cambiarlo con:
```bash
export VITE_API_BASE="http://localhost:3000/api"
npm run dev
```

## Endpoints

- `POST /api/auth-login` → `{ token, user }`
- `GET /api/tipificaciones` → listas para los combos (asunto, barrios, etc.)
- `GET /api/atenciones?documento=123` → historial de una persona
- `GET /api/atenciones?bandeja=mias&estado=ASIGNADO` → bandeja del funcionario logueado
- `POST /api/atenciones` → crea y asigna una atención (secretario/admin)
- `PATCH /api/atenciones` → actualiza estado/seguimiento (funcionario asignado o admin)
- `GET /api/usuarios?role=funcionario` → lista de funcionarios activos
- `POST /api/usuarios` → crear usuario (admin)
- `PATCH /api/usuarios` → activar/desactivar/cambiar clave (admin)
- `GET /api/export-atenciones` → descarga Excel completo (admin)

## Deploy en Vercel

Configura en Vercel las variables de entorno `SUPABASE_DB_URL` y
`JWT_SECRET`, y despliega normalmente (`vercel.json` ya está listo).

## Barrios / veredas

La lista de barrios y veredas se mantiene igual a la que ya tenía la
aplicación (`api/tipificaciones.ts`).
