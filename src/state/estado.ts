// src/state/estado.ts — estado mínimo del cliente (README · "Interacciones y estado") y su reducer.
// Es puro y determinista: /tablero construye cada frame aplicando acciones sobre el estado inicial.
import type { Divisa } from '@/lib/fx';
import { PARES, deducir } from '@/lib/fx';
import { cotizarCon, redondear2, mismoDia, oracion } from '@/lib/cotizacion';
import { ejecutable } from '@/lib/posicion';
import { HOY, DURACION_PRECIO_S, BANDA_TDC, cuentas, pagosFuturos, tipoDeCambio, type CuentaId, type CuentaDestino, type PagoFuturo } from '@/data/escenario-importadora';

export type Pestana = 'posicion' | 'operar';
export type PasoPanel = 'destinatario' | 'origen' | 'revision' | 'precio' | 'confirmacion';
export type Precio = { estado: 'indicativo' } | { estado: 'fijo'; tdc: number; venceEn: number } | { estado: 'vencido' };

export interface Orden {
  id: string;
  tipo: 'pago' | 'compra';
  pagoId?: string;
  destinatario: string;
  cuentaDestino: CuentaDestino;
  cuentaDestinoId?: CuentaId;
  monto: number;
  divisa: Divisa;
  vence?: Date;
  referencia: string;
  concepto: string;
}

export interface Panel {
  abierto: boolean;
  paso: PasoPanel;
  orden: Orden | null;
  origenId: CuentaId | null;
  fechaValor: Date;
  precio: Precio;
  token: string;
}

export interface OperacionHecha {
  id: string;
  orden: Orden;
  origenId: CuentaId;
  /** Lo que salió (o saldrá) de la cuenta de origen, en su divisa. */
  pagas: number;
  tdc: number | null;
  fechaValor: Date;
  estado: 'En proceso' | 'Pactada';
  /** Nombre de la fila en Movimientos cuando no es un pago a un destinatario. */
  nombre?: string;
}

export type TipoOperar = 'comprar' | 'vender' | 'transferir';

export interface Operar {
  tipo: TipoOperar;
  par: string;
  parAbierto: boolean;
  montoIzq: string;
  montoDer: string;
  ladoActivo: 'izq' | 'der' | null;
  /** Lado con el foco: muestra el texto tal cual se escribe; al salir se formatea. */
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
  /** Transferencias: el token se pide al continuar. Cambios: aparece con el precio fijo. */
  conToken: boolean;
  token: string;
}

export interface Onboarding {
  activo: boolean;
  paso: number;
}

export interface Aviso {
  tipo: 'success' | 'info';
  texto: string;
}

export interface EstadoApp {
  pestana: Pestana;
  panel: Panel;
  operar: Operar;
  onboarding: Onboarding;
  operaciones: OperacionHecha[];
  aviso: Aviso | null;
  avisoOperar: Aviso | null;
  tdcVivo: { compra: number; venta: number };
  pausado: boolean;
  mercado: 'abierto' | 'cerrado';
}

export const ONBOARDING_PASOS = 4;
/** La cuenta regresiva arranca mostrando 1:59 (frames 04 y 11). */
export const VENCE_EN_INICIAL = DURACION_PRECIO_S - 1;

const PANEL_CERRADO: Panel = { abierto: false, paso: 'origen', orden: null, origenId: null, fechaValor: HOY, precio: { estado: 'indicativo' }, token: '' };

export const OPERAR_INICIAL: Operar = {
  tipo: 'comprar', par: 'USD/MXN', parAbierto: false, montoIzq: '', montoDer: '', ladoActivo: null, editando: null,
  origenId: null, origenAbierto: false, destinoId: null, destinoAbierto: false, destinoBusqueda: '',
  motivo: null, motivoAbierto: false, referencia: '', precio: { estado: 'indicativo' }, conToken: false, token: '',
};

