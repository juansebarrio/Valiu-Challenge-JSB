// src/lib/fx.ts — deduce tipo de operación, par y punta a partir de origen y destino (sección 5 y Anexo A de la consigna).
export type Divisa = 'MXN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
export type TipoOperacion = 'transferencia' | 'compra' | 'venta';
export interface Par { compra: number; venta: number; ejemplo: boolean; nota?: string }
export interface Operacion { tipo: TipoOperacion; par: string | null; punta: 'compra' | 'venta' | null; tdc: number | null; base?: Divisa; cotizada?: Divisa; ejemplo?: boolean }
export interface Cotizacion extends Operacion { pagas: number; recibe: number }

// USD/MXN son los valores del brief; el resto son EJEMPLOS marcados como tales.
export const PARES: Record<string, Par> = {
  'USD/MXN': { compra: 18.091183, venta: 18.032135, ejemplo: false },
  'EUR/MXN': { compra: 21.25, venta: 21.1, ejemplo: true, nota: 'compra dada por el brief; venta inventada' },
  'EUR/USD': { compra: 1.085, venta: 1.079, ejemplo: true, nota: 'compra dada por el brief; venta inventada' },
  'GBP/MXN': { compra: 24.3, venta: 24.1, ejemplo: true },
  'CAD/MXN': { compra: 13.2, venta: 13.05, ejemplo: true },
};

/** Par como base/cotizada. "compra" = el cliente compra la divisa base; "venta" = la vende. */
export function deducir(origen: Divisa, destino: Divisa): Operacion | null {
  if (!origen || !destino) return null;
  if (origen === destino) return { tipo: 'transferencia', par: null, punta: null, tdc: null };
  const a = destino + '/' + origen;
  if (PARES[a]) return { tipo: 'compra', par: a, punta: 'compra', tdc: PARES[a].compra, base: destino, cotizada: origen, ejemplo: PARES[a].ejemplo };
  const b = origen + '/' + destino;
  if (PARES[b]) return { tipo: 'venta', par: b, punta: 'venta', tdc: PARES[b].venta, base: origen, cotizada: destino, ejemplo: PARES[b].ejemplo };
  return null; // combinación que no existe (ej. GBP → CAD)
}

/** Calcula el otro lado del monto. ladoFijo: 'destino' (lo que recibe) | 'origen' (lo que pagas). */
export function cotizar(origen: Divisa, destino: Divisa, monto: number, ladoFijo: 'destino' | 'origen'): Cotizacion | null {
  const op = deducir(origen, destino);
  if (!op) return null;
  if (op.tipo === 'transferencia') return { ...op, pagas: monto, recibe: monto };
  const baseEsDestino = op.base === destino;
  const tdc = op.tdc as number;
  if (ladoFijo === 'origen') return { ...op, pagas: monto, recibe: baseEsDestino ? monto / tdc : monto * tdc };
  return { ...op, recibe: monto, pagas: baseEsDestino ? monto * tdc : monto / tdc };
}

/** Fecha valor: hoy + los próximos 3 días hábiles, con fechas reales (nunca T+n). */
export function fechasLiquidacion(hoy: Date, vence?: Date): { fecha: Date; etiqueta: string; vence: boolean }[] {
  const out: { fecha: Date; etiqueta: string; vence: boolean }[] = [];
  const mismoDia = (a: Date, b?: Date) => !!b && a.toDateString() === b.toDateString();
  const d = new Date(hoy);
  out.push({ fecha: new Date(d), etiqueta: 'Hoy', vence: mismoDia(d, vence) });
  while (out.length < 4) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // TODO: feriados bancarios de México
    out.push({ fecha: new Date(d), etiqueta: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()] + ' ' + d.getDate(), vence: mismoDia(d, vence) });
  }
  return out;
}
