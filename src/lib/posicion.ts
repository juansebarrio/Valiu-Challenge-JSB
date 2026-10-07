// src/lib/posicion.ts — posición por divisa, proyección de la semana y consecuencia de cada cuenta de origen.
import type { Centavos } from './dinero';
import { cotizar, deducir, esFinDeSemana, type Divisa, type TablaPares } from './fx';
import * as fmt from './format';

export interface Movimiento {
  id: string;
  monto: Centavos;
  divisa: Divisa;
  fecha: Date;
}

export interface Agregado {
  cantidad: number;
  total: Centavos;
}

export interface Resultado {
  tipo: 'faltan' | 'sobran' | 'nada';
  monto: Centavos;
}

export interface Posicion {
  divisa: Divisa;
  saldo: Centavos;
  pactadasRecibir: Agregado | null;
  pactadasLiquidar: Agregado | null;
  pagosFuturos: Agregado | null;
  /** Pagos cargados en divisas en las que la empresa no tiene cuenta y que paga esta (la de fondeo), al indicativo de compra (C-54). */
  pagosOtrasDivisas: Agregado | null;
  resultado: Resultado;
  /** Con pagos en otras divisas el resultado se mueve con el precio: lleva "≈" (C-54). */
  aprox: boolean;
}

const finDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

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

/** Saldo proyectado por día: se mantiene hasta la fecha de cada movimiento y cambia ese día (salidas negativas, entradas positivas). */
export function proyeccion(saldo: Centavos, movimientos: Movimiento[], dias: Date[]): Centavos[] {
  return dias.map((dia) => {
    const limite = finDelDia(dia).getTime();
    return movimientos.filter((m) => m.fecha.getTime() <= limite).reduce((acc, m) => acc + m.monto, saldo);
  });
}

/** Índice del primer día en que la proyección cruza por debajo de cero, o −1. */
export const diaDeCruce = (serie: Centavos[]) => serie.findIndex((v) => v < 0);

export function agregar(movs: { monto: Centavos }[]): Agregado | null {
  return movs.length ? { cantidad: movs.length, total: movs.reduce((a, m) => a + m.monto, 0) } : null;
}

/** Posición = saldo + pactadas por recibir − pagos futuros pendientes − pagos en otras divisas − pactadas por liquidar. */
export function resultado(saldo: Centavos, pagosFuturos: Agregado | null, pactadasLiquidar: Agregado | null, pactadasRecibir: Agregado | null, pagosOtrasDivisas: Agregado | null = null): Resultado {
  if (!pagosFuturos && !pactadasLiquidar && !pactadasRecibir && !pagosOtrasDivisas) return { tipo: 'nada', monto: 0 };
  const neto = saldo + (pactadasRecibir?.total ?? 0) - (pagosFuturos?.total ?? 0) - (pagosOtrasDivisas?.total ?? 0) - (pactadasLiquidar?.total ?? 0);
  return neto < 0 ? { tipo: 'faltan', monto: -neto } : { tipo: 'sobran', monto: neto };
}

export function posicion(divisa: Divisa, saldo: Centavos, pagosFuturos: Agregado | null, pactadasLiquidar: Agregado | null = null, pactadasRecibir: Agregado | null = null, pagosOtrasDivisas: Agregado | null = null): Posicion {
  return { divisa, saldo, pactadasRecibir, pactadasLiquidar, pagosFuturos, pagosOtrasDivisas, resultado: resultado(saldo, pagosFuturos, pactadasLiquidar, pactadasRecibir, pagosOtrasDivisas), aprox: !!pagosOtrasDivisas };
}

/**
 * Cuenta que paga un pago cargado (C-54): la de su divisa, si la empresa tiene una (como siempre); si no, la cuenta de fondeo, con tipo de cambio.
 * Si la de fondeo no tiene par con esa divisa, la primera cuenta que sí; null si ningún par conecta la divisa con una cuenta de la empresa.
 */