export const ESTADO_INICIAL: EstadoApp = {
  pestana: 'posicion',
  panel: PANEL_CERRADO,
  operar: OPERAR_INICIAL,
  onboarding: { activo: false, paso: 0 },
  operaciones: [],
  aviso: null,
  avisoOperar: null,
  tdcVivo: { compra: tipoDeCambio.compra, venta: tipoDeCambio.venta },
  pausado: false,
  mercado: 'abierto',
};

/** Orden a partir de un pago cargado (FilaMovimiento → Pagar). */
export function ordenDePago(pago: PagoFuturo): Orden {
  return { id: `pago:${pago.id}`, tipo: 'pago', pagoId: pago.id, destinatario: pago.destinatario, cuentaDestino: pago.cuentaDestino, monto: pago.monto, divisa: pago.divisa, vence: pago.fecha, referencia: pago.referencia, concepto: pago.concepto };
}

/** Orden de compra a una cuenta propia (TarjetaPosicion → "Comprar 1,000 USD"). */
export function ordenDeCompra(cuentaId: CuentaId, monto: number): Orden {
  const c = cuentas.find((x) => x.id === cuentaId)!;
  return { id: `compra:${cuentaId}`, tipo: 'compra', destinatario: c.nombre, cuentaDestino: { divisa: c.divisa, banco: c.banco, mascara: c.mascara }, cuentaDestinoId: cuentaId, monto, divisa: c.divisa, referencia: `Cobertura pagos ${c.divisa}`, concepto: 'Compra de divisas' };
}

export type Accion =
  | { tipo: 'pestana'; pestana: Pestana }
  | { tipo: 'cerrarAviso' }
  | { tipo: 'cerrarAvisoOperar' }
  | { tipo: 'tdcVivo'; compra: number; venta: number }
  | { tipo: 'tdcDeriva'; delta: number }
  | { tipo: 'tick' }
  | { tipo: 'pausar' }
  | { tipo: 'mercado'; mercado: 'abierto' | 'cerrado' }
  // Panel
  | { tipo: 'abrirPanel'; orden: Orden | null; origenId?: CuentaId }
  | { tipo: 'cerrarPanel' }
  | { tipo: 'elegirOrden'; orden: Orden }
  | { tipo: 'elegirOrigen'; origenId: CuentaId }
  | { tipo: 'irPaso'; paso: PasoPanel }
  | { tipo: 'fechaValor'; fecha: Date }
  | { tipo: 'concepto'; concepto: string }
  | { tipo: 'referencia'; referencia: string }
  | { tipo: 'pedirPrecio' }
  | { tipo: 'token'; token: string }
  | { tipo: 'confirmar' }
  | { tipo: 'volverInicio' }
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
  | { tipo: 'opConfirmar' };

export const cuentaPorId = (id: CuentaId | null) => (id ? cuentas.find((c) => c.id === id) ?? null : null);

/** Tipo de cambio indicativo para una operación: USD/MXN sale del "en vivo"; el resto, del par. */
export function tdcIndicativo(estado: Pick<EstadoApp, 'tdcVivo'>, origen: Divisa, destino: Divisa): number | null {
  const op = deducir(origen, destino);
  if (!op || !op.punta) return null;
  if (op.par === 'USD/MXN') return estado.tdcVivo[op.punta];
  return op.tdc;
}

export function tdcEjecutable(estado: Pick<EstadoApp, 'tdcVivo'>, origen: Divisa, destino: Divisa): number | null {
  const op = deducir(origen, destino);
  if (!op || !op.punta) return null;
  if (op.par === 'USD/MXN') return op.punta === 'compra' ? tipoDeCambio.ejecutable : ejecutable(tipoDeCambio.venta, 'venta');
  return ejecutable(op.tdc as number, op.punta);
}

const tdcDelPar = (par: string, punta: 'compra' | 'venta') => PARES[par]?.[punta] ?? null;

