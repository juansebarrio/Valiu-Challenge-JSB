// src/state/estado.ts — estado en memoria del prototipo y su reducer, puro y determinista.
// Recargar reinicia el escenario; /tablero/alta construye cada frame aplicando acciones sobre el estado inicial.
import type { Centavos, TdcMicro } from '@/lib/dinero';
import { leerCentavos } from '@/lib/dinero';
import { cotizar, deducir, ejecutable, esFinDeSemana, fechasLiquidacion, mismoDia, siguienteHabil, tdcDe, type Divisa, type TablaPares } from '@/lib/fx';
import { neto } from '@/lib/posicion';
import * as fmt from '@/lib/format';
import { AGENDAR_DIAS, HOY, DURACION_PRECIO_S, MOTIVOS, TOKEN_INCORRECTO, datosEscenario, type ArquetipoId, type CuentaId, type Datos, type EscenarioNombre, type PagoFuturo } from '@/data/escenario';
import { arquetipoDe } from '@/data/arquetipos';
import { claseDe, cuentaPorId, cuentasActuales, finDeSemana, motivoPorDefecto, movimientoDe, opcionesDelCobro, ordenDePago, pagoPorDefectoDelCobro, posicionesPorDivisa } from './derivados';

export type Pestana = 'posicion' | 'operar';
export type PasoPanel = 'pago' | 'destino' | 'origen' | 'revision' | 'precio' | 'confirmacion' | 'cancelar';
export type Precio = { estado: 'indicativo' } | { estado: 'fijo'; tdc: TdcMicro; venceEn: number } | { estado: 'vencido'; tdc: TdcMicro };

export interface Destino {
  tipo: 'tercero' | 'propia';
  id: string;
  nombre: string;
  divisa: Divisa;
  banco: string;
  mascara: string;
  cuentaId?: CuentaId;
}

export interface Orden {
  destino: Destino;
  pagoId?: string;
  vence?: Date;
  /** Monto del lado fijo, en la divisa de ese lado. */
  monto: Centavos;
  ladoFijo: 'recibe' | 'pagas';
  /** Con factura, el monto no se edita. */
  conFactura: boolean;
  motivo: string | null;
  referencia: string;
}

/** Pago que se agenda desde el "+" de Movimientos: destino → datos → confirmación. */
export interface Agenda {
  destino: Destino | null;
  montoTexto: string;
  fecha: Date | null;
  motivo: string | null;
  referencia: string;
  /** Id del pago creado al confirmar. */
  creado: string | null;
}

export interface Panel {
  abierto: boolean;
  /** pago: flujo principal · depositar: CLABE · detalle: una fila de Movimientos · agendar: pago nuevo. */
  tipo: 'pago' | 'depositar' | 'detalle' | 'agendar';
  paso: PasoPanel;
  /** Fila de Movimientos abierta en el detalle (id del pago cargado, de la operación o del realizado). */
  movimientoId: string | null;
  /** Cancelación de una pactada en curso ("Cancelando…"). */
  cancelando: boolean;
  agenda: Agenda;
  /** Cobro de hoy desde el que se entró ("Usar para pagar"): el origen preseleccionado es la cuenta donde entró. */
  cobroId: string | null;
  /** Pago elegido en el paso "¿Qué pagas con este cobro?". */
  pagoElegidoId: string | null;
  orden: Orden | null;
  origenId: CuentaId | null;
  fechaValor: Date;
  precio: Precio;
  token: string;
  tokenError: string | null;
  confirmando: boolean;
  busquedaDestino: string;
}

export type Clase = 'pago' | 'compra' | 'venta' | 'transferencia';

export interface OperacionHecha {
  id: string;
  via: 'panel' | 'clasico';
  clase: Clase;
  destino: Destino;
  pagoId?: string;
  origenId: CuentaId;
  /** Lo que sale (o saldrá) de la cuenta de origen, en su divisa. */
  pagas: Centavos;
  /** Lo que llega al destino, en su divisa. */
  recibe: Centavos;
  tdc: TdcMicro | null;
  fechaValor: Date;
  estado: 'En proceso' | 'Pactada' | 'Cancelada';
  motivo: string | null;
  referencia: string;
  hora: string;
  /** Hora en que se canceló la pactada. */
  cancelada?: string;
}

export type TipoOperar = 'comprar' | 'vender' | 'transferir';

export interface Operar {
  tipo: TipoOperar;
  par: string;
  parAbierto: boolean;
  montoIzq: string;
  montoDer: string;
  ladoActivo: 'izq' | 'der' | null;
  editando: 'izq' | 'der' | null;
  origenId: CuentaId | null;
  origenAbierto: boolean;
  destinoId: string | null;
  destinoAbierto: boolean;
  destinoBusqueda: string;
  motivo: string | null;
  motivoAbierto: boolean;
  referencia: string;
  precio: Precio;
  conToken: boolean;
  token: string;
  tokenError: string | null;
  confirmando: boolean;
  paso: 'formulario' | 'confirmacion';
  ultima: OperacionHecha | null;
}

export interface Aviso {
  tipo: 'success' | 'info';
  texto: string;
}

export interface EstadoApp {
  /** Empresa de ejemplo elegida en la pantalla inicial. */
  arquetipo: ArquetipoId;
  escenario: EscenarioNombre;
  datos: Datos;
  pestana: Pestana;
  panel: Panel;
  operar: Operar;
  onboarding: { activo: boolean; paso: number };
  operaciones: OperacionHecha[];
  aviso: Aviso | null;
  avisoOperar: Aviso | null;
  /** Indicativo en vivo por par (micro-unidades). */
  tdcVivo: TablaPares;
  /** Valores base del arquetipo alrededor de los que oscila el indicativo. */
  tdcBase: TablaPares;
  congelado: boolean;
  /** Tecla P: pausa el indicativo en vivo y la cuenta regresiva (demo). */
  pausado: boolean;
  demo: boolean;
  toast: { id: number; texto: string } | null;
  verTodosLosPagos: boolean;
}

