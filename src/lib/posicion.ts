// src/lib/posicion.ts — posición por divisa, proyección de la semana y consecuencia de cada origen.
import { cotizar, type Divisa } from './fx';
import * as fmt from './format';

export interface PagoPendiente {
  id: string;
  monto: number;
  divisa: Divisa;
  fecha: Date;
}

export interface Agregado {
  cantidad: number;
  total: number;
}

export interface Resultado {
  tipo: 'faltan' | 'sobran' | 'nada';
  monto: number;
}

export interface Posicion {
  divisa: Divisa;
  saldo: number;
  pactadas: Agregado | null;
  pagosFuturos: Agregado;
  resultado: Resultado;
}

const finDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const esFinDeSemana = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Días hábiles desde hoy hasta el viernes de la semana; mínimo 4 puntos para la gráfica. */
export function diasSemana(hoy: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  for (;;) {
    if (!esFinDeSemana(d)) out.push(new Date(d));
    if (d.getDay() >= 5 || d.getDay() === 0) break;
    d.setDate(d.getDate() + 1);
  }
  while (out.length < 4) {
    d.setDate(d.getDate() + 1);
    if (!esFinDeSemana(d)) out.push(new Date(d));
  }
  return out;
}

/** Proyección escalonada: el saldo se mantiene hasta el día del pago y cae ese día. */
export function proyeccion(saldo: number, pagos: PagoPendiente[], dias: Date[]): number[] {
  return dias.map((dia) => {
    const limite = finDelDia(dia).getTime();
    return pagos.filter((p) => p.fecha.getTime() <= limite).reduce((acc, p) => acc - p.monto, saldo);
  });
}

/** Índice del primer día en que la proyección cruza por debajo de cero, o −1. */
export const diaDeCruce = (serie: number[]) => serie.findIndex((v) => v < 0);

export function agregar(pagos: PagoPendiente[]): Agregado {
  return { cantidad: pagos.length, total: pagos.reduce((a, p) => a + p.monto, 0) };
}

export function resultado(saldo: number, pagosFuturos: Agregado, pactadas: Agregado | null): Resultado {
  if (pagosFuturos.cantidad === 0 && !pactadas) return { tipo: 'nada', monto: 0 };
  const neto = saldo - pagosFuturos.total - (pactadas?.total ?? 0);
  return neto < 0 ? { tipo: 'faltan', monto: -neto } : { tipo: 'sobran', monto: neto };
}

export function posicion(divisa: Divisa, saldo: number, pagosFuturos: Agregado, pactadas: Agregado | null = null): Posicion {
  return { divisa, saldo, pactadas, pagosFuturos, resultado: resultado(saldo, pagosFuturos, pactadas) };
}

export type Tono = 'ok' | 'warn' | 'neutro';

export interface Consecuencia {
  texto: string;
  tono: Tono;
  /** Se puede elegir igual: el precio se cierra hoy y se fondea antes del día elegido. */
  hoyNoAlcanza: boolean;
  ayuda?: string;
}

export interface OrigenEvaluado {
  /** Lo que sale de la cuenta en su divisa (null si no hay par para cotizar). */
  pagas: number | null;
  /** Texto "Pagas ≈ 27,136.77 MXN" o "Pagas 1,500.00 USD, sin tipo de cambio". */
  pagasTexto: string;
  consecuencia: Consecuencia;
}

const NOMBRES: Record<Divisa, string> = { MXN: 'pesos', USD: 'dólares', EUR: 'euros', GBP: 'libras', CAD: 'dólares canadienses' };
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Evalúa una cuenta de origen para pagar `monto` en `divisaPago`.
 * Reglas (docs/componentes.md · OpcionOrigen y hoja de estados):
 *  1. Si hoy el saldo no cubre lo que sale → Warning "Hoy no alcanza" (se puede elegir igual).
 *  2. Misma divisa: la posición ya incluye el pago; si falta → Warning con el día en que cruza.
 *  3. Otra divisa: sin pagos pendientes en el origen → Neutral; si cubre el faltante de la divisa del
 *     pago → Success "Cubre el faltante en USD"; si al origen le sigue alcanzando → Success; si no → Warning.
 */
export function evaluarOrigen(args: {
  origen: { divisa: Divisa; saldo: number };
  monto: number;
  divisaPago: Divisa;
  posiciones: Partial<Record<Divisa, Posicion>>;
  proyeccionPago?: { serie: number[]; dias: Date[] };
}): OrigenEvaluado {
  const { origen, monto, divisaPago, posiciones, proyeccionPago } = args;
  const mismaDivisa = origen.divisa === divisaPago;
  const cot = cotizar(origen.divisa, divisaPago, monto, 'destino');
  const pagas = cot ? cot.pagas : null;
  const pagasTexto = mismaDivisa
    ? `Pagas ${fmt.monto(monto, divisaPago)}, sin tipo de cambio`
    : pagas == null
      ? 'Sin tipo de cambio para este par'
      : `Pagas ≈ ${fmt.monto(pagas, origen.divisa)}`;

  const posOrigen = posiciones[origen.divisa];
  const posPago = posiciones[divisaPago];
  const con = NOMBRES[origen.divisa];

  let consecuencia: Consecuencia;
  if (pagas != null && pagas > origen.saldo) {
    consecuencia = { texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true, ayuda: 'Puedes cerrar el precio y fondear antes del día que elijas.' };
  } else if (mismaDivisa) {
    if (posOrigen?.resultado.tipo === 'faltan') {
      const cruce = proyeccionPago ? diaDeCruce(proyeccionPago.serie) : -1;
      const dia = cruce >= 0 ? ` el ${DIAS[proyeccionPago!.dias[cruce].getDay()]}` : '';
      consecuencia = { texto: `Te faltarían ${fmt.monto(posOrigen.resultado.monto, origen.divisa)}${dia}`, tono: 'warn', hoyNoAlcanza: false };
    } else {
      consecuencia = { texto: `Te alcanza para los pagos en ${con}`, tono: 'ok', hoyNoAlcanza: false };
    }
  } else if (!posOrigen || posOrigen.pagosFuturos.cantidad === 0) {
    consecuencia = { texto: `Sin pagos pendientes en ${con}`, tono: 'neutro', hoyNoAlcanza: false };
  } else if (posPago?.resultado.tipo === 'faltan' && posPago.resultado.monto - monto <= 0) {
    consecuencia = { texto: `Cubre el faltante en ${divisaPago}`, tono: 'ok', hoyNoAlcanza: false };
  } else if (pagas != null && posOrigen.resultado.tipo !== 'faltan' && posOrigen.resultado.monto - pagas >= 0) {
    consecuencia = { texto: `Te sigue alcanzando para los pagos en ${con}`, tono: 'ok', hoyNoAlcanza: false };
  } else {
    const falta = pagas == null ? 0 : Math.abs(posOrigen.resultado.monto * (posOrigen.resultado.tipo === 'faltan' ? -1 : 1) - pagas);
    consecuencia = { texto: `Te faltarían ${fmt.monto(falta, origen.divisa)} para los pagos en ${con}`, tono: 'warn', hoyNoAlcanza: false };
  }
  return { pagas, pagasTexto, consecuencia };
}

/** Precio ejecutable a partir del indicativo: mismo spread que el escenario (18.092415 − 18.091183). */
export const SPREAD_EJECUTABLE = 18.092415 - 18.091183;
export function ejecutable(indicativo: number, punta: 'compra' | 'venta'): number {
  const x = punta === 'compra' ? indicativo + SPREAD_EJECUTABLE : indicativo - SPREAD_EJECUTABLE;
  return Number(x.toFixed(6));
}