export function cuentaQuePaga<C extends { id: string; divisa: Divisa }>(divisa: Divisa, cuentas: C[], fondeoId: string): { cuenta: C; convierte: boolean } | null {
  const propia = cuentas.find((c) => c.divisa === divisa);
  if (propia) return { cuenta: propia, convierte: false };
  const fondeo = cuentas.find((c) => c.id === fondeoId);
  const conPar = [...(fondeo ? [fondeo] : []), ...cuentas.filter((c) => c.id !== fondeoId)].find((c) => deducir(c.divisa, divisa) != null);
  return conPar ? { cuenta: conPar, convierte: true } : null;
}

/** Lo que cuesta hoy un pago en la divisa de la cuenta que lo paga: al precio indicativo de compra de su divisa, sin comisión (C-54). */
export const enDivisaDeCuenta = (pago: { monto: Centavos; divisa: Divisa }, divisaCuenta: Divisa, pares: TablaPares): Centavos | null =>
  cotizar({ origen: divisaCuenta, destino: pago.divisa, monto: pago.monto, ladoFijo: 'recibe', pares })?.pagas ?? null;

export interface CuentaParaPosicion { id: string; divisa: Divisa; saldo: Centavos }
export interface PagoParaPosicion { id: string; monto: Centavos; divisa: Divisa; fecha: Date }
export interface PactadaParaPosicion { origenId: string; pagas: Centavos; destinoCuentaId?: string; recibe: Centavos }

export interface PosicionesCalculadas {
  porCuenta: Record<string, Posicion>;
  /** Pagos sin cuenta en su divisa: qué cuenta los paga y cuánto cuestan hoy en su divisa. */
  convertidos: Record<string, { cuentaId: string; monto: Centavos }>;
  /** Pagos que ningún par conecta con una cuenta de la empresa: no entran en la posición. */
  sinPar: string[];
}

/**
 * Posición de cada cuenta (C-54): un pago cargado cuenta contra la cuenta que lo va a pagar. Con cuenta en su divisa, en "Pagos futuros";
 * sin cuenta, en "Pagos en otras divisas" de la cuenta de fondeo, convertido al indicativo de compra (≈). Las pactadas, con su monto exacto.
 */
export function posicionesDe(args: { cuentas: CuentaParaPosicion[]; pendientes: PagoParaPosicion[]; pactadas: PactadaParaPosicion[]; fondeoId: string; pares: TablaPares }): PosicionesCalculadas {
  const { cuentas, pendientes, pactadas, fondeoId, pares } = args;
  const propios = new Map<string, { monto: Centavos }[]>();
  const otras = new Map<string, { monto: Centavos }[]>();
  const convertidos: PosicionesCalculadas['convertidos'] = {};
  const sinPar: string[] = [];
  const sumar = (m: Map<string, { monto: Centavos }[]>, id: string, monto: Centavos) => m.set(id, [...(m.get(id) ?? []), { monto }]);
  for (const p of pendientes) {
    const quien = cuentaQuePaga(p.divisa, cuentas, fondeoId);
    const monto = quien?.convierte ? enDivisaDeCuenta(p, quien.cuenta.divisa, pares) : p.monto;
    if (!quien || monto == null) { sinPar.push(p.id); continue; }
    if (!quien.convierte) { sumar(propios, quien.cuenta.id, p.monto); continue; }
    sumar(otras, quien.cuenta.id, monto);
    convertidos[p.id] = { cuentaId: quien.cuenta.id, monto };
  }
  const porCuenta: Record<string, Posicion> = {};
  for (const c of cuentas) {
    const liquidar = agregar(pactadas.filter((o) => o.origenId === c.id).map((o) => ({ monto: o.pagas })));
    const recibir = agregar(pactadas.filter((o) => o.destinoCuentaId === c.id).map((o) => ({ monto: o.recibe })));
    porCuenta[c.id] = posicion(c.divisa, c.saldo, agregar(propios.get(c.id) ?? []), liquidar, recibir, agregar(otras.get(c.id) ?? []));
  }
  return { porCuenta, convertidos, sinPar };
}

/** Neto de una posición con signo (negativo = faltan). Sin movimientos, el neto es el saldo. */
export const neto = (p: Posicion) => (p.resultado.tipo === 'nada' ? p.saldo : p.resultado.tipo === 'faltan' ? -p.resultado.monto : p.resultado.monto);

