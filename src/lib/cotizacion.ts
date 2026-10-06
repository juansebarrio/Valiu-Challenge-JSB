// src/lib/cotizacion.ts — cotizar con un tipo de cambio explícito (indicativo en vivo o ejecutable fijo).
import { deducir, type Divisa, type Operacion } from './fx';

export interface CotizacionCon extends Operacion {
  pagas: number;
  recibe: number;
}

/** Igual que `cotizar` de fx.ts, pero con el tipo de cambio que se le pasa (null = usar el del par). */
export function cotizarCon(origen: Divisa, destino: Divisa, monto: number, ladoFijo: 'destino' | 'origen', tdc: number | null): CotizacionCon | null {
  const op = deducir(origen, destino);
  if (!op) return null;
  if (op.tipo === 'transferencia') return { ...op, pagas: monto, recibe: monto };
  const t = tdc ?? (op.tdc as number);
  const baseEsDestino = op.base === destino;
  const conTdc = { ...op, tdc: t };
  if (ladoFijo === 'origen') return { ...conTdc, pagas: monto, recibe: baseEsDestino ? monto / t : monto * t };
  return { ...conTdc, recibe: monto, pagas: baseEsDestino ? monto * t : monto / t };
}

/** Redondeo a centavos con medio hacia arriba (18,092.415 → 18,092.42), sin el sesgo binario de toFixed. */
export const redondear2 = (n: number) => Math.round(n * 100 + (n >= 0 ? 1e-6 : -1e-6)) / 100;

/** Termina una oración sin duplicar el punto cuando el nombre ya lo trae ("Shenzhen Parts Co."). */
export const oracion = (texto: string) => (texto.endsWith('.') ? texto : `${texto}.`);

export const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
