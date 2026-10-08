// src/lib/fx.ts — deduce tipo de operación, par y lado a partir de origen y destino, y cotiza.
// Sección 5 y Anexo A de la consigna; dinero en centavos y tipo de cambio en micro-unidades (dinero.ts).
import { aUnidad, entreTdc, escalarTdc, porBp, porTdc, sinBp, type Centavos, type TdcMicro } from './dinero';

export type Divisa = 'MXN' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY';
/** Lado del tipo de cambio: si el usuario recibe la divisa base, aplica comprar; si la entrega, vender. */
export type Lado = 'comprar' | 'vender';
export type TipoOperacion = 'transferencia' | 'compra' | 'venta';

export interface Par {
  compra: TdcMicro;
  venta: TdcMicro;
  /** Valor inventado (no viene del brief). */
  ejemplo: boolean;
}

export type TablaPares = Record<string, Pick<Par, 'compra' | 'venta'>>;

/**
 * El par siempre es BASE/COTIZADA. USD/MXN viene del handoff; EUR/MXN 21.250000 / 21.100000 y EUR/USD 1.175000 / 1.171000 cierran con él:
 * ninguna vuelta MXN → USD → EUR → MXN (ni la inversa) termina con más de lo que empezó (C-45). Una sola tabla para los dos arquetipos;
 * el EUR/MXN 19.619888 / 19.474706 del handoff de la importadora no cerraba (19.474706 / 18.091183 = 1.0765 USD por EUR contra 1.171 directo).
 * GBP/MXN y CAD/MXN son inventados y se operan como los demás (C-53, C-54); JPY/MXN también (C-57).
 */
export const PARES: Record<string, Par> = {
  'USD/MXN': { compra: 18_091_183, venta: 18_032_135, ejemplo: false },
  'EUR/USD': { compra: 1_175_000, venta: 1_171_000, ejemplo: false },
  'EUR/MXN': { compra: 21_250_000, venta: 21_100_000, ejemplo: false },
  'GBP/MXN': { compra: 24_300_000, venta: 24_100_000, ejemplo: true },
  'CAD/MXN': { compra: 13_200_000, venta: 13_050_000, ejemplo: true },
  'JPY/MXN': { compra: 122_500, venta: 121_500, ejemplo: true },
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

/** Unidad en la que se lee un tipo de cambio: "MXN por USD" para USD/MXN, "USD por EUR" para EUR/USD (C-42). */
export function unidadTdc(par: string | null): string {
  if (!par) return '';
  const [base, cotizada] = par.split('/');
  return `${cotizada} por ${base}`;
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
  /** Comisión en puntos básicos (100 = 1 %), sobre lo que sale: Pagas = lo que recibe el destino al precio × (1 + tasa) (C-50). */
  comisionBp?: number;
}

export interface Cotizacion extends Operacion {
  tdc: TdcMicro | null;
  /** Lo que sale del origen, con la comisión incluida. */
  pagas: Centavos;
  recibe: Centavos;
  /** Comisión en la divisa de origen (parte de `pagas`). */
  comision: Centavos;
  comisionBp: number;
}

/**
 * Una sola función para cotizar: calcula el otro lado del monto con el tipo de cambio que corresponde y la comisión (C-50).
 * Pagas = lo que recibe el destino convertido al precio × (1 + tasa), half-up a centavos; con tasa 0 ningún número cambia.
 * Si el lado fijo es "pagas", la comisión sale de ese monto y el resto se convierte. En una divisa sin decimales (JPY) el monto
 * calculado va a unidades enteras, half-up (C-57).
 */
export function cotizar(p: ParamsCotizar): Cotizacion | null {
  const op = deducir(p.origen, p.destino);
  if (!op) return null;
  const bp = p.comisionBp ?? 0;
  let t: TdcMicro | null = null;
  if (op.tipo !== 'transferencia') {
    t = p.tdc ?? tdcDe(op, p.pares);
    if (t == null) return null;
  }
  const baseEsDestino = op.base === p.destino;
  // Sin tipo de cambio (transferencia) el monto pasa igual; con tipo de cambio, se multiplica o divide según qué lado es la base.
  const aOrigen = (recibe: Centavos) => (t == null ? recibe : baseEsDestino ? porTdc(recibe, t) : entreTdc(recibe, t));
  const aDestino = (sale: Centavos) => (t == null ? sale : baseEsDestino ? entreTdc(sale, t) : porTdc(sale, t));
  if (p.ladoFijo === 'pagas') {
    const sinComision = aUnidad(sinBp(p.monto, bp), p.origen);
    return { ...op, tdc: t, pagas: p.monto, recibe: aUnidad(aDestino(sinComision), p.destino), comision: p.monto - sinComision, comisionBp: bp };
  }
  const base = aUnidad(aOrigen(p.monto), p.origen);
  const comision = aUnidad(porBp(base, bp), p.origen);
  return { ...op, tdc: t, recibe: p.monto, pagas: base + comision, comision, comisionBp: bp };
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