export type Tono = 'ok' | 'warn' | 'neutro';

export interface Consecuencia {
  texto: string;
  tono: Tono;
  /** Se puede elegir igual: el precio se cierra hoy y se fondea antes del día elegido. */
  hoyNoAlcanza: boolean;
  ayuda?: string;
}

export interface OrigenEvaluado {
  pagas: Centavos | null;
  pagasTexto: string;
  /** Null cuando la cuenta no cambia la decisión: no lleva chip (C-49). */
  consecuencia: Consecuencia | null;
}

const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Evalúa una cuenta de origen para una operación. Un chip como máximo, y solo si cambia la decisión (C-49):
 *  · si la opción resuelve un faltante → "Cubre el faltante en USD" (ok);
 *  · si lo crea o lo mantiene → "Te faltarían X USD para tus pagos del vie 9" (warn, con el día en que la proyección cruza cero);
 *  · si no cambia nada → sin chip (antes "Te quedan X EUR").
 * Si hoy el saldo no cubre lo que sale, el chip es "Hoy no alcanza" y se puede elegir igual (handoff).
 */
export function evaluarOrigen(args: {
  origen: { divisa: Divisa; saldo: Centavos };
  /** Monto que llega al destino, en su divisa. */
  monto: Centavos;
  divisaDestino: Divisa;
  /** El destino es una cuenta propia: el monto entra a esa posición. */
  destinoPropio: boolean;
  /** Con un pago cargado, el monto ya está en los pagos futuros del destino y sale de ahí al pagarlo. */
  pagoCargado: boolean;
  /**
   * Dónde cuenta hoy el pago cargado (C-54): en la posición de su divisa con su monto o, sin cuenta en esa divisa, en la de la cuenta de fondeo
   * convertido. Por defecto, en la divisa del destino con el monto.
   */
  pagoEn?: { divisa: Divisa; monto: Centavos; fecha: Date } | null;
  posiciones: Partial<Record<Divisa, Posicion>>;
  /** Proyección de la semana por divisa, para fechar el faltante. */
  proyecciones: Partial<Record<Divisa, { serie: Centavos[]; dias: Date[] }>>;
  pares: TablaPares;
  /** Comisión de la operación en puntos básicos (C-50): forma parte de lo que pagas. */
  comisionBp?: number;
}): OrigenEvaluado {
  const { origen, monto, divisaDestino, destinoPropio, pagoCargado, posiciones, proyecciones, pares, comisionBp } = args;
  const pagoEn = args.pagoEn ?? { divisa: divisaDestino, monto, fecha: null };
  const mismaDivisa = origen.divisa === divisaDestino;
  const cot = cotizar({ origen: origen.divisa, destino: divisaDestino, monto, ladoFijo: 'recibe', pares, comisionBp });
  const pagas = cot ? cot.pagas : null;
  const pagasTexto = mismaDivisa
    ? `Pagas ${fmt.monto(pagas ?? monto, divisaDestino)}`
    : pagas == null
      ? 'Sin tipo de cambio para este par'
      : `Pagas ≈ ${fmt.monto(pagas, origen.divisa)}`;

  // Después: el origen pierde lo que paga; el pago cargado deja de contar donde contaba (su divisa o la de fondeo) y una cuenta propia recibe el monto.
  const delta = new Map<Divisa, Centavos>();
  const sumar = (d: Divisa, v: Centavos) => delta.set(d, (delta.get(d) ?? 0) + v);
  sumar(origen.divisa, -(pagas ?? 0));
  if (pagoCargado) sumar(pagoEn.divisa, pagoEn.monto);
  if (destinoPropio) sumar(divisaDestino, monto);
  const antesOrigen = posiciones[origen.divisa] ? neto(posiciones[origen.divisa]!) : 0;
  const despuesOrigen = antesOrigen + (delta.get(origen.divisa) ?? 0);
  // Sin cuenta en la divisa del destino no hay posición que cubrir ni que dejar en faltante.
  const posDestino = posiciones[divisaDestino];
  const antesDestino = posDestino ? neto(posDestino) : null;
  const despuesDestino = antesDestino == null ? null : mismaDivisa ? despuesOrigen : antesDestino + (delta.get(divisaDestino) ?? 0);

  let consecuencia: Consecuencia | null;
  if (pagas != null && pagas > origen.saldo) {
    consecuencia = { texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true, ayuda: 'Puedes cerrar el precio y fondear antes del día que elijas.' };
  } else if (!mismaDivisa && antesDestino != null && despuesDestino != null && antesDestino < 0 && despuesDestino >= 0 && despuesOrigen >= 0) {
    consecuencia = { texto: `Cubre el faltante en ${divisaDestino}`, tono: 'ok', hoyNoAlcanza: false };
  } else if (despuesOrigen < 0 || (despuesDestino != null && despuesDestino < 0)) {
    const divisa = despuesOrigen < 0 ? origen.divisa : divisaDestino;
    const falta = despuesOrigen < 0 ? -despuesOrigen : -(despuesDestino ?? 0);
    const proy = proyecciones[divisa];
    let dia = '';
    if (proy) {
      // Pagar hoy desde el origen: sale hoy lo que pagas; si el pago contaba en esta misma cuenta (fondeo), deja de salir el día de su vencimiento.
      const devuelve = (d: Date) => (pagoCargado && pagoEn.divisa === origen.divisa && pagoEn.fecha && d.getTime() >= pagoEn.fecha.getTime() ? pagoEn.monto : 0);
      const serie = divisa === origen.divisa && !mismaDivisa ? proy.serie.map((v, i) => v - (pagas ?? 0) + devuelve(proy.dias[i])) : proy.serie;
      const i = diaDeCruce(serie);
      if (i >= 0) dia = i === 0 ? ' para tus pagos de hoy' : ` para tus pagos del ${DIAS3[proy.dias[i].getDay()]} ${proy.dias[i].getDate()}`;
    }
    consecuencia = { texto: `Te faltarían ${fmt.monto(falta, divisa)}${dia}`, tono: 'warn', hoyNoAlcanza: false };
  } else {
    consecuencia = null;
  }
  return { pagas, pagasTexto, consecuencia };
}

