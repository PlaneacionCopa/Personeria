// Calcula la fecha límite de respuesta sumando días hábiles colombianos
// (sin sábados, domingos ni festivos) a partir de una fecha de inicio.
//
// Incluye el calendario real de festivos de Colombia: fijos, los que se
// trasladan al lunes siguiente por la Ley Emiliani, y los que dependen de
// la fecha de Semana Santa (Domingo de Resurrección).

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Traslada una fecha al lunes siguiente si no cae en lunes (Ley Emiliani).
function nextMonday(d: Date) {
  const dow = d.getDay(); // domingo=0 ... sábado=6
  const diff = (8 - dow) % 7;
  return addDays(d, diff);
}

// Domingo de Resurrección (algoritmo de Meeus/Jones/Butcher).
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const holidaysCache = new Map<number, Set<string>>();

function colombianHolidays(year: number): Set<string> {
  const cached = holidaysCache.get(year);
  if (cached) return cached;

  const dates: Date[] = [];

  // Festivos fijos (no se trasladan)
  dates.push(new Date(year, 0, 1)); // Año Nuevo
  dates.push(new Date(year, 4, 1)); // Día del Trabajo
  dates.push(new Date(year, 6, 20)); // Independencia
  dates.push(new Date(year, 7, 7)); // Batalla de Boyacá
  dates.push(new Date(year, 11, 8)); // Inmaculada Concepción
  dates.push(new Date(year, 11, 25)); // Navidad

  // Festivos que se trasladan al lunes siguiente (Ley Emiliani)
  const emiliani: [number, number][] = [
    [0, 6], // Reyes Magos
    [2, 19], // San José
    [5, 29], // San Pedro y San Pablo
    [7, 15], // Asunción de la Virgen
    [9, 12], // Día de la Raza
    [10, 1], // Todos los Santos
    [10, 11], // Independencia de Cartagena
  ];
  for (const [month, day] of emiliani) {
    dates.push(nextMonday(new Date(year, month, day)));
  }

  // Festivos basados en Semana Santa
  const easter = easterSunday(year);
  dates.push(addDays(easter, -3)); // Jueves Santo
  dates.push(addDays(easter, -2)); // Viernes Santo
  dates.push(nextMonday(addDays(easter, 39))); // Ascensión del Señor
  dates.push(nextMonday(addDays(easter, 60))); // Corpus Christi
  dates.push(nextMonday(addDays(easter, 68))); // Sagrado Corazón de Jesús

  const set = new Set(dates.map(toISODate));
  holidaysCache.set(year, set);
  return set;
}

function isBusinessDay(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false; // domingo o sábado
  return !colombianHolidays(d.getFullYear()).has(toISODate(d));
}

/**
 * Suma `days` días hábiles colombianos a `startDate` (sin contar el propio
 * día de inicio) y devuelve la fecha resultante en formato YYYY-MM-DD.
 */
export function addBusinessDaysColombia(startDate: Date, days: number): string {
  let current = new Date(startDate);
  let counted = 0;

  while (counted < days) {
    current = addDays(current, 1);
    if (isBusinessDay(current)) counted++;
  }

  return toISODate(current);
}

// Colombia no tiene horario de verano: siempre es UTC-5. Estas dos
// funciones devuelven la fecha/hora ACTUAL en Colombia, para no depender
// de la zona horaria que tenga configurada el servidor de base de datos.

export function horaColombiaAhora(): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return fmt.format(new Date());
}

export function fechaColombiaHoy(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}