export const ONBOARDING_PASOS = 4;
export const VENCE_EN_DEMO = 5;

const AGENDA_VACIA: Agenda = { destino: null, montoTexto: '', fecha: null, motivo: null, referencia: '', creado: null };
const PANEL_CERRADO: Panel = { abierto: false, tipo: 'pago', paso: 'origen', movimientoId: null, cancelando: false, agenda: AGENDA_VACIA, cobroId: null, pagoElegidoId: null, orden: null, origenId: null, fechaValor: HOY, precio: { estado: 'indicativo' }, token: '', tokenError: null, confirmando: false, busquedaDestino: '' };

export const OPERAR_INICIAL: Operar = {
  tipo: 'comprar', par: 'USD/MXN', parAbierto: false, montoIzq: '', montoDer: '', ladoActivo: null, editando: null,
  origenId: null, origenAbierto: false, destinoId: null, destinoAbierto: false, destinoBusqueda: '',
  motivo: null, motivoAbierto: false, referencia: '', precio: { estado: 'indicativo' }, conToken: false, token: '', tokenError: null, confirmando: false,
  paso: 'formulario', ultima: null,
};

export interface OpcionesInicio {
  congelado?: boolean;
  demo?: boolean;
  /** El recorrido aparece al entrar por primera vez en el escenario base. */
  recorrido?: boolean;
}

export function estadoInicial(escenario: EscenarioNombre = 'faltante', opciones: OpcionesInicio = {}, arquetipo: ArquetipoId = 'importadora'): EstadoApp {
  const arq = arquetipoDe(arquetipo);
  return {
    arquetipo,
    escenario,
    datos: datosEscenario(escenario === 'resuelta' || escenario === 'pactada' ? 'faltante' : escenario, arq),
    pestana: 'posicion',
    panel: PANEL_CERRADO,
    operar: OPERAR_INICIAL,
    onboarding: { activo: !!opciones.recorrido && escenario === 'faltante', paso: 0 },
    operaciones: [],
    aviso: null,
    avisoOperar: null,
    tdcVivo: { ...arq.pares },
    tdcBase: arq.pares,
    congelado: !!opciones.congelado,
    pausado: false,
    demo: !!opciones.demo,
    toast: null,
    verTodosLosPagos: false,
  };
}

/** Estado con el que se prerenderiza la página: escenario base, sin recorrido (se decide en el cliente). */
export const ESTADO_INICIAL: EstadoApp = estadoInicial('faltante');

export type Accion =
  | { tipo: 'reiniciar'; estado: EstadoApp }
  | { tipo: 'pestana'; pestana: Pestana }
  | { tipo: 'cerrarAviso' }
  | { tipo: 'cerrarAvisoOperar' }
  | { tipo: 'toast'; texto: string }
  | { tipo: 'cerrarToast' }
  | { tipo: 'verTodosLosPagos'; valor: boolean }
  | { tipo: 'tdcVivo'; pares: TablaPares }
  | { tipo: 'pausar'; valor: boolean }
  | { tipo: 'alternarPausa' }
  | { tipo: 'tick' }
  | { tipo: 'vencerPrecio' }
  // Panel
  | { tipo: 'abrirPanel'; orden: Orden | null; origenId?: CuentaId | null; paso?: PasoPanel }
  | { tipo: 'abrirCobro'; cobroId: string }
  | { tipo: 'elegirPago'; pagoId: string }
  | { tipo: 'continuarPago' }
  | { tipo: 'abrirDepositar' }
  | { tipo: 'cerrarPanel' }
  | { tipo: 'busquedaDestino'; texto: string }
  | { tipo: 'elegirDestino'; destino: Destino; pago?: PagoFuturo }
  | { tipo: 'elegirOrigen'; origenId: CuentaId }
  | { tipo: 'irPaso'; paso: PasoPanel }
  | { tipo: 'fechaValor'; fecha: Date }
  | { tipo: 'monto'; lado: 'recibe' | 'pagas'; valor: Centavos }
  | { tipo: 'motivo'; motivo: string }
  | { tipo: 'referencia'; referencia: string }
  | { tipo: 'pedirPrecio' }
  | { tipo: 'token'; token: string }
  | { tipo: 'confirmar' }
  | { tipo: 'confirmado'; hora: string }
  | { tipo: 'volverInicio' }
  // Detalle de movimiento y cancelación de pactadas
  | { tipo: 'abrirDetalle'; id: string }
  | { tipo: 'cancelarPactada' }
  | { tipo: 'confirmarCancelacion' }
  | { tipo: 'pactadaCancelada'; hora: string }
  // Agendar un pago
  | { tipo: 'abrirAgendar' }
  | { tipo: 'agendaDestino'; destino: Destino }
  | { tipo: 'agendaMonto'; texto: string }
  | { tipo: 'agendaFecha'; fecha: Date | null }
  | { tipo: 'agendaMotivo'; motivo: string }
  | { tipo: 'agendaReferencia'; referencia: string }
  | { tipo: 'agendar' }
  // Onboarding
  | { tipo: 'onboardingIniciar' }
  | { tipo: 'onboardingSiguiente' }
  | { tipo: 'onboardingAtras' }
  | { tipo: 'onboardingCerrar' }
  // Operar clásico
  | { tipo: 'opTipo'; valor: TipoOperar }
  | { tipo: 'opParAbierto'; abierto: boolean }
  | { tipo: 'opPar'; par: string }
  | { tipo: 'opMonto'; lado: 'izq' | 'der'; valor: string }
  | { tipo: 'opMontoEditando'; lado: 'izq' | 'der' | null }
  | { tipo: 'opOrigenAbierto'; abierto: boolean }
  | { tipo: 'opOrigen'; origenId: CuentaId }
  | { tipo: 'opDestinoAbierto'; abierto: boolean }
  | { tipo: 'opDestinoBusqueda'; texto: string }
  | { tipo: 'opDestino'; destinoId: string }
  | { tipo: 'opMotivoAbierto'; abierto: boolean }
  | { tipo: 'opMotivo'; motivo: string }
  | { tipo: 'opReferencia'; referencia: string }
  | { tipo: 'opPedirPrecio' }
  | { tipo: 'opContinuar' }
  | { tipo: 'opToken'; token: string }
  | { tipo: 'opCancelar' }
  | { tipo: 'opConfirmar' }
  | { tipo: 'opConfirmado'; hora: string }
  | { tipo: 'opNueva' };