export interface PagoEvaluado {
  /** Cuánto del cobro usaría este pago, en la divisa del cobro (null si no hay par). */
  usa: Centavos | null;
  /** Hay tipo de cambio de por medio: el monto es ≈. */
  aprox: boolean;
  /** Un chip como máximo y solo si cambia la decisión: ok o warn (C-49); null en los demás casos. */
  consecuencia: { texto: string; tono: Tono } | null;
}

/** Paso "¿Qué pagas con este cobro?" (D-30): cuánto del cobro usa cada pago pendiente y qué cambia en la posición. */
export function evaluarPagoConCobro(args: {
  cobro: { monto: Centavos; divisa: Divisa };
  pago: { monto: Centavos; divisa: Divisa };
  posiciones: Partial<Record<Divisa, Posicion>>;
  pares: TablaPares;
  /** Comisión del pago en puntos básicos (C-50): forma parte de lo que usa del cobro. */
  comisionBp?: number;
}): PagoEvaluado {
  const { cobro, pago, posiciones, pares, comisionBp } = args;
  const mismaDivisa = cobro.divisa === pago.divisa;
  const cot = cotizar({ origen: cobro.divisa, destino: pago.divisa, monto: pago.monto, ladoFijo: 'recibe', pares, comisionBp });
  const usa = cot ? cot.pagas : null;
  // Solo los chips que cambian la decisión (C-49): sin par, en la misma divisa o ya cubierto, no hay chip.
  if (usa == null) return { usa: null, aprox: false, consecuencia: null };
  if (usa > cobro.monto) return { usa, aprox: !mismaDivisa, consecuencia: { texto: `El cobro no alcanza: faltan ${fmt.monto(usa - cobro.monto, cobro.divisa)}`, tono: 'warn' } };
  if (mismaDivisa) return { usa, aprox: false, consecuencia: null };
  if (posiciones[pago.divisa]?.resultado.tipo === 'faltan') return { usa, aprox: true, consecuencia: { texto: `Cubre el faltante en ${pago.divisa}`, tono: 'ok' } };
  return { usa, aprox: true, consecuencia: null };
}
