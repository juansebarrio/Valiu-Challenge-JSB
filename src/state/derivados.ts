// src/state/derivados.ts — datos derivados del estado: cuentas, pagos pendientes, posiciones y proyecciones.
// Los usan el reducer (avisos, fecha por defecto) y los selectores de vista.
import type { Centavos } from '@/lib/dinero';
import { deducir, type Divisa } from '@/lib/fx';
import { agregar, diasSemana, posicion, proyeccion, type Movimiento, type Posicion } from '@/lib/posicion';
import { HOY, type Cuenta, type CuentaId, type Destinatario, type PagoFuturo, type Realizado } from '@/data/escenario';
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
      const op = e.operaciones.find((o) => o.pagoId === p.id && o.estado !== 'Cancelada') ?? null;
      if (op?.estado === 'En proceso') return null;
      return { ...p, pactada: op };
    })
    .filter((p): p is PagoPendiente => p !== null)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export const pactadas = (e: Pick<EstadoApp, 'operaciones'>) => e.operaciones.filter((o) => o.estado === 'Pactada');

/** Lo que hay detrás de una fila de Movimientos: un pago cargado (pendiente), una operación hecha (en proceso, pactada o cancelada) o un realizado del escenario. */
export type MovimientoDetalle =
  | { tipo: 'pago'; pago: PagoPendiente }
  | { tipo: 'operacion'; op: OperacionHecha }
  | { tipo: 'realizado'; realizado: Realizado };

/** La fila de un pago pactado lleva el id del pago cargado; la de una operación propia o cancelada, el id de la operación. */
export function movimientoDe(e: Pick<EstadoApp, 'datos' | 'operaciones'>, id: string): MovimientoDetalle | null {
  const op = e.operaciones.find((o) => o.id === id) ?? e.operaciones.find((o) => o.pagoId === id && o.estado !== 'Cancelada') ?? null;
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

/** Posición = saldo + pactadas por recibir − pagos futuros pendientes − pactadas por liquidar. */
export function posiciones(e: Pick<EstadoApp, 'datos' | 'operaciones'>): Record<CuentaId, Posicion> {
  const pend = pagosPendientes(e).filter((p) => !p.pactada);
  const pact = pactadas(e);
  const out = {} as Record<CuentaId, Posicion>;
  for (const c of cuentasActuales(e)) {
    const futuros = agregar(pend.filter((p) => p.divisa === c.divisa));
    const liquidar = agregar(pact.filter((o) => o.origenId === c.id).map((o) => ({ monto: o.pagas })));
    const recibir = agregar(pact.filter((o) => o.destino.cuentaId === c.id).map((o) => ({ monto: o.recibe })));
    out[c.id] = posicion(c.divisa, c.saldo, futuros, liquidar, recibir);
  }
  return out;
}

export function posicionesPorDivisa(e: Pick<EstadoApp, 'datos' | 'operaciones'>): Partial<Record<Divisa, Posicion>> {
  const p = posiciones(e);
  const out: Partial<Record<Divisa, Posicion>> = {};
  for (const c of e.datos.cuentas) out[c.divisa] = p[c.id];
  return out;
}

/** Movimientos fechados de una cuenta: pagos pendientes (salida), pactadas por liquidar (salida) y por recibir (entrada). */
export function movimientosDe(e: Pick<EstadoApp, 'datos' | 'operaciones'>, cuenta: Cuenta): Movimiento[] {
  const pend = pagosPendientes(e).filter((p) => !p.pactada && p.divisa === cuenta.divisa).map((p): Movimiento => ({ id: p.id, monto: -p.monto, divisa: p.divisa, fecha: p.fecha }));
  const pact = pactadas(e);
  const liquidar = pact.filter((o) => o.origenId === cuenta.id).map((o): Movimiento => ({ id: `${o.id}-sale`, monto: -o.pagas, divisa: cuenta.divisa, fecha: o.fechaValor }));
  const recibir = pact.filter((o) => o.destino.cuentaId === cuenta.id).map((o): Movimiento => ({ id: `${o.id}-entra`, monto: o.recibe, divisa: cuenta.divisa, fecha: o.fechaValor }));
  return [...pend, ...liquidar, ...recibir];
}

export interface Proyeccion {
  serie: Centavos[];
  dias: Date[];
}

/** Proyección de la semana (hoy → vie 9) de las divisas con pagos pendientes dentro de la semana. */
export function proyecciones(e: Pick<EstadoApp, 'datos' | 'operaciones'>): Partial<Record<Divisa, Proyeccion>> {
  const dias = diasSemana(HOY);
  const fin = dias[dias.length - 1].getTime() + 86_400_000;
  const out: Partial<Record<Divisa, Proyeccion>> = {};
  for (const c of cuentasActuales(e)) {
    const movs = movimientosDe(e, c);
    const pendientesSemana = pagosPendientes(e).filter((p) => !p.pactada && p.divisa === c.divisa && p.fecha.getTime() < fin);
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

/** Orden a una cuenta propia (TarjetaPosicion → "Comprar 1,000 USD"): monto fijo del lado que recibes, editable. */
export function ordenACuenta(c: Cuenta, monto: Centavos, origen?: Divisa): Orden {
  const op = origen ? deducir(origen, c.divisa) : null;
  return { destino: destinoDeCuenta(c), monto, ladoFijo: 'recibe', conFactura: false, motivo: op?.tipo === 'venta' ? 'Venta de divisas' : op?.tipo === 'transferencia' ? 'Transferencia entre cuentas' : 'Compra de divisas', referencia: '' };
}

/** Orden sin destino todavía (el panel arranca en Destino). */
export const ordenVacia = (): Orden | null => null;

/** Clase de la operación para textos: pago a un tercero; compra, venta o transferencia a una cuenta propia. */
export function claseDe(origen: Divisa, destino: Destino): 'pago' | 'compra' | 'venta' | 'transferencia' {
  if (destino.tipo === 'tercero') return 'pago';
  const op = deducir(origen, destino.divisa);
  return op?.tipo === 'compra' ? 'compra' : op?.tipo === 'venta' ? 'venta' : 'transferencia';
}

/** Motivo precargado según el caso: factura → Pago a proveedores; cuenta propia → Compra o Venta de divisas. */
export function motivoPorDefecto(origen: Divisa | null, orden: Orden): string {
  if (orden.destino.tipo === 'tercero') return orden.motivo ?? 'Pago a proveedores';
  if (!origen) return orden.motivo ?? 'Compra de divisas';
  const clase = claseDe(origen, orden.destino);
  return clase === 'venta' ? 'Venta de divisas' : clase === 'transferencia' ? 'Transferencia entre cuentas' : 'Compra de divisas';
}