/** Divisas de la pestaña Operar según el par y el tipo. */
export function divisasOperar(e: Pick<EstadoApp, 'datos'>, op: Operar): { izq: Divisa; der: Divisa; origen: Divisa; destino: Divisa } {
  const [base, cotizada] = op.par.split('/') as [Divisa, Divisa];
  if (op.tipo === 'comprar') return { izq: base, der: cotizada, origen: cotizada, destino: base };
  if (op.tipo === 'vender') return { izq: base, der: cotizada, origen: base, destino: cotizada };
  const d = cuentaPorId(e, op.origenId)?.divisa ?? 'USD';
  return { izq: d, der: d, origen: d, destino: d };
}

/** Lo que hoy sale del origen por la orden del panel (indicativo en vivo o precio fijo). */
export function cotizacionPanel(e: Pick<EstadoApp, 'datos' | 'tdcVivo'>, panel: Panel) {
  const origen = cuentaPorId(e, panel.origenId);
  const orden = panel.orden;
  if (!origen || !orden) return null;
  const tdc = panel.precio.estado === 'fijo' ? panel.precio.tdc : null;
  return cotizar({ origen: origen.divisa, destino: orden.destino.divisa, monto: orden.monto, ladoFijo: orden.ladoFijo, fechaValor: panel.fechaValor, tdc, pares: e.tdcVivo });
}

const aTexto = (c: Centavos | null) => (c != null && c > 0 ? fmt.numero(c) : '');

/** Recalcula el otro lado del monto del clásico con el tipo de cambio que corresponda (indicativo o fijo). */
function recalcular(e: Pick<EstadoApp, 'datos' | 'tdcVivo'>, op: Operar): Operar {
  if (op.tipo === 'transferir') return { ...op, montoDer: op.montoIzq };
  const d = divisasOperar(e, op);
  const deducida = deducir(d.origen, d.destino);
  if (!deducida) return op;
  const tdc = op.precio.estado === 'fijo' ? op.precio.tdc : tdcDe(deducida, e.tdcVivo);
  if (tdc == null) return op;
  if (op.ladoActivo === 'der') {
    const c = leerCentavos(op.montoDer);
    const cot = c != null ? cotizar({ origen: d.origen, destino: d.destino, monto: c, ladoFijo: 'pagas', tdc }) : null;
    return { ...op, montoIzq: aTexto(cot ? (op.tipo === 'comprar' ? cot.recibe : cot.pagas) : null) };
  }
  const c = leerCentavos(op.montoIzq);
  // Comprar: izquierda = lo que recibes (base) · Vender: izquierda = lo que entregas (base)
  const cot = c != null ? cotizar({ origen: d.origen, destino: d.destino, monto: c, ladoFijo: op.tipo === 'comprar' ? 'recibe' : 'pagas', tdc }) : null;
  return { ...op, montoDer: aTexto(cot ? (op.tipo === 'comprar' ? cot.pagas : cot.recibe) : null) };
}

const cerrarSelectores = (op: Operar): Operar => ({ ...op, parAbierto: false, origenAbierto: false, destinoAbierto: false, motivoAbierto: false });
const sinPrecio = (p: Panel): Panel => ({ ...p, precio: { estado: 'indicativo' }, token: '', tokenError: null, confirmando: false });

/** Origen preseleccionado: la cuenta en pesos cuando cubre el pago sin crear otro faltante. */
function origenPorDefecto(e: Pick<EstadoApp, 'datos' | 'operaciones' | 'tdcVivo'>, orden: Orden): CuentaId | null {
  const mxn = cuentasActuales(e).find((c) => c.divisa === 'MXN');
  if (!mxn || mxn.id === orden.destino.cuentaId) return null;
  const cot = cotizar({ origen: 'MXN', destino: orden.destino.divisa, monto: orden.monto, ladoFijo: orden.ladoFijo, pares: e.tdcVivo });
  if (!cot) return null;
  const pos = posicionesPorDivisa(e).MXN;
  const despues = (pos ? neto(pos) : mxn.saldo) - cot.pagas;
  return cot.pagas <= mxn.saldo && despues >= 0 ? mxn.id : null;
}

/** Hoy queda deshabilitado cuando el saldo de hoy no alcanza: la fecha pasa al vencimiento o al primer día hábil siguiente. */
function ajustarFecha(e: Pick<EstadoApp, 'datos' | 'tdcVivo'>, panel: Panel): Panel {
  const origen = cuentaPorId(e, panel.origenId);
  const cot = cotizacionPanel(e, panel);
  if (!origen || !cot || !panel.orden) return panel;
  const hoyNoAlcanza = cot.pagas > origen.saldo;
  if (!hoyNoAlcanza) return panel;
  if (!mismoDia(panel.fechaValor, HOY)) return panel;
  const opciones = fechasLiquidacion(HOY, panel.orden.vence);
  const vence = panel.orden.vence && opciones.find((o) => o.vence);
  return { ...panel, fechaValor: vence ? vence.fecha : siguienteHabil(HOY) };
}

