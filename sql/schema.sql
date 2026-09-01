-- =========================================================
-- Esquema: Atención de Usuarios - Personería de Copacabana
-- Ejecutar en el editor SQL de Supabase (o psql contra la BD)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Usuarios de la aplicación (secretario, funcionarios, admin)
-- ---------------------------------------------------------
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('admin','secretario','funcionario')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Atenciones (reemplaza la tabla "orientaciones")
-- ---------------------------------------------------------
create table if not exists public.atenciones (
  id uuid primary key default gen_random_uuid(),

  -- Datos del usuario atendido
  documento text not null,
  tipo_documento text not null,
  nombre_completo text not null,
  nacionalidad text not null default 'COLOMBIANA',
  edad int,
  poblacion text,
  telefono text,
  correo text,
  direccion text,
  barrio_vereda text,

  -- Datos de la atención
  asunto text not null,
  tipo_caso text not null default 'NUEVO' check (tipo_caso in ('NUEVO','SEGUIMIENTO')),

  fecha date not null default current_date,
  hora_ingreso time not null,
  hora_atencion time not null default current_time,
  tiempo_espera_minutos int generated always as (
    greatest(0, (extract(epoch from (hora_atencion - hora_ingreso)) / 60)::int)
  ) stored,

  -- Asignación al funcionario
  asignado_a uuid not null references public.app_users(id),
  estado text not null default 'ASIGNADO' check (estado in ('ASIGNADO','EN_SEGUIMIENTO','FINALIZADO')),

  -- Seguimiento (lo diligencia el funcionario)
  saludo text,
  accion_realizada text,
  observaciones text,
  expediente text,
  fin_atencion timestamptz,

  -- Trazabilidad
  creado_por uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_atenciones_documento on public.atenciones(documento);
create index if not exists idx_atenciones_asignado_a on public.atenciones(asignado_a);
create index if not exists idx_atenciones_estado on public.atenciones(estado);
create index if not exists idx_atenciones_fecha on public.atenciones(fecha);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_atenciones_updated_at on public.atenciones;
create trigger trg_atenciones_updated_at
before update on public.atenciones
for each row execute function public.set_updated_at();