/** Divisas de la pestaña Operar según el par y el tipo. */
export function divisasOperar(op: Operar): { izq: Divisa; der: Divisa; origen: Divisa; destino: Divisa } {
  const [base, cotizada] = op.par.split('/') as [Divisa, Divisa];
  if (op.tipo === 'comprar') return { izq: base, der: cotizada, origen: cotizada, destino: base };
  if (op.tipo === 'vender') return { izq: base, der: cotizada, origen: base, destino: cotizada };
  const d = (cuentaPorId(op.origenId)?.divisa ?? 'USD') as Divisa;
  return { izq: d, der: d, origen: d, destino: d };
}

const aNumero = (texto: string) => {
  const n = Number(texto.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const aTexto = (n: number) => (n > 0 ? redondear2(n).toFixed(2) : '');

/** Recalcula el otro lado del monto con el tipo de cambio que corresponda (indicativo o fijo). */
function recalcular(estado: EstadoApp, op: Operar): Operar {
  if (op.tipo === 'transferir') return { ...op, montoDer: op.montoIzq };
  const punta: 'compra' | 'venta' = op.tipo === 'comprar' ? 'compra' : 'venta';
  const tdc = op.precio.estado === 'fijo' ? op.precio.tdc : op.par === 'USD/MXN' ? estado.tdcVivo[punta] : tdcDelPar(op.par, punta);
  if (tdc == null) return op;
  if (op.ladoActivo === 'der') return { ...op, montoIzq: aTexto(aNumero(op.montoDer) / tdc) };
  return { ...op, montoDer: aTexto(aNumero(op.montoIzq) * tdc) };
}

function cerrarSelectores(op: Operar): Operar {
  return { ...op, parAbierto: false, origenAbierto: false, destinoAbierto: false, motivoAbierto: false };
}

export function reducer(estado: EstadoApp, a: Accion): EstadoApp {
  switch (a.tipo) {
    case 'pestana':
      return { ...estado, pestana: a.pestana, operar: cerrarSelectores(estado.operar) };
    case 'cerrarAviso':
      return { ...estado, aviso: null };
    case 'cerrarAvisoOperar':
      return { ...estado, avisoOperar: null };
    case 'tdcVivo': {
      const siguiente = { ...estado, tdcVivo: { compra: a.compra, venta: a.venta } };
      return { ...siguiente, operar: recalcular(siguiente, siguiente.operar) };
    }
    case 'tdcDeriva': {
      // Banda chica alrededor del valor del brief; congelado mientras hay un precio fijo.
      if (estado.panel.precio.estado === 'fijo' || estado.operar.precio.estado === 'fijo') return estado;
      const acotar = (base: number, actual: number) => Number(Math.min(base + BANDA_TDC, Math.max(base - BANDA_TDC, actual + a.delta)).toFixed(6));
      const siguiente = { ...estado, tdcVivo: { compra: acotar(tipoDeCambio.compra, estado.tdcVivo.compra), venta: acotar(tipoDeCambio.venta, estado.tdcVivo.venta) } };
      return { ...siguiente, operar: recalcular(siguiente, siguiente.operar) };
    }
    case 'mercado':
      return { ...estado, mercado: a.mercado };
    case 'pausar':
      return { ...estado, pausado: !estado.pausado };
    case 'tick': {
      if (estado.pausado) return estado;
      let s = estado;
      if (s.panel.precio.estado === 'fijo') {
        const venceEn = s.panel.precio.venceEn - 1;
        s = { ...s, panel: { ...s.panel, precio: venceEn <= 0 ? { estado: 'vencido' } : { ...s.panel.precio, venceEn }, token: venceEn <= 0 ? '' : s.panel.token } };
      }
      if (s.operar.precio.estado === 'fijo') {
        const venceEn = s.operar.precio.venceEn - 1;
        const op: Operar = venceEn <= 0 ? { ...s.operar, precio: { estado: 'vencido' }, conToken: false, token: '' } : { ...s.operar, precio: { ...s.operar.precio, venceEn } };
        s = { ...s, operar: recalcular(s, op) };
      }
      return s;
    }

    // ---------------------------------------------------------------- Panel
    case 'abrirPanel':
      return {
        ...estado,
        onboarding: { ...estado.onboarding, activo: false },
        operar: cerrarSelectores(estado.operar),
        panel: { ...PANEL_CERRADO, abierto: true, paso: a.orden ? 'origen' : 'destinatario', orden: a.orden, origenId: a.origenId ?? (a.orden ? 'mxn' : null) },
      };
    case 'cerrarPanel':
      return { ...estado, panel: PANEL_CERRADO };
    case 'elegirOrden':
      return { ...estado, panel: { ...estado.panel, orden: a.orden, paso: 'origen', origenId: 'mxn' } };
    case 'elegirOrigen':
      return { ...estado, panel: { ...estado.panel, origenId: a.origenId, precio: { estado: 'indicativo' }, token: '' } };
    case 'irPaso':
      return { ...estado, panel: { ...estado.panel, paso: a.paso, ...(a.paso === 'origen' || a.paso === 'revision' ? { precio: { estado: 'indicativo' as const }, token: '' } : {}) } };
    case 'fechaValor':
      return { ...estado, panel: { ...estado.panel, fechaValor: a.fecha, precio: { estado: 'indicativo' }, token: '' } };
    case 'concepto':
      return estado.panel.orden ? { ...estado, panel: { ...estado.panel, orden: { ...estado.panel.orden, concepto: a.concepto } } } : estado;
    case 'referencia':
      return estado.panel.orden ? { ...estado, panel: { ...estado.panel, orden: { ...estado.panel.orden, referencia: a.referencia } } } : estado;
    case 'pedirPrecio': {
      const { orden, origenId } = estado.panel;
      const origen = cuentaPorId(origenId);
      if (!orden || !origen) return estado;
      const tdc = tdcEjecutable(estado, origen.divisa, orden.divisa);
      const precio: Precio = tdc == null ? { estado: 'indicativo' } : { estado: 'fijo', tdc, venceEn: VENCE_EN_INICIAL };
      return { ...estado, pausado: false, panel: { ...estado.panel, paso: 'precio', precio, token: '' } };
    }
    case 'token':
      return { ...estado, panel: { ...estado.panel, token: a.token.replace(/\D/g, '').slice(0, 6) } };
    case 'confirmar': {
      const { orden, origenId, precio, fechaValor, token } = estado.panel;
      const origen = cuentaPorId(origenId);
      if (!orden || !origen || token.length !== 6) return estado;
      const tdc = precio.estado === 'fijo' ? precio.tdc : null;
      const cot = cotizarCon(origen.divisa, orden.divisa, orden.monto, 'destino', tdc);
      if (!cot) return estado;
      if (cot.tipo !== 'transferencia' && precio.estado !== 'fijo') return estado;
      const pactada = !mismoDia(fechaValor, HOY);
      const hecha: OperacionHecha = { id: `op${estado.operaciones.length + 1}`, orden, origenId: origen.id, pagas: redondear2(cot.pagas), tdc, fechaValor, estado: pactada ? 'Pactada' : 'En proceso' };
      return { ...estado, operaciones: [hecha, ...estado.operaciones], panel: { ...estado.panel, paso: 'confirmacion', precio: { estado: 'indicativo' }, token: '' } };
    }
    case 'volverInicio': {
      const ultima = estado.operaciones[0];
      let aviso: Aviso | null = null;
      if (ultima && estado.panel.paso === 'confirmacion') {
        if (ultima.estado === 'Pactada') aviso = { tipo: 'info', texto: `${oracion(`Pactaste el pago a ${ultima.orden.destinatario}`)} El dinero sale el ${diaCorto(ultima.fechaValor)}.` };
        else aviso = { tipo: 'success', texto: ultima.orden.tipo === 'compra' ? `Compra enviada. Ya te alcanza para los pagos en ${ultima.orden.divisa} de la semana.` : `Pago enviado. Ya te alcanza para los pagos en ${ultima.orden.divisa} de la semana.` };
      }
      return { ...estado, panel: PANEL_CERRADO, aviso, pestana: 'posicion' };
    }

    // ----------------------------------------------------------- Onboarding
    case 'onboardingIniciar':
      return { ...estado, onboarding: { activo: true, paso: 0 }, pestana: 'posicion', panel: PANEL_CERRADO };
    case 'onboardingSiguiente':
      return estado.onboarding.paso >= ONBOARDING_PASOS - 1
        ? { ...estado, onboarding: { activo: false, paso: 0 } }
        : { ...estado, onboarding: { activo: true, paso: estado.onboarding.paso + 1 } };
    case 'onboardingAtras':
      return { ...estado, onboarding: { activo: true, paso: Math.max(0, estado.onboarding.paso - 1) } };
    case 'onboardingCerrar':
      return { ...estado, onboarding: { activo: false, paso: 0 } };

    // -------------------------------------------------------- Operar clásico
    case 'opTipo': {
      if (a.valor === estado.operar.tipo) return { ...estado, operar: cerrarSelectores(estado.operar) };
      const base: Operar = { ...OPERAR_INICIAL, tipo: a.valor, par: estado.operar.par };
      return { ...estado, operar: base };
    }
    case 'opParAbierto':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), parAbierto: a.abierto } };
    case 'opPar': {
      const op: Operar = { ...cerrarSelectores(estado.operar), par: a.par, origenId: null, destinoId: null, precio: { estado: 'indicativo' }, conToken: false, token: '' };
      return { ...estado, operar: recalcular(estado, op) };
    }
    case 'opMonto': {
      const limpio = a.valor.replace(/[^\d.,]/g, '');
      const op: Operar = { ...cerrarSelectores(estado.operar), ladoActivo: a.lado, [a.lado === 'izq' ? 'montoIzq' : 'montoDer']: limpio, precio: { estado: 'indicativo' }, conToken: false, token: '' };
      return { ...estado, operar: recalcular(estado, op) };
    }
    case 'opMontoEditando': {
      if (a.lado) return { ...estado, operar: { ...estado.operar, editando: a.lado } };
      // Al salir del campo, el texto escrito se normaliza (1000 → 1000.00) y la vista lo formatea.
      const op = estado.operar;
      const normal = (t: string) => (aNumero(t) > 0 ? aTexto(aNumero(t)) : '');
      return { ...estado, operar: { ...op, editando: null, montoIzq: normal(op.montoIzq), montoDer: normal(op.montoDer) } };
    }
    case 'opOrigenAbierto':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), origenAbierto: a.abierto } };
    case 'opOrigen': {
      const op: Operar = { ...cerrarSelectores(estado.operar), origenId: a.origenId, precio: { estado: 'indicativo' }, conToken: false, token: '' };
      if (op.tipo === 'transferir') op.destinoId = null;
      return { ...estado, operar: recalcular(estado, op) };
    }
    case 'opDestinoAbierto':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), destinoAbierto: a.abierto, destinoBusqueda: a.abierto ? estado.operar.destinoBusqueda : '' } };
    case 'opDestinoBusqueda':
      return { ...estado, operar: { ...estado.operar, destinoAbierto: true, destinoBusqueda: a.texto } };
    case 'opDestino':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), destinoId: a.destinoId, destinoBusqueda: '', precio: { estado: 'indicativo' }, conToken: false, token: '' } };
    case 'opMotivoAbierto':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), motivoAbierto: a.abierto } };
    case 'opMotivo':
      return { ...estado, operar: { ...cerrarSelectores(estado.operar), motivo: a.motivo } };
    case 'opReferencia':
      return { ...estado, operar: { ...estado.operar, referencia: a.referencia } };
    case 'opPedirPrecio': {
      const op = estado.operar;
      if (op.tipo === 'transferir') return estado;
      const d = divisasOperar(op);
      const tdc = tdcEjecutable(estado, d.origen, d.destino);
      if (tdc == null) return estado;
      const conPrecio: Operar = { ...cerrarSelectores(op), precio: { estado: 'fijo', tdc, venceEn: VENCE_EN_INICIAL }, conToken: true, token: '', ladoActivo: op.ladoActivo ?? 'izq' };
      return { ...estado, pausado: false, operar: recalcular(estado, conPrecio) };
    }
    case 'opContinuar':
      return estado.operar.tipo === 'transferir' ? { ...estado, operar: { ...cerrarSelectores(estado.operar), conToken: true, token: '' } } : estado;
    case 'opToken':
      return { ...estado, operar: { ...estado.operar, token: a.token.replace(/\D/g, '').slice(0, 6) } };
    case 'opCancelar':
      return { ...estado, operar: { ...OPERAR_INICIAL, tipo: estado.operar.tipo, par: estado.operar.par } };
    case 'opConfirmar': {
      const op = estado.operar;
      if (op.token.length !== 6 || !op.origenId || !op.destinoId) return estado;
      const d = divisasOperar(op);
      const origen = cuentaPorId(op.origenId);
      if (!origen) return estado;
      const montoBase = aNumero(op.montoIzq);
      const tdc = op.precio.estado === 'fijo' ? op.precio.tdc : null;
      if (op.tipo !== 'transferir' && tdc == null) return estado;
      const propia = cuentas.find((c) => c.id === op.destinoId);
      const destino = propia ? { nombre: propia.nombre, cuenta: { divisa: propia.divisa, banco: propia.banco, mascara: propia.mascara }, id: propia.id as CuentaId } : null;
      const orden: Orden = {
        id: `clasico:${estado.operaciones.length + 1}`,
        tipo: propia ? 'compra' : 'pago',
        destinatario: destino?.nombre ?? op.destinoId,
        cuentaDestino: destino?.cuenta ?? { divisa: d.destino, banco: '', mascara: '' },
        cuentaDestinoId: destino?.id,
        monto: op.tipo === 'vender' ? aNumero(op.montoDer) : montoBase,
        divisa: d.destino,
        referencia: op.referencia,
        concepto: op.motivo ?? '',
      };
      const pagas = op.tipo === 'transferir' ? montoBase : op.tipo === 'comprar' ? aNumero(op.montoDer) : montoBase;
      const nombre = op.tipo === 'comprar' ? `Compra de ${d.destino}` : op.tipo === 'vender' ? `Venta de ${d.origen}` : `Transferencia a ${orden.destinatario}`;
      const hecha: OperacionHecha = { id: `op${estado.operaciones.length + 1}`, orden, origenId: origen.id, pagas: redondear2(pagas), tdc, fechaValor: HOY, estado: 'En proceso', nombre };
      const aviso: Aviso = { tipo: 'success', texto: op.tipo === 'comprar' ? 'Compra enviada. Te avisamos cuando Banco BASE confirme el envío.' : op.tipo === 'vender' ? 'Venta enviada. Te avisamos cuando Banco BASE confirme el envío.' : 'Transferencia enviada. Te avisamos cuando Banco BASE confirme el envío.' };
      return { ...estado, operaciones: [hecha, ...estado.operaciones], avisoOperar: aviso, operar: { ...OPERAR_INICIAL, tipo: op.tipo, par: op.par } };
    }
    default:
      return estado;
  }
}

const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const diaCorto = (d: Date) => `${DIAS3[d.getDay()]} ${d.getDate()}`;

/** Aplica una secuencia de acciones (para /tablero y tests). */
export const aplicar = (acciones: Accion[], desde: EstadoApp = ESTADO_INICIAL) => acciones.reduce(reducer, desde);

export const pagoPorId = (id: string) => pagosFuturos.find((p) => p.id === id) ?? null;