function nuevaOperacion(e: EstadoApp, args: { via: 'panel' | 'clasico'; destino: Destino; pagoId?: string; origenId: CuentaId; pagas: Centavos; recibe: Centavos; tdc: TdcMicro | null; fechaValor: Date; motivo: string | null; referencia: string; hora: string }): OperacionHecha {
  const origen = cuentaPorId(e, args.origenId)!;
  return { id: `op${e.operaciones.length + 1}`, clase: claseDe(origen.divisa, args.destino), estado: mismoDia(args.fechaValor, HOY) ? 'En proceso' : 'Pactada', ...args };
}

/** Aviso del inicio al volver: dice qué pasó y, solo si una divisa pasó de Faltan a Sobran, "Ya te alcanza…". */
export function avisoDe(e: EstadoApp, op: OperacionHecha): Aviso {
  const antes = posicionesPorDivisa({ datos: e.datos, operaciones: e.operaciones.filter((o) => o.id !== op.id) });
  const despues = posicionesPorDivisa(e);
  const resuelta = (Object.keys(despues) as Divisa[]).find((d) => antes[d]?.resultado.tipo === 'faltan' && despues[d]?.resultado.tipo !== 'faltan');
  const alcanza = resuelta ? ` Ya te alcanza para los pagos en ${resuelta} de la semana.` : '';
  const dia = fmt.diaCorto(op.fechaValor);
  const recibe = fmt.monto(op.recibe, op.destino.divisa);
  if (op.estado === 'Pactada') {
    if (op.clase === 'pago') return { tipo: 'info', texto: `${fmt.oracion(`Pactaste el pago a ${op.destino.nombre}`)} El dinero sale el ${dia}.` };
    if (op.clase === 'compra') return { tipo: 'info', texto: `Pactaste la compra de ${recibe}. El dinero sale el ${dia}.` };
    if (op.clase === 'venta') return { tipo: 'info', texto: `Pactaste la venta de ${fmt.monto(op.pagas, cuentaPorId(e, op.origenId)!.divisa)}. El dinero sale el ${dia}.` };
    return { tipo: 'info', texto: `Pactaste el paso de ${recibe} a tu ${op.destino.nombre}. El dinero sale el ${dia}.` };
  }
  if (op.clase === 'pago') return { tipo: 'success', texto: `Pago en proceso.${alcanza}` };
  if (op.clase === 'compra') return { tipo: 'success', texto: `Compraste ${recibe}.${alcanza}` };
  if (op.clase === 'venta') return { tipo: 'success', texto: `Vendiste ${fmt.monto(op.pagas, cuentaPorId(e, op.origenId)!.divisa)}.${alcanza}` };
  return { tipo: 'success', texto: `Pasaste ${recibe} a tu ${op.destino.nombre}.${alcanza}` };
}

/** Aviso del inicio al cancelar una pactada: el pago cargado vuelve a Próximos; una operación a cuenta propia simplemente no sale. */
function avisoCancelacion(e: EstadoApp, op: OperacionHecha): Aviso {
  const recibe = fmt.monto(op.recibe, op.destino.divisa);
  if (op.pagoId) return { tipo: 'info', texto: `${fmt.oracion(`Cancelaste el pago pactado a ${op.destino.nombre}`)} Vuelve a Próximos como pendiente.` };
  if (op.clase === 'compra') return { tipo: 'info', texto: `Cancelaste la compra pactada de ${recibe}. No sale dinero de tu ${cuentaPorId(e, op.origenId)!.nombre}.` };
  if (op.clase === 'venta') return { tipo: 'info', texto: `Cancelaste la venta pactada de ${fmt.monto(op.pagas, cuentaPorId(e, op.origenId)!.divisa)}. No sale dinero de tu ${cuentaPorId(e, op.origenId)!.nombre}.` };
  return { tipo: 'info', texto: `Cancelaste el paso pactado de ${recibe} a tu ${op.destino.nombre}. No sale dinero de tu ${cuentaPorId(e, op.origenId)!.nombre}.` };
}

/** Una cuenta sin saldo en la divisa del pago no se puede elegir: sería una transferencia sin fondos, sin precio que cerrar ni fecha para fondear (D-31). */
export const origenDeshabilitado = (cuenta: { divisa: Divisa; saldo: Centavos }, orden: Orden | null) => !!orden && cuenta.divisa === orden.destino.divisa && orden.destino.tipo === 'tercero' && cuenta.saldo <= 0;

const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Última fecha de vencimiento que acepta "Agendar un pago". */
export const fechaMaximaAgendable = () => { const d = inicioDelDia(HOY); d.setDate(d.getDate() + AGENDAR_DIAS); return d; };

/** Un vencimiento se puede agendar si es un día hábil entre hoy y AGENDAR_DIAS días después. */
export function fechaAgendable(f: Date): 'ok' | 'fin-de-semana' | 'fuera-de-rango' {
  const dia = inicioDelDia(f).getTime();
  if (dia < inicioDelDia(HOY).getTime() || dia > fechaMaximaAgendable().getTime()) return 'fuera-de-rango';
  return esFinDeSemana(f) ? 'fin-de-semana' : 'ok';
}

