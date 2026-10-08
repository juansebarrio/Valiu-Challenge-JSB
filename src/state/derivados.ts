// src/state/derivados.ts — datos derivados del estado: cuentas, pagos pendientes, posiciones y proyecciones.
// Los usan el reducer (avisos, fecha por defecto) y los selectores de vista.
import type { Centavos } from '@/lib/dinero';
import { monto as fmtMonto, diaCorto } from '@/lib/format';
import { deducir, type Divisa } from '@/lib/fx';
import { diasSemana, evaluarPagoConCobro, posicionesDe, proyeccion, type Movimiento, type PagoEvaluado, type Posicion, type PosicionesCalculadas } from '@/lib/posicion';
import { HOY, type Cobro, type Cuenta, type CuentaId, type Destinatario, type PagoFuturo, type Realizado } from '@/data/escenario';
import type { Destino, EstadoApp, OperacionHecha, Orden } from './estado';

export interface CuentaActual extends Cuenta {
  saldoInicial: Centavos;
}

/** Saldos después de las operaciones que salieron hoy (las pactadas no mueven saldo hasta su fecha). */
export function cuentasActuales(e: Pick<EstadoApp, 'datos' | 'operaciones'>): CuentaActual[] {
  return e.datos.cuentas.map((c) => {
    let saldo = c.saldo;
    for (const op of e.operaciones) {
      if (op.estado !== 'En proceso') continue;
      if (op.origenId === c.id) saldo -= op.pagas;
      if (op.destino.cuentaId === c.id) saldo += op.recibe;
    }
    return { ...c, saldoInicial: c.saldo, saldo };
  });
}

export interface PagoPendiente extends PagoFuturo {
  pactada: OperacionHecha | null;
}

