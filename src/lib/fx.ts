// src/lib/fx.ts — deduce tipo de operación, par y lado a partir de origen y destino, y cotiza.
// Sección 5 y Anexo A de la consigna; dinero en centavos y tipo de cambio en micro-unidades (dinero.ts).
import { entreTdc, escalarTdc, porTdc, type Centavos, type TdcMicro } from './dinero';

export type Divisa = 'MXN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
/** Lado del tipo de cambio: si el usuario recibe la divisa base, aplica comprar; si la entrega, vender. */
export type Lado = 'comprar' | 'vender';
export type TipoOperacion = 'transferencia' | 'compra' | 'venta';

export interface Par {
  compra: TdcMicro;
  venta: TdcMicro;
  /** Valor inventado (no viene del brief). */
  ejemplo: boolean;
  /** El par existe en el selector pero no se puede operar en el prototipo. */
  sinPrototipo?: boolean;
}

export type TablaPares = Record<string, Pick<Par, 'compra' | 'venta'>>;

/** El par siempre es BASE/COTIZADA. USD/MXN y EUR/MXN vienen del handoff; EUR/USD cierra con ellos (1.175000 / 1.171000, sección 7 del brief); GBP y CAD solo pueblan el selector. */
export const PARES: Record<string, Par> = {
  'USD/MXN': { compra: 18_091_183, venta: 18_032_135, ejemplo: false },
  'EUR/USD': { compra: 1_175_000, venta: 1_171_000, ejemplo: false },
  'EUR/MXN': { compra: 19_619_888, venta: 19_474_706, ejemplo: false },
  'GBP/MXN': { compra: 24_300_000, venta: 24_100_000, ejemplo: true, sinPrototipo: true },
  'CAD/MXN': { compra: 13_200_000, venta: 13_050_000, ejemplo: true, sinPrototipo: true },
};

export interface Operacion {
  tipo: TipoOperacion;
  par: string | null;
  lado: Lado | null;
  base?: Divisa;
  cotizada?: Divisa;
}

/** Origen y destino definen el par, la operación y el lado. Misma divisa = transferencia. */
export function deducir(origen: Divisa, destino: Divisa): Operacion | null {
  if (!origen || !destino) return null;
  if (origen === destino) return { tipo: 'transferencia', par: null, lado: null };
  const a = `${destino}/${origen}`;
  if (PARES[a]) return { tipo: 'compra', par: a, lado: 'comprar', base: destino, cotizada: origen };
  const b = `${origen}/${destino}`;
  if (PARES[b]) return { tipo: 'venta', par: b, lado: 'vender', base: origen, cotizada: destino };
  return null; // combinación que no existe (ej. GBP → CAD)
}

/** Tipo de cambio de una tabla para la operación deducida (null en transferencias). */
export function tdcDe(op: Operacion, pares: TablaPares = PARES): TdcMicro | null {
  if (!op.par || !op.lado) return null;
  const p = pares[op.par];
  if (!p) return null;
  return op.lado === 'comprar' ? p.compra : p.venta;
}

export interface ParamsCotizar {
  origen: Divisa;
  destino: Divisa;
  /** Monto del lado fijo, en la divisa de ese lado. */
  monto: Centavos;
  /** 'recibe': fija lo que llega al destino · 'pagas': fija lo que sale del origen. */
  ladoFijo: 'recibe' | 'pagas';
  /** Entra como parámetro aunque hoy no cambie el precio: si la API cotiza distinto por fecha, cambia el dato, no la interfaz. */
  fechaValor?: Date;
  /** Tipo de cambio explícito (precio ejecutable fijo). Si falta, sale de `pares`. */
  tdc?: TdcMicro | null;
  /** Tabla de tipos de cambio (el indicativo en vivo). Por defecto, PARES. */
  pares?: TablaPares;
}

export interface Cotizacion extends Operacion {
  tdc: TdcMicro | null;
  pagas: Centavos;
  recibe: Centavos;
}

/** Una sola función para cotizar: calcula el otro lado del monto con el tipo de cambio que corresponde. */
export function cotizar(p: ParamsCotizar): Cotizacion | null {
  const op = deducir(p.origen, p.destino);
  if (!op) return null;
  if (op.tipo === 'transferencia') return { ...op, tdc: null, pagas: p.monto, recibe: p.monto };
  const t = p.tdc ?? tdcDe(op, p.pares);
  if (t == null) return null;
  const baseEsDestino = op.base === p.destino;
  if (p.ladoFijo === 'pagas') return { ...op, tdc: t, pagas: p.monto, recibe: baseEsDestino ? entreTdc(p.monto, t) : porTdc(p.monto, t) };
  return { ...op, tdc: t, recibe: p.monto, pagas: baseEsDestino ? porTdc(p.monto, t) : entreTdc(p.monto, t) };
}

/** Factores del precio ejecutable sobre el indicativo, en diezmillonésimas (handoff: 1.0000681 y 0.9999319). */
export const FACTOR_RECIBE_BASE = 10_000_681;
export const FACTOR_ENTREGA_BASE = 9_999_319;

/** Precio ejecutable: el indicativo del lado que corresponde en el momento de pedir precio, por su factor. */
export function ejecutable(indicativo: TdcMicro, lado: Lado): TdcMicro {
  return escalarTdc(indicativo, lado === 'comprar' ? FACTOR_RECIBE_BASE : FACTOR_ENTREGA_BASE);
}

export interface OpcionFecha {
  fecha: Date;
  etiqueta: string;
  vence: boolean;
}

/** Fecha valor: hoy + los próximos 3 días hábiles, con fechas reales (nunca T+n). Los feriados quedan fuera del alcance. */
export function fechasLiquidacion(hoy: Date, vence?: Date): OpcionFecha[] {
  const out: OpcionFecha[] = [];
  const mismoDia = (a: Date, b?: Date) => !!b && a.toDateString() === b.toDateString();
  const d = new Date(hoy);
  out.push({ fecha: new Date(d), etiqueta: 'Hoy', vence: mismoDia(d, vence) });
  while (out.length < 4) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    out.push({ fecha: new Date(d), etiqueta: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()] + ' ' + d.getDate(), vence: mismoDia(d, vence) });
  }
  return out;
}

export const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const esFinDeSemana = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
/** Primer día hábil después de `d`. */
export function siguienteHabil(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  while (esFinDeSemana(s)) s.setDate(s.getDate() + 1);
  return s;
}
