export type Rol = "admin" | "secretario" | "funcionario";
export type Estado = "ASIGNADO" | "EN_SEGUIMIENTO" | "FINALIZADO";
export type TipoCaso = "NUEVO" | "SEGUIMIENTO";

export type Usuario = {
  id: string;
  username: string;
  full_name: string;
  role: Rol;
  is_active: boolean;
  created_at?: string;
};

export type Atencion = {
  id: string;
  documento: string;
  tipo_documento: string;
  nombre_completo: string;
  nacionalidad: string;
  edad: number | null;
  poblacion: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  barrio_vereda: string | null;
  asunto: string;
  tipo_caso: TipoCaso;
  fecha: string;
  hora_ingreso: string;
  hora_atencion: string;
  tiempo_espera_horas: number | null;
  fecha_respuesta: string | null;
  asignado_a: string;
  asignado_a_nombre?: string;
  estado: Estado;
  saludo: string | null;
  accion_realizada: string | null;
  observaciones: string | null;
  expediente: string | null;
  fin_atencion?: string | null;
  creado_por?: string;
  created_at?: string;
  updated_at?: string;
};

export type NuevaAtencionInput = {
  documento: string;
  tipo_documento: string;
  nombre_completo: string;
  nacionalidad: string;
  edad: number;
  poblacion: string;
  telefono: string;
  correo: string;
  direccion: string;
  barrio_vereda: string;
  asunto: string;
  tipo_caso: TipoCaso;
  hora_ingreso: string;
  asignado_a: string;
};

export type Tipificaciones = {
  tipo_documento: string[];
  nacionalidad: string[];
  poblacion: string[];
  asunto: string[];
  tipo_caso: TipoCaso[];
  estado: Estado[];
  barrio_vereda: string[];
};