/** El pago que crearía "Agendar" con lo cargado, o null si falta algo. */
export function pagoAgendado(e: Pick<EstadoApp, 'datos' | 'panel'>): PagoFuturo | null {
  const { destino, montoTexto, fecha, motivo, referencia } = e.panel.agenda;
  const monto = leerCentavos(montoTexto);
  if (!destino || destino.tipo !== 'tercero' || monto == null || monto <= 0 || !fecha || !motivo || fechaAgendable(fecha) !== 'ok') return null;
  const n = e.datos.pagosFuturos.filter((p) => p.id.startsWith('a')).length + 1;
  return {
    id: `a${n}`, destinatarioId: destino.id, destinatario: destino.nombre, monto, divisa: destino.divisa, fecha: inicioDelDia(fecha), referencia: referencia.trim(), motivo,
    cuentaDestino: { divisa: destino.divisa, banco: destino.banco, mascara: destino.mascara },
  };
}

const ERROR_TOKEN = 'El código no coincide. Revisa tu token y vuelve a intentarlo.';

export function reducer(e: EstadoApp, a: Accion): EstadoApp {
  switch (a.tipo) {
    case 'reiniciar':
      return a.estado;
    case 'pestana':
      return { ...e, pestana: a.pestana, operar: cerrarSelectores(e.operar) };
    case 'cerrarAviso':
      return { ...e, aviso: null };
    case 'cerrarAvisoOperar':
      return { ...e, avisoOperar: null };
    case 'toast':
      return { ...e, toast: { id: (e.toast?.id ?? 0) + 1, texto: a.texto } };
    case 'cerrarToast':
      return { ...e, toast: null };
    case 'verTodosLosPagos':
      return { ...e, verTodosLosPagos: a.valor };
    case 'pausar':
      return { ...e, pausado: a.valor };
    case 'alternarPausa':
      return { ...e, pausado: !e.pausado };
    case 'tdcVivo': {
      if (e.congelado || e.pausado) return e;
      const s = { ...e, tdcVivo: a.pares };
      return { ...s, operar: recalcular(s, s.operar) };
    }
    case 'tick': {
      if (e.pausado) return e;
      let s = e;
      if (s.panel.precio.estado === 'fijo') {
        const venceEn = s.panel.precio.venceEn - 1;
        s = { ...s, panel: venceEn <= 0 ? { ...s.panel, precio: { estado: 'vencido', tdc: s.panel.precio.tdc }, token: '', tokenError: null, confirmando: false } : { ...s.panel, precio: { ...s.panel.precio, venceEn } } };
      }
      if (s.operar.precio.estado === 'fijo') {
        const venceEn = s.operar.precio.venceEn - 1;
        const op: Operar = venceEn <= 0 ? { ...s.operar, precio: { estado: 'vencido', tdc: s.operar.precio.tdc }, conToken: false, token: '', tokenError: null, confirmando: false } : { ...s.operar, precio: { ...s.operar.precio, venceEn } };
        s = { ...s, operar: recalcular(s, op) };
      }
      return s;
    }
    case 'vencerPrecio': {
      let s = e;
      if (s.panel.precio.estado === 'fijo') s = { ...s, panel: { ...s.panel, precio: { ...s.panel.precio, venceEn: VENCE_EN_DEMO } } };
      if (s.operar.precio.estado === 'fijo') s = { ...s, operar: { ...s.operar, precio: { ...s.operar.precio, venceEn: VENCE_EN_DEMO } } };
      return s;
    }

    // ---------------------------------------------------------------- Panel
    case 'abrirPanel': {
      const orden = a.orden;
      const origenId = a.origenId !== undefined ? a.origenId : orden ? origenPorDefecto(e, orden) : null;
      const paso: PasoPanel = a.paso ?? (orden ? 'origen' : 'destino');
      const ordenConMotivo = orden ? { ...orden, motivo: orden.motivo ?? motivoPorDefecto(cuentaPorId(e, origenId)?.divisa ?? null, orden) } : null;
      return {
        ...e,
        pestana: 'posicion',
        onboarding: { ...e.onboarding, activo: false },
        operar: cerrarSelectores(e.operar),
        panel: { ...PANEL_CERRADO, abierto: true, tipo: 'pago', paso, orden: ordenConMotivo, origenId },
      };
    }
    case 'abrirCobro': {
      const cobro = e.datos.loNuevo;
      if (!cobro || cobro.id !== a.cobroId) return e;
      if (arquetipoDe(e.arquetipo).entradaCobro === 'destino') {
        // La importadora entra al paso Destino con la cuenta del cobro preseleccionada, exactamente como quedó en el código.
        return reducer(e, { tipo: 'abrirPanel', orden: null, origenId: cobro.cuentaId });
      }
      // Paso "¿Qué pagas con este cobro?" (D-30): el único faltante viene seleccionado.
      return {
        ...e,
        pestana: 'posicion',
        onboarding: { ...e.onboarding, activo: false },
        operar: cerrarSelectores(e.operar),
        panel: { ...PANEL_CERRADO, abierto: true, tipo: 'pago', paso: 'pago', cobroId: cobro.id, pagoElegidoId: pagoPorDefectoDelCobro(e, cobro) },
      };
    }
    case 'elegirPago': {
      if (e.panel.tipo !== 'pago' || e.panel.paso !== 'pago' || !e.datos.loNuevo) return e;
      const valido = opcionesDelCobro(e, e.datos.loNuevo).some((o) => o.pago.id === a.pagoId);
      return valido ? { ...e, panel: { ...e.panel, pagoElegidoId: a.pagoId } } : e;
    }
    case 'continuarPago': {
      const cobro = e.datos.loNuevo;
      const opcion = cobro && e.panel.paso === 'pago' ? opcionesDelCobro(e, cobro).find((o) => o.pago.id === e.panel.pagoElegidoId) : null;
      if (!cobro || !opcion) return e;
      // Sigue el panel de siempre con el pago elegido; el origen preseleccionado es la cuenta donde entró el cobro (D-31).
      const abierto = reducer(e, { tipo: 'abrirPanel', orden: ordenDePago(opcion.pago), origenId: cobro.cuentaId });
      return { ...abierto, panel: { ...abierto.panel, cobroId: cobro.id, pagoElegidoId: opcion.pago.id } };
    }
    case 'abrirDepositar':
      return { ...e, panel: { ...PANEL_CERRADO, abierto: true, tipo: 'depositar', paso: 'origen' } };
    case 'cerrarPanel':
      return { ...e, panel: PANEL_CERRADO };
    case 'busquedaDestino':
      return { ...e, panel: { ...e.panel, busquedaDestino: a.texto } };
    case 'elegirDestino': {
      const orden: Orden = a.pago
        ? ordenDePago(a.pago)
        : { destino: a.destino, monto: 0, ladoFijo: 'recibe', conFactura: false, motivo: null, referencia: '' };
      const origenId = e.panel.origenId && e.panel.origenId !== a.destino.cuentaId ? e.panel.origenId : origenPorDefecto(e, orden);
      const motivo = motivoPorDefecto(cuentaPorId(e, origenId)?.divisa ?? null, orden);
      return { ...e, panel: { ...e.panel, orden: { ...orden, motivo }, origenId, paso: 'origen', busquedaDestino: '' } };
    }
    case 'elegirOrigen': {
      const orden = e.panel.orden;
      const cuenta = cuentaPorId(e, a.origenId);
      if (!cuenta || origenDeshabilitado(cuenta, orden)) return e;
      const motivo = orden && !orden.conFactura ? motivoPorDefecto(cuentaPorId(e, a.origenId)?.divisa ?? null, orden) : orden?.motivo ?? null;
      return { ...e, panel: sinPrecio({ ...e.panel, origenId: a.origenId, fechaValor: HOY, orden: orden ? { ...orden, motivo } : null }) };
    }
    case 'irPaso': {
      let panel: Panel = { ...e.panel, paso: a.paso };
      if (a.paso === 'origen' || a.paso === 'revision' || a.paso === 'destino') panel = sinPrecio(panel);
      if (a.paso === 'revision') panel = ajustarFecha(e, panel);
      return { ...e, panel };
    }
    case 'fechaValor':
      return { ...e, panel: sinPrecio({ ...e.panel, fechaValor: a.fecha }) };
    case 'monto': {
      if (!e.panel.orden || e.panel.orden.conFactura) return e;
      return { ...e, panel: ajustarFecha(e, sinPrecio({ ...e.panel, orden: { ...e.panel.orden, monto: a.valor, ladoFijo: a.lado } })) };
    }
    case 'motivo':
      return e.panel.orden ? { ...e, panel: { ...e.panel, orden: { ...e.panel.orden, motivo: a.motivo } } } : e;
    case 'referencia':
      return e.panel.orden ? { ...e, panel: { ...e.panel, orden: { ...e.panel.orden, referencia: a.referencia } } } : e;
    case 'pedirPrecio': {
      const { orden, origenId } = e.panel;
      const origen = cuentaPorId(e, origenId);
      if (!orden || !origen || e.datos.mercado === 'cerrado') return e;
      const op = deducir(origen.divisa, orden.destino.divisa);
      if (!op) return e;
      const indicativo = tdcDe(op, e.tdcVivo);
      const precio: Precio = indicativo == null || !op.lado ? { estado: 'indicativo' } : { estado: 'fijo', tdc: ejecutable(indicativo, op.lado), venceEn: DURACION_PRECIO_S };
      return { ...e, panel: { ...e.panel, paso: 'precio', precio, token: '', tokenError: null, confirmando: false } };
    }
    case 'token':
      return { ...e, panel: { ...e.panel, token: a.token.replace(/\D/g, '').slice(0, 6), tokenError: null } };
    case 'confirmar':
      return e.panel.token.length === 6 && !e.panel.confirmando ? { ...e, panel: { ...e.panel, confirmando: true, tokenError: null } } : e;
    case 'confirmado': {
      const { orden, origenId, precio, fechaValor, token } = e.panel;
      const origen = cuentaPorId(e, origenId);
      if (!orden || !origen || token.length !== 6) return { ...e, panel: { ...e.panel, confirmando: false } };
      if (token === TOKEN_INCORRECTO) return { ...e, panel: { ...e.panel, confirmando: false, token: '', tokenError: ERROR_TOKEN } };
      const cot = cotizacionPanel(e, e.panel);
      if (!cot) return { ...e, panel: { ...e.panel, confirmando: false } };
      if (cot.tipo !== 'transferencia' && precio.estado !== 'fijo') return { ...e, panel: { ...e.panel, confirmando: false } };
      const hecha = nuevaOperacion(e, { via: 'panel', destino: orden.destino, pagoId: orden.pagoId, origenId: origen.id, pagas: cot.pagas, recibe: cot.recibe, tdc: cot.tdc, fechaValor, motivo: orden.motivo, referencia: orden.referencia, hora: a.hora });
      return { ...e, operaciones: [hecha, ...e.operaciones], panel: { ...e.panel, paso: 'confirmacion', precio: { estado: 'indicativo' }, token: '', tokenError: null, confirmando: false } };
    }
    case 'volverInicio': {
      if (e.panel.tipo === 'agendar') {
        const pago = e.panel.agenda.creado ? pagoPorId(e, e.panel.agenda.creado) : null;
        const aviso: Aviso | null = pago ? { tipo: 'info', texto: `Agendaste el pago a ${pago.destinatario} por ${fmt.monto(pago.monto, pago.divisa)} para el ${fmt.diaCorto(pago.fecha)}.` } : e.aviso;
        return { ...e, panel: PANEL_CERRADO, aviso, pestana: 'posicion' };
      }
      if (e.panel.tipo !== 'pago') return { ...e, panel: PANEL_CERRADO, pestana: 'posicion' };
      const ultima = e.operaciones[0];
      const aviso = ultima && e.panel.paso === 'confirmacion' ? avisoDe(e, ultima) : e.aviso;
      return { ...e, panel: PANEL_CERRADO, aviso, pestana: 'posicion' };
    }

    // ------------------------------------- Detalle de movimiento y cancelación
    case 'abrirDetalle':
      return { ...e, onboarding: { ...e.onboarding, activo: false }, operar: cerrarSelectores(e.operar), panel: { ...PANEL_CERRADO, abierto: true, tipo: 'detalle', paso: 'origen', movimientoId: a.id } };
    case 'cancelarPactada': {
      const mov = e.panel.tipo === 'detalle' && e.panel.movimientoId ? movimientoDe(e, e.panel.movimientoId) : null;
      return mov?.tipo === 'operacion' && mov.op.estado === 'Pactada' ? { ...e, panel: { ...e.panel, paso: 'cancelar', cancelando: false } } : e;
    }
    case 'confirmarCancelacion':
      return e.panel.tipo === 'detalle' && e.panel.paso === 'cancelar' && !e.panel.cancelando ? { ...e, panel: { ...e.panel, cancelando: true } } : e;
    case 'pactadaCancelada': {
      const mov = e.panel.cancelando && e.panel.movimientoId ? movimientoDe(e, e.panel.movimientoId) : null;
      if (mov?.tipo !== 'operacion' || mov.op.estado !== 'Pactada') return { ...e, panel: { ...e.panel, cancelando: false } };
      const operaciones = e.operaciones.map((o) => (o.id === mov.op.id ? { ...o, estado: 'Cancelada' as const, cancelada: a.hora } : o));
      return { ...e, operaciones, panel: PANEL_CERRADO, aviso: avisoCancelacion(e, mov.op), pestana: 'posicion' };
    }

    // ------------------------------------------------------ Agendar un pago
    case 'abrirAgendar':
      return { ...e, onboarding: { ...e.onboarding, activo: false }, operar: cerrarSelectores(e.operar), pestana: 'posicion', panel: { ...PANEL_CERRADO, abierto: true, tipo: 'agendar', paso: 'destino' } };
    case 'agendaDestino':
      return { ...e, panel: { ...e.panel, paso: 'revision', busquedaDestino: '', agenda: { ...e.panel.agenda, destino: a.destino, motivo: e.panel.agenda.motivo ?? MOTIVOS[0] } } };
    case 'agendaMonto':
      return { ...e, panel: { ...e.panel, agenda: { ...e.panel.agenda, montoTexto: a.texto.replace(/[^\d.,]/g, '') } } };
    case 'agendaFecha':
      return { ...e, panel: { ...e.panel, agenda: { ...e.panel.agenda, fecha: a.fecha } } };
    case 'agendaMotivo':
      return { ...e, panel: { ...e.panel, agenda: { ...e.panel.agenda, motivo: a.motivo } } };
    case 'agendaReferencia':
      return { ...e, panel: { ...e.panel, agenda: { ...e.panel.agenda, referencia: a.referencia } } };
    case 'agendar': {
      const pago = e.panel.tipo === 'agendar' ? pagoAgendado(e) : null;
      if (!pago) return e;
      const fueraDeLaSemana = pago.fecha.getTime() > finDeSemana(HOY).getTime();
      return {
        ...e,
        datos: { ...e.datos, pagosFuturos: [...e.datos.pagosFuturos, pago] },
        verTodosLosPagos: e.verTodosLosPagos || fueraDeLaSemana,
        panel: { ...e.panel, paso: 'confirmacion', agenda: { ...e.panel.agenda, creado: pago.id } },
      };
    }

    // ----------------------------------------------------------- Onboarding
    case 'onboardingIniciar':
      return { ...e, onboarding: { activo: true, paso: 0 }, pestana: 'posicion', panel: PANEL_CERRADO };
    case 'onboardingSiguiente':
      return e.onboarding.paso >= ONBOARDING_PASOS - 1 ? { ...e, onboarding: { activo: false, paso: 0 } } : { ...e, onboarding: { activo: true, paso: e.onboarding.paso + 1 } };
    case 'onboardingAtras':
      return { ...e, onboarding: { activo: true, paso: Math.max(0, e.onboarding.paso - 1) } };
    case 'onboardingCerrar':
      return { ...e, onboarding: { activo: false, paso: 0 } };

    // -------------------------------------------------------- Operar clásico
    case 'opTipo':
      if (a.valor === e.operar.tipo) return { ...e, operar: cerrarSelectores(e.operar) };
      return { ...e, operar: { ...OPERAR_INICIAL, tipo: a.valor, par: e.operar.par } };
    case 'opParAbierto':
      return { ...e, operar: { ...cerrarSelectores(e.operar), parAbierto: a.abierto } };
    case 'opPar':
      return { ...e, operar: recalcular(e, { ...cerrarSelectores(e.operar), par: a.par, origenId: null, destinoId: null, precio: { estado: 'indicativo' }, conToken: false, token: '', tokenError: null }) };
    case 'opMonto': {
      const limpio = a.valor.replace(/[^\d.,]/g, '');
      const op: Operar = { ...cerrarSelectores(e.operar), ladoActivo: a.lado, [a.lado === 'izq' ? 'montoIzq' : 'montoDer']: limpio, precio: { estado: 'indicativo' }, conToken: false, token: '', tokenError: null };
      return { ...e, operar: recalcular(e, op) };
    }
    case 'opMontoEditando': {
      if (a.lado) return { ...e, operar: { ...e.operar, editando: a.lado } };
      const op = e.operar;
      const normal = (t: string) => aTexto(leerCentavos(t));
      return { ...e, operar: { ...op, editando: null, montoIzq: normal(op.montoIzq), montoDer: normal(op.montoDer) } };
    }
    case 'opOrigenAbierto':
      return { ...e, operar: { ...cerrarSelectores(e.operar), origenAbierto: a.abierto } };
    case 'opOrigen': {
      const op: Operar = { ...cerrarSelectores(e.operar), origenId: a.origenId, precio: { estado: 'indicativo' }, conToken: false, token: '', tokenError: null };
      if (op.tipo === 'transferir') op.destinoId = null;
      return { ...e, operar: recalcular(e, op) };
    }
    case 'opDestinoAbierto':
      return { ...e, operar: { ...cerrarSelectores(e.operar), destinoAbierto: a.abierto, destinoBusqueda: a.abierto ? e.operar.destinoBusqueda : '' } };
    case 'opDestinoBusqueda':
      return { ...e, operar: { ...e.operar, destinoAbierto: true, destinoBusqueda: a.texto } };
    case 'opDestino':
      return { ...e, operar: { ...cerrarSelectores(e.operar), destinoId: a.destinoId, destinoBusqueda: '', precio: { estado: 'indicativo' }, conToken: false, token: '', tokenError: null } };
    case 'opMotivoAbierto':
      return { ...e, operar: { ...cerrarSelectores(e.operar), motivoAbierto: a.abierto } };
    case 'opMotivo':
      return { ...e, operar: { ...cerrarSelectores(e.operar), motivo: a.motivo } };
    case 'opReferencia':
      return { ...e, operar: { ...e.operar, referencia: a.referencia } };
    case 'opPedirPrecio': {
      const op = e.operar;
      if (op.tipo === 'transferir' || e.datos.mercado === 'cerrado') return e;
      const d = divisasOperar(e, op);
      const deducida = deducir(d.origen, d.destino);
      const indicativo = deducida ? tdcDe(deducida, e.tdcVivo) : null;
      if (!deducida || !deducida.lado || indicativo == null) return e;
      const conPrecio: Operar = { ...cerrarSelectores(op), precio: { estado: 'fijo', tdc: ejecutable(indicativo, deducida.lado), venceEn: DURACION_PRECIO_S }, conToken: true, token: '', tokenError: null, ladoActivo: op.ladoActivo ?? 'izq' };
      return { ...e, operar: recalcular(e, conPrecio) };
    }
    case 'opContinuar':
      return e.operar.tipo === 'transferir' ? { ...e, operar: { ...cerrarSelectores(e.operar), conToken: true, token: '', tokenError: null } } : e;
    case 'opToken':
      return { ...e, operar: { ...e.operar, token: a.token.replace(/\D/g, '').slice(0, 6), tokenError: null } };
    case 'opCancelar':
      return { ...e, operar: { ...OPERAR_INICIAL, tipo: e.operar.tipo, par: e.operar.par } };
    case 'opConfirmar':
      return e.operar.token.length === 6 && !e.operar.confirmando ? { ...e, operar: { ...e.operar, confirmando: true, tokenError: null } } : e;
    case 'opConfirmado': {
      const op = e.operar;
      const origen = cuentaPorId(e, op.origenId);
      if (op.token.length !== 6 || !origen || !op.destinoId) return { ...e, operar: { ...op, confirmando: false } };
      if (op.token === TOKEN_INCORRECTO) return { ...e, operar: { ...op, confirmando: false, token: '', tokenError: ERROR_TOKEN } };
      const d = divisasOperar(e, op);
      const tdc = op.precio.estado === 'fijo' ? op.precio.tdc : null;
      if (op.tipo !== 'transferir' && tdc == null) return { ...e, operar: { ...op, confirmando: false } };
      const propia = e.datos.cuentas.find((c) => c.id === op.destinoId);
      const tercero = e.datos.destinatarios.find((x) => x.id === op.destinoId);
      const destino: Destino = propia
        ? { tipo: 'propia', id: propia.id, nombre: propia.nombre, divisa: propia.divisa, banco: propia.banco, mascara: propia.mascara, cuentaId: propia.id }
        : { tipo: 'tercero', id: op.destinoId, nombre: tercero?.nombre ?? op.destinoId, divisa: d.destino, banco: tercero?.banco ?? '', mascara: tercero?.mascara ?? '' };
      const izq = leerCentavos(op.montoIzq) ?? 0;
      const der = leerCentavos(op.montoDer) ?? 0;
      const pagas = op.tipo === 'comprar' ? der : izq;
      const recibe = op.tipo === 'comprar' ? izq : op.tipo === 'vender' ? der : izq;
      const hecha = nuevaOperacion(e, { via: 'clasico', destino, origenId: origen.id, pagas, recibe, tdc, fechaValor: HOY, motivo: op.motivo, referencia: op.referencia, hora: a.hora });
      return { ...e, operaciones: [hecha, ...e.operaciones], operar: { ...op, confirmando: false, token: '', paso: 'confirmacion', ultima: hecha, precio: { estado: 'indicativo' }, conToken: false } };
    }
    case 'opNueva':
      return { ...e, operar: { ...OPERAR_INICIAL, tipo: e.operar.tipo, par: e.operar.par } };
    default:
      return e;
  }
}

/** Aplica una secuencia de acciones (escenarios, /tablero/alta y tests). */
export const aplicar = (acciones: Accion[], desde: EstadoApp = ESTADO_INICIAL) => acciones.reduce(reducer, desde);

export const pagoPorId = (e: Pick<EstadoApp, 'datos'>, id: string) => e.datos.pagosFuturos.find((p) => p.id === id) ?? null;
