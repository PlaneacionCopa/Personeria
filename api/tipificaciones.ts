import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowCors, sendJson } from "./_http.js";

// Barrios / veredas: se dejan exactamente igual a como estaban.
const BARRIOS_VEREDAS = [
  "La Veta",
  "Zarzal La Luz",
  "Zarzal Curazao",
  "Ancon",
  "El Noral",
  "El Salado",
  "Sabaneta",
  "Quebrada Arriba",
  "Alvarado",
  "Montañita",
  "Peñolcito",
  "Cabuyal",
  "Granizal",
  "El Convento",
  "Fontidueño",
  "Cristo Rey",
  "Simon Bolivar",
  "Obrero",
  "Yarumito",
  "Las Vegas",
  "Tobon Quintero",
  "La Asunción",
  "La Azulita",
  "El Porvenir",
  "Villanueva",
  "El Recreo",
  "El Remanso",
  "Pedregal",
  "La Misericordia",
  "Machado",
  "San Juan",
  "Maria",
  "Tablazo-Canoas",
  "El Mojon",
  "C. Multiple",
  "Fatima",
  "Pedrera",
  "San Francisco",
  "Miraflores",
  "Horizontes",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (allowCors(req, res, "GET,OPTIONS")) return;

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }

  const data = {
    tipo_documento: [
      "CÉDULA DE CIUDADANÍA",
      "TARJETA DE IDENTIDAD",
      "CÉDULA DE EXTRANJERÍA",
      "PPT",
      "PASAPORTE",
      "REGISTRO CIVIL",
      "OTRO",
    ],

    nacionalidad: ["COLOMBIANA", "VENEZOLANA", "OTRA"],

    // Se conserva la lista amplia de población que ya usaba la app
    // (más completa que el dato libre del Excel, que casi siempre decía "VICTIMA").
    poblacion: [
      "VICTIMA DEL CONFLICTO ARMADO",
      "INFANCIA",
      "JUVENTUD",
      "ADULTEZ",
      "ADULTO MAYOR",
      "DISCAPACIDAD",
      "LGTBIQ+",
      "MCF",
      "MIGRANTE",
      "CAMPESINO",
      "HABITANTE DE CALLE",
      "PPL",
      "COMUNIDADES ETNICAS",
      "NINGUNA",
    ],

    // Consolidado de la columna "ASUNTO" del histórico (378 valores libres
    // agrupados por similitud, tildes y mayúsculas/minúsculas).
    asunto: [
      "ASESORÍA",
      "ASESORÍA FAMILIA",
      "ASESORÍA LABORAL",
      "ASESORÍA INSPECCIÓN",
      "ASESORÍA TUTELA",
      "ASESORÍA VÍCTIMAS",
      "ASESORÍA SALUD",
      "ASESORÍA PENSIONAL",
      "ASESORÍA TRÁNSITO",
      "ASESORÍA COMISARÍA DE FAMILIA",
      "TUTELA",
      "ACCIÓN DE TUTELA",
      "DESACATO",
      "INCIDENTE DE DESACATO",
      "DERECHO DE PETICIÓN",
      "ORIENTACIÓN",
      "ORIENTACIÓN PSICOLÓGICA",
      "ATENCIÓN PSICOLÓGICA",
      "APOYO PSICOSOCIAL",
      "CONCILIACIÓN",
      "DECLARACIÓN DE VÍCTIMAS",
      "AMPARO DE POBREZA",
      "CURSO PEDAGÓGICO",
      "REUNIÓN PERSONERO",
      "REUNIÓN INSTITUCIÓN EDUCATIVA",
      "ACCIÓN POPULAR",
      "OTRO",
    ],

    tipo_caso: ["NUEVO", "SEGUIMIENTO"],

    canal: [
      "PRESENCIAL",
      "TELEFÓNICO",
      "CORREO ELECTRÓNICO",
      "ESCRITO / RADICADO",
      "WHATSAPP",
      "VISITA DOMICILIARIA",
      "OTRO",
    ],

    estado: ["ASIGNADO", "EN_SEGUIMIENTO", "FINALIZADO"],

    barrio_vereda: BARRIOS_VEREDAS,
  };

  return sendJson(res, 200, data);
}