/** Pagos cargados que siguen en Próximos: los que salieron hoy desaparecen; los pactados quedan con su operación. */
export function pagosPendientes(e: Pick<EstadoApp, 'datos' | 'operaciones'>): PagoPendiente[] {
  return e.datos.pagosFuturos
    .map((p) => {
      const op = e.operaciones.find((o) => o.pagoId === p.id) ?? null;
      if (op?.estado === 'En proceso') return null;
      return { ...p, pactada: op };
    })
    .filter((p): p is PagoPendiente => p !== null)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export const pactadas = (e: Pick<EstadoApp, 'operaciones'>) => e.operaciones.filter((o) => o.estado === 'Pactada');

/** Lo que hay detrás de una fila de Movimientos: un pago cargado (pendiente), una operación hecha (en proceso o pactada) o un realizado del escenario. */
export type MovimientoDetalle =
  | { tipo: 'pago'; pago: PagoPendiente }
  | { tipo: 'operacion'; op: OperacionHecha }
  | { tipo: 'realizado'; realizado: Realizado };

/** La fila de un pago pactado lleva el id del pago cargado; la de una operación propia, el id de la operación. */
export function movimientoDe(e: Pick<EstadoApp, 'datos' | 'operaciones'>, id: string): MovimientoDetalle | null {
  const op = e.operaciones.find((o) => o.id === id) ?? e.operaciones.find((o) => o.pagoId === id) ?? null;
  if (op) return { tipo: 'operacion', op };
  const pago = pagosPendientes(e).find((p) => p.id === id);
  if (pago) return { tipo: 'pago', pago };
  const r = e.datos.realizados.find((x) => x.id === id);
  return r ? { tipo: 'realizado', realizado: r } : null;
}

/** Último día (23:59:59) de la semana hábil de HOY: hasta ahí llega "Próximos" sin desplegar el resto. */
export function finDeSemana(hoy: Date): Date {
  const d = new Date(hoy);
  d.setDate(d.getDate() + Math.max(0, 5 - d.getDay()));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}

type ConPosicion = Pick<EstadoApp, 'datos' | 'operaciones' | 'tdcVivo'>;

/**
 * Posición de cada cuenta (C-54, posicionesDe en posicion.ts): saldo + pactadas por recibir − pagos futuros − pagos en otras divisas −
 * pactadas por liquidar. Un pago cargado cuenta contra la cuenta que lo va a pagar; sin cuenta en su divisa, contra la de fondeo, al indicativo de compra.
 */
export function calculoPosiciones(e: ConPosicion): PosicionesCalculadas {
  const pendientes = pagosPendientes(e).filter((p) => !p.pactada);
  const pact = pactadas(e).map((o) => ({ origenId: o.origenId, pagas: o.pagas, destinoCuentaId: o.destino.cuentaId, recibe: o.recibe }));
  return posicionesDe({ cuentas: cuentasActuales(e), pendientes, pactadas: pact, fondeoId: e.datos.cuentaFondeo, pares: e.tdcVivo });
}

export const posiciones = (e: ConPosicion): Record<CuentaId, Posicion> => calculoPosiciones(e).porCuenta as Record<CuentaId, Posicion>;

/** Dónde cuenta hoy un pago cargado pendiente: en su divisa con su monto o, sin cuenta en ella, en la cuenta de fondeo convertido (C-54). */
export function pagoEnPosicion(e: ConPosicion, pago: PagoFuturo): { divisa: Divisa; monto: Centavos; fecha: Date } | null {
  const conv = calculoPosiciones(e).convertidos[pago.id];
  if (!conv) return e.datos.cuentas.some((c) => c.divisa === pago.divisa) ? { divisa: pago.divisa, monto: pago.monto, fecha: pago.fecha } : null;
  return { divisa: cuentaPorId(e, conv.cuentaId as CuentaId)!.divisa, monto: conv.monto, fecha: pago.fecha };
}

export function posicionesPorDivisa(e: ConPosicion): Partial<Record<Divisa, Posicion>> {
  const p = posiciones(e);
  const out: Partial<Record<Divisa, Posicion>> = {};
  for (const c of e.datos.cuentas) out[c.divisa] = p[c.id];
  return out;
}

/** Movimientos fechados de una cuenta: pagos pendientes (salida; los de otras divisas que paga, convertidos), pactadas por liquidar (salida) y por recibir (entrada). */
export function movimientosDe(e: ConPosicion, cuenta: Cuenta): Movimiento[] {
  const { convertidos } = calculoPosiciones(e);
  const pend = pagosPendientes(e).filter((p) => !p.pactada).flatMap((p): Movimiento[] => {
    if (convertidos[p.id]) return convertidos[p.id].cuentaId === cuenta.id ? [{ id: p.id, monto: -convertidos[p.id].monto, divisa: cuenta.divisa, fecha: p.fecha }] : [];
    return p.divisa === cuenta.divisa ? [{ id: p.id, monto: -p.monto, divisa: p.divisa, fecha: p.fecha }] : [];
  });
  const pact = pactadas(e);
  const liquidar = pact.filter((o) => o.origenId === cuenta.id).map((o): Movimiento => ({ id: `${o.id}-sale`, monto: -o.pagas, divisa: cuenta.divisa, fecha: o.fechaValor }));
  const recibir = pact.filter((o) => o.destino.cuentaId === cuenta.id).map((o): Movimiento => ({ id: `${o.id}-entra`, monto: o.recibe, divisa: cuenta.divisa, fecha: o.fechaValor }));
  return [...pend, ...liquidar, ...recibir];
}

export interface Proyeccion {
  serie: Centavos[];
  dias: Date[];
}

/** Proyección de la semana (hoy → vie 9) de las cuentas con pagos pendientes dentro de la semana (los de otras divisas, en la que los paga). */
export function proyecciones(e: ConPosicion): Partial<Record<Divisa, Proyeccion>> {
  const dias = diasSemana(HOY);
  const fin = dias[dias.length - 1].getTime() + 86_400_000;
  const out: Partial<Record<Divisa, Proyeccion>> = {};
  const { convertidos } = calculoPosiciones(e);
  for (const c of cuentasActuales(e)) {
    const movs = movimientosDe(e, c);
    const pendientesSemana = pagosPendientes(e).filter((p) => !p.pactada && p.fecha.getTime() < fin && (convertidos[p.id] ? convertidos[p.id].cuentaId === c.id : p.divisa === c.divisa));
    if (pendientesSemana.length === 0) continue;
    out[c.divisa] = { serie: proyeccion(c.saldo, movs, dias), dias };
  }
  return out;
}

export const cuentaPorId = (e: Pick<EstadoApp, 'datos'>, id: CuentaId | null) => (id ? e.datos.cuentas.find((c) => c.id === id) ?? null : null);

export function destinoDeCuenta(c: Cuenta): Destino {
  return { tipo: 'propia', id: c.id, nombre: c.nombre, divisa: c.divisa, banco: c.banco, mascara: c.mascara, cuentaId: c.id };
}

export function destinoDeDestinatario(d: Destinatario): Destino {
  return { tipo: 'tercero', id: d.id, nombre: d.nombre, divisa: d.divisa, banco: d.banco, mascara: d.mascara };
}

/** Orden a partir de un pago cargado (FilaMovimiento → Pagar). El lado fijo es lo que recibe el destino. */
export function ordenDePago(p: PagoFuturo): Orden {
  return { destino: { tipo: 'tercero', id: p.destinatarioId, nombre: p.destinatario, divisa: p.divisa, banco: p.cuentaDestino.banco, mascara: p.cuentaDestino.mascara }, pagoId: p.id, vence: p.fecha, monto: p.monto, ladoFijo: 'recibe', conFactura: true, motivo: p.motivo, referencia: p.referencia };
}

/** Orden a un destinatario sin pago cargado (sección Destinatarios → "Pagar"): el monto se escribe en la revisión. */
export function ordenADestinatario(d: Destinatario): Orden {
  return { destino: destinoDeDestinatario(d), monto: 0, ladoFijo: 'recibe', conFactura: false, motivo: null, referencia: '' };
}

/** Orden a una cuenta propia (TarjetaPosicion → "Comprar 1,000 USD"): monto fijo del lado que recibes, editable. */
export function ordenACuenta(c: Cuenta, monto: Centavos): Orden {
  // Concepto opcional (brief): sin factura queda vacío; el tipo de operación se deduce de origen y destino al cotizar.
  return { destino: destinoDeCuenta(c), monto, ladoFijo: 'recibe', conFactura: false, motivo: null, referencia: '' };
}

/** Orden sin destino todavía (la ventana de pago arranca en Destino). */
export const ordenVacia = (): Orden | null => null;

/** Clase de la operación para textos: pago a un tercero; compra, venta o transferencia a una cuenta propia. */
export function claseDe(origen: Divisa, destino: Destino): 'pago' | 'compra' | 'venta' | 'transferencia' {
  if (destino.tipo === 'tercero') return 'pago';
  const op = deducir(origen, destino.divisa);
  return op?.tipo === 'compra' ? 'compra' : op?.tipo === 'venta' ? 'venta' : 'transferencia';
}

/**
 * Clase para la comisión (C-50): en la misma divisa es una transferencia, a una cuenta propia o a un tercero (sin tipo de cambio);
 * con tipo de cambio, pago a un tercero o compra o venta entre cuentas propias.
 */
export const claseComision = (origen: Divisa, destino: Pick<Destino, 'tipo' | 'divisa'>): 'pago' | 'compra' | 'venta' | 'transferencia' =>
  origen === destino.divisa ? 'transferencia' : destino.tipo === 'tercero' ? 'pago' : deducir(origen, destino.divisa)?.tipo === 'venta' ? 'venta' : 'compra';

/** Motivo precargado según el caso: factura → Pago a proveedores; cuenta propia → Compra o Venta de divisas. */
/** "Concepto" de la ventana de pago es opcional (brief): viene precargado solo cuando el pago cargado lo trae; sin factura queda vacío. */
export function motivoPorDefecto(_origen: Divisa | null, orden: Orden): string | null {
  return orden.motivo || null;
}

export interface OpcionDelCobro extends PagoEvaluado {
  pago: PagoPendiente;
}

/** Pagos pendientes que se pueden cubrir con el cobro de hoy, evaluados contra él (paso "¿Qué pagas con este cobro?"). */
export function opcionesDelCobro(e: Pick<EstadoApp, 'datos' | 'operaciones' | 'tdcVivo'>, cobro: Cobro): OpcionDelCobro[] {
  const pos = posicionesPorDivisa(e);
  return pagosPendientes(e)
    .filter((p) => !p.pactada)
    .map((pago) => ({ pago, ...evaluarPagoConCobro({ cobro, pago, posiciones: pos, pares: e.tdcVivo, comisionBp: e.datos.comisiones[claseComision(cobro.divisa, { tipo: 'tercero', divisa: pago.divisa })] }) }));
}

/** El pago que viene seleccionado al entrar desde el cobro: el primero (por fecha) que cubre un faltante; si no hay, ninguno. */
export const pagoPorDefectoDelCobro = (e: Pick<EstadoApp, 'datos' | 'operaciones' | 'tdcVivo'>, cobro: Cobro) => opcionesDelCobro(e, cobro).find((o) => o.consecuencia?.tono === 'ok')?.pago.id ?? null;

export interface Notificacion {
  id: string;
  texto: string;
  /** Fila de Movimientos que abre (detalle), si corresponde. */
  movimientoId: string | null;
  tono: 'info' | 'warn' | 'ok';
}

/** Campana: lo que pasó hoy y lo que vence esta semana, derivado del estado (sin backend). */
export function notificaciones(e: Pick<EstadoApp, 'datos' | 'operaciones' | 'tdcVivo'>): Notificacion[] {
  const out: Notificacion[] = [];
  const cobro = e.datos.loNuevo;
  if (cobro) out.push({ id: `cobro-${cobro.id}`, texto: `Entró el cobro de ${cobro.de}: ${fmtMonto(cobro.monto, cobro.divisa)} (${cobro.hora}).`, movimientoId: cobro.id, tono: 'ok' });
  const pos = posicionesPorDivisa(e);
  const pend = pagosPendientes(e).filter((p) => !p.pactada);
  for (const [divisa, p] of Object.entries(pos)) {
    if (p?.resultado.tipo === 'faltan') {
      const primero = pend.find((x) => x.divisa === divisa);
      out.push({ id: `faltan-${divisa}`, texto: `Faltan ${fmtMonto(p.resultado.monto, divisa)} para los pagos de la semana.`, movimientoId: primero?.id ?? null, tono: 'warn' });
    }
  }
  for (const o of e.operaciones) {
    if (o.estado === 'En proceso') out.push({ id: `op-${o.id}`, texto: `En proceso: ${o.clase === 'pago' ? `pago a ${o.destino.nombre}` : `${o.clase} a tu ${o.destino.nombre}`} por ${fmtMonto(o.recibe, o.destino.divisa)}.`, movimientoId: o.id, tono: 'info' });
    // Aviso de fondeo de la pactada, el mismo de la confirmación y el detalle (C-51).
    if (o.estado === 'Pactada') {
      const origen = e.datos.cuentas.find((c) => c.id === o.origenId)!;
      out.push({ id: `op-${o.id}`, texto: `Ten ${fmtMonto(o.pagas, origen.divisa)} en tu ${origen.nombre} el ${diaCorto(o.fechaValor)}.`, movimientoId: o.pagoId ?? o.id, tono: 'info' });
    }
  }
  const fin = finDeSemana(HOY);
  for (const p of pend.filter((x) => x.fecha.getTime() <= fin.getTime())) out.push({ id: `vence-${p.id}`, texto: `Vence el ${diaCorto(p.fecha)}: ${p.destinatario}, ${fmtMonto(p.monto, p.divisa)}.`, movimientoId: p.id, tono: 'info' });
  return out;
}
