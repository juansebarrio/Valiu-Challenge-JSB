// src/lib/format.ts — un formato por tipo de dato (D-10). Montos en centavos, tipo de cambio en micro-unidades.
import type { Centavos, TdcMicro } from './dinero';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const pad = (n: number) => String(n).padStart(2, '0');
const d = (x: Date | string) => (x instanceof Date ? x : new Date(x));
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 1,000,000.00 — coma de miles, punto decimal, sin símbolo (centavos → texto). */
export const numero = (c: Centavos) => {
  const abs = Math.abs(Math.round(c));
  return `${miles(Math.floor(abs / 100))}.${pad(abs % 100)}`;
};
/** 1,000,000.00 MXN — código al final, negativos con "−" (U+2212). */
export const monto = (c: Centavos, div?: string) => (c < 0 ? '−' : '') + numero(c) + (div ? ' ' + div : '');
/** +180,000.00 MXN / −3,000.00 USD */
export const montoSigno = (c: Centavos, div?: string) => (c > 0 ? '+' : c < 0 ? '−' : '') + numero(c) + (div ? ' ' + div : '');
/** 1,000 — sin decimales cuando el monto es entero; si no, con centavos. */
export const compacto = (c: Centavos) => (c % 100 === 0 ? miles(Math.abs(c) / 100) : numero(c));
/** 18.091183 — siempre 6 decimales, sin símbolo. */
export const tdc = (t: TdcMicro) => {
  const abs = Math.abs(Math.round(t));
  return `${t < 0 ? '−' : ''}${Math.floor(abs / 1_000_000)}.${String(abs % 1_000_000).padStart(6, '0')}`;
};
/** 05 oct 2026 */
export const fecha = (x: Date | string) => { const t = d(x); return `${pad(t.getDate())} ${MESES[t.getMonth()]} ${t.getFullYear()}`; };
/** 05 oct 2026, 07:31 (24 h, hora de CDMX) */
export const fechaHora = (x: Date | string) => { const t = d(x); return `${fecha(t)}, ${pad(t.getHours())}:${pad(t.getMinutes())}`; };
export const hora = (x: Date | string) => { const t = d(x); return `${pad(t.getHours())}:${pad(t.getMinutes())}`; };
/** viernes 9 */
export const diaLargo = (x: Date | string) => { const t = d(x); return `${DIAS[t.getDay()]} ${t.getDate()}`; };
/** vie 9 */
export const diaCorto = (x: Date | string) => { const t = d(x); return `${DIAS3[t.getDay()]} ${t.getDate()}`; };
/** 4 oct */
export const diaMes = (x: Date | string) => { const t = d(x); return `${t.getDate()} ${MESES[t.getMonth()]}`; };
/** martes 6 de octubre */
export const fechaLarga = (x: Date | string) => { const t = d(x); return `${DIAS[t.getDay()]} ${t.getDate()} de ${MESES_LARGO[t.getMonth()]}`; };
/** Hoy / Mañana / Ayer / jueves 8 */
export const diaRelativo = (x: Date | string, hoy: Date | string) => {
  const t = d(x), h = d(hoy);
  const diff = Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return diaLargo(t);
};
/** m:ss para la cuenta regresiva del precio ejecutable */
export const cuentaRegresiva = (segundos: number) => `${Math.floor(segundos / 60)}:${pad(segundos % 60)}`;
/** Termina una oración sin duplicar el punto cuando el nombre ya lo trae ("Shenzhen Parts Co."). */
export const oracion = (texto: string) => (texto.endsWith('.') ? texto : `${texto}.`);
