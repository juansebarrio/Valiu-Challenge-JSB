// src/lib/format.ts — un formato por tipo de dato (D-10).
const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n: number) => String(n).padStart(2, '0');
const d = (x: Date | string) => (x instanceof Date ? x : new Date(x));

/** 1,000,000.00 MXN — sin símbolo, código al final, negativos con "−" (U+2212) */
export const monto = (n: number, div?: string) => (n < 0 ? '−' : '') + nf.format(Math.abs(n)) + (div ? ' ' + div : '');
/** +180,000.00 MXN / −3,000.00 USD */
export const montoSigno = (n: number, div?: string) => (n > 0 ? '+' : n < 0 ? '−' : '') + nf.format(Math.abs(n)) + (div ? ' ' + div : '');
export const numero = (n: number) => nf.format(n);
export const entero = (n: number) => nf0.format(n);
/** 18.091183 — siempre 6 decimales, sin símbolo */
export const tdc = (x: number) => Number(x).toFixed(6);
/** 05 oct 2026 */
export const fecha = (x: Date | string) => { const t = d(x); return pad(t.getDate()) + ' ' + MESES[t.getMonth()] + ' ' + t.getFullYear(); };
/** 05 oct 2026, 07:31 (24 h, hora de CDMX) */
export const fechaHora = (x: Date | string) => { const t = d(x); return fecha(t) + ', ' + pad(t.getHours()) + ':' + pad(t.getMinutes()); };
export const hora = (x: Date | string) => { const t = d(x); return pad(t.getHours()) + ':' + pad(t.getMinutes()); };
/** viernes 9 */
export const diaLargo = (x: Date | string) => { const t = d(x); return DIAS[t.getDay()] + ' ' + t.getDate(); };
/** vie 9 */
export const diaCorto = (x: Date | string) => { const t = d(x); return DIAS3[t.getDay()] + ' ' + t.getDate(); };
/** Hoy / Mañana / Ayer / jueves 8 */
export const diaRelativo = (x: Date | string, hoy: Date | string) => {
  const t = d(x), h = d(hoy);
  const diff = Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
  if (diff === 0) return 'Hoy'; if (diff === 1) return 'Mañana'; if (diff === -1) return 'Ayer';
  return diaLargo(t);
};
/** m:ss para la cuenta regresiva del precio ejecutable */
export const cuentaRegresiva = (segundos: number) => Math.floor(segundos / 60) + ':' + pad(segundos % 60);
