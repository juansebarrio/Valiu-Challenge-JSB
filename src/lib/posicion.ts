// src/lib/posicion.ts — posición por divisa, proyección de la semana y consecuencia de cada cuenta de origen.
import type { Centavos } from './dinero';
import { cotizar, esFinDeSemana, type Divisa, type TablaPares } from './fx';
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
  resultado: Resultado;
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

/** Posición = saldo + pactadas por recibir − pagos futuros pendientes − pactadas por liquidar. */
export function resultado(saldo: Centavos, pagosFuturos: Agregado | null, pactadasLiquidar: Agregado | null, pactadasRecibir: Agregado | null): Resultado {
  if (!pagosFuturos && !pactadasLiquidar && !pactadasRecibir) return { tipo: 'nada', monto: 0 };
  const neto = saldo + (pactadasRecibir?.total ?? 0) - (pagosFuturos?.total ?? 0) - (pactadasLiquidar?.total ?? 0);
  return neto < 0 ? { tipo: 'faltan', monto: -neto } : { tipo: 'sobran', monto: neto };
}

export function posicion(divisa: Divisa, saldo: Centavos, pagosFuturos: Agregado | null, pactadasLiquidar: Agregado | null = null, pactadasRecibir: Agregado | null = null): Posicion {
  return { divisa, saldo, pactadasRecibir, pactadasLiquidar, pagosFuturos, resultado: resultado(saldo, pagosFuturos, pactadasLiquidar, pactadasRecibir) };
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
  consecuencia: Consecuencia;
}

const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Evalúa una cuenta de origen para una operación. Los chips salen del cálculo de posición:
 *  · si la opción resuelve un faltante → "Cubre el faltante en USD";
 *  · si lo crea o lo mantiene → "Te faltarían X USD el vie 9" (con la fecha en que la proyección cruza cero);
 *  · si no cambia nada → "Te quedan X EUR".
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
  posiciones: Partial<Record<Divisa, Posicion>>;
  /** Proyección de la semana por divisa, para fechar el faltante. */
  proyecciones: Partial<Record<Divisa, { serie: Centavos[]; dias: Date[] }>>;
  pares: TablaPares;
}): OrigenEvaluado {
  const { origen, monto, divisaDestino, destinoPropio, pagoCargado, posiciones, proyecciones, pares } = args;
  const mismaDivisa = origen.divisa === divisaDestino;
  const cot = cotizar({ origen: origen.divisa, destino: divisaDestino, monto, ladoFijo: 'recibe', pares });
  const pagas = cot ? cot.pagas : null;
  const pagasTexto = mismaDivisa
    ? `Pagas ${fmt.monto(monto, divisaDestino)}, sin tipo de cambio`
    : pagas == null
      ? 'Sin tipo de cambio para este par'
      : `Pagas ≈ ${fmt.monto(pagas, origen.divisa)}`;

  const vacio = (p?: Posicion) => (p ? neto(p) : 0);
  const antesOrigen = vacio(posiciones[origen.divisa]);
  const antesDestino = vacio(posiciones[divisaDestino]);
  // Después: el origen pierde lo que paga; el destino deja de tener el pago pendiente (o recibe el monto si es propio).
  let despuesOrigen = antesOrigen - (pagas ?? 0);
  let despuesDestino = antesDestino + (pagoCargado || destinoPropio ? monto : 0);
  if (mismaDivisa) {
    despuesOrigen = antesOrigen - (pagoCargado ? 0 : monto) + (destinoPropio ? monto : 0);
    despuesDestino = despuesOrigen;
  }

  let consecuencia: Consecuencia;
  if (pagas != null && pagas > origen.saldo) {
    consecuencia = { texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true, ayuda: 'Puedes cerrar el precio y fondear antes del día que elijas.' };
  } else if (!mismaDivisa && antesDestino < 0 && despuesDestino >= 0 && despuesOrigen >= 0) {
    consecuencia = { texto: `Cubre el faltante en ${divisaDestino}`, tono: 'ok', hoyNoAlcanza: false };
  } else if (despuesOrigen < 0 || despuesDestino < 0) {
    const divisa = despuesOrigen < 0 ? origen.divisa : divisaDestino;
    const falta = despuesOrigen < 0 ? -despuesOrigen : -despuesDestino;
    const proy = proyecciones[divisa];
    let dia = '';
    if (proy) {
      const serie = divisa === origen.divisa && !mismaDivisa ? proy.serie.map((v) => v - (pagas ?? 0)) : proy.serie;
      const i = diaDeCruce(serie);
      if (i >= 0) dia = i === 0 ? ' hoy' : ` el ${DIAS3[proy.dias[i].getDay()]} ${proy.dias[i].getDate()}`;
    }
    consecuencia = { texto: `Te faltarían ${fmt.monto(falta, divisa)}${dia}`, tono: 'warn', hoyNoAlcanza: false };
  } else {
    consecuencia = { texto: `Te quedan ${fmt.monto(despuesOrigen, origen.divisa)}`, tono: 'neutro', hoyNoAlcanza: false };
  }
  return { pagas, pagasTexto, consecuencia };
}
