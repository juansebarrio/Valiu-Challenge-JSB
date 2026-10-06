// src/state/vistas.ts — selectores puros: del estado a los props de cada componente.
import { deducir, fechasLiquidacion, type Divisa } from '@/lib/fx';
import * as fmt from '@/lib/format';
import { cotizarCon, mismoDia, oracion } from '@/lib/cotizacion';
import { agregar, diasSemana, evaluarOrigen, posicion, proyeccion, type Posicion, type Tono } from '@/lib/posicion';
import {
  HOY, NOMBRE_DIVISA, ORDEN_POSICIONES, PARES_SELECTOR, HORARIO, cuentas, destinos, loNuevo, pagosFuturos, pagosFuturosMXN, realizados, tipoDeCambio,
  type Cuenta, type CuentaId, type Destino, type PagoFuturo,
} from '@/data/escenario-importadora';
import { cuentaPorId, divisasOperar, tdcIndicativo, ordenDeCompra, ordenDePago, type EstadoApp, type Orden, type OperacionHecha } from './estado';

export type TonoBadge = 'success' | 'warning' | 'error' | 'neutral' | 'pactada' | 'info';
export interface Badge { texto: string; tono: TonoBadge }
const tonoBadge: Record<Tono, TonoBadge> = { ok: 'success', warn: 'warning', neutro: 'neutral' };

// ------------------------------------------------------------------ Datos derivados
export interface CuentaActual extends Cuenta {
  saldoInicial: number;
}

/** Saldos después de las operaciones liquidadas hoy (las pactadas no mueven saldo). */
export function cuentasActuales(estado: EstadoApp): CuentaActual[] {
  return cuentas.map((c) => {
    let saldo = c.saldo;
    for (const op of estado.operaciones) {
      if (op.estado !== 'En proceso') continue;
      if (op.origenId === c.id) saldo -= op.pagas;
      if (op.orden.cuentaDestinoId === c.id) saldo += op.orden.monto;
    }
    return { ...c, saldoInicial: c.saldo, saldo };
  });
}

export interface PagoPendiente extends PagoFuturo {
  pactada: OperacionHecha | null;
}

/** Pagos cargados que siguen en Próximos: los enviados salen; los pactados quedan con su operación. */
export function pagosPendientes(estado: EstadoApp): PagoPendiente[] {
  return pagosFuturos
    .map((p) => {
      const op = estado.operaciones.find((o) => o.orden.pagoId === p.id) ?? null;
      if (op?.estado === 'En proceso') return null;
      return { ...p, pactada: op };
    })
    .filter((p): p is PagoPendiente => p !== null)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

export function posiciones(estado: EstadoApp): Record<CuentaId, Posicion> {
  const ctas = cuentasActuales(estado);
  const pendientes = pagosPendientes(estado);
  const out = {} as Record<CuentaId, Posicion>;
  for (const c of ctas) {
    const pagos = pendientes.filter((p) => p.divisa === c.divisa && !p.pactada);
    const agregado = agregar(pagos);
    if (c.divisa === 'MXN') {
      agregado.cantidad += pagosFuturosMXN.cantidad;
      agregado.total += pagosFuturosMXN.total;
    }
    const pactadas = estado.operaciones.filter((o) => o.estado === 'Pactada' && o.origenId === c.id);
    const agPactadas = pactadas.length ? { cantidad: pactadas.length, total: pactadas.reduce((a, o) => a + o.pagas, 0) } : null;
    out[c.id] = posicion(c.divisa, c.saldo, agregado, agPactadas);
  }
  return out;
}

const porDivisa = (estado: EstadoApp): Partial<Record<Divisa, Posicion>> => {
  const p = posiciones(estado);
  const out: Partial<Record<Divisa, Posicion>> = {};
  for (const c of cuentas) out[c.divisa] = p[c.id];
  return out;
};

function proyeccionDe(estado: EstadoApp, cuenta: CuentaActual): { serie: number[]; dias: Date[] } | null {
  const pagos = pagosPendientes(estado).filter((p) => p.divisa === cuenta.divisa && !p.pactada);
  if (pagos.length === 0) return null;
  const dias = diasSemana(HOY);
  return { serie: proyeccion(cuenta.saldo, pagos, dias), dias };
}

// ------------------------------------------------------------------ Home
export interface VistaPosicion {
  id: CuentaId;
  divisa: Divisa;
  nombre: string;
  saldo: number;
  pactadas: { cantidad: number; total: number } | null;
  pagosFuturos: { cantidad: number; total: number };
  resultado: Posicion['resultado'];
  proyeccion: { serie: number[]; etiquetas: string[] } | null;
  linea: string;
  accion: { label: string; orden: Orden } | null;
}

export interface VistaFila {
  id: string;
  fecha: string;
  nombre: string;
  detalle?: string;
  monto: number;
  divisa: Divisa;
  badge?: Badge;
  orden?: Orden;
}

export interface VistaCuenta { id: CuentaId; nombre: string; mascara: string; saldo: number; divisa: Divisa }

export interface VistaHome {
  posiciones: VistaPosicion[];
  nuevo: { monto: number; divisa: Divisa; de: string; meta: string; orden: Orden | null };
  proximos: VistaFila[];
  realizados: VistaFila[];
  tdc: { par: string; compra: number; venta: number; tendencia: number[]; hora: string; enVivo: boolean };
  cuentas: VistaCuenta[];
}

export function vistaHome(estado: EstadoApp): VistaHome {
  const ctas = cuentasActuales(estado);
  const pos = posiciones(estado);
  const pendientes = pagosPendientes(estado);
  const ordenadas = [...ctas].sort((a, b) => ORDEN_POSICIONES.indexOf(a.id) - ORDEN_POSICIONES.indexOf(b.id));
  const vistaPos: VistaPosicion[] = ordenadas.map((c) => {
    const p = pos[c.id];
    const proy = proyeccionDe(estado, c);
    let linea = '';
    if (p.resultado.tipo === 'faltan') {
      const t = tdcIndicativo(estado, 'MXN', c.divisa);
      if (t != null && c.divisa !== 'MXN') linea = `≈ ${fmt.monto(p.resultado.monto * t, 'MXN')} a precio de compra`;
    } else if (c.divisa === loNuevo.divisa) {
      linea = `Incluye los ${fmt.numero(loNuevo.monto)} de ${loNuevo.de}`;
    }
    const accion = p.resultado.tipo === 'faltan' && c.divisa !== 'MXN'
      ? { label: `Comprar ${Number.isInteger(p.resultado.monto) ? fmt.entero(p.resultado.monto) : fmt.numero(p.resultado.monto)} ${c.divisa}`, orden: ordenDeCompra(c.id, p.resultado.monto) }
      : null;
    return {
      id: c.id, divisa: c.divisa, nombre: NOMBRE_DIVISA[c.divisa].plural, saldo: c.saldo, pactadas: p.pactadas, pagosFuturos: p.pagosFuturos, resultado: p.resultado,
      proyeccion: proy ? { serie: proy.serie, etiquetas: proy.dias.map(fmt.diaCorto) } : null, linea, accion,
    };
  });
  const primerPendiente = pendientes.find((p) => !p.pactada) ?? null;
  const proximos: VistaFila[] = pendientes.map((p) => ({
    id: p.id, fecha: fmt.diaCorto(p.fecha), nombre: p.destinatario, monto: -p.monto, divisa: p.divisa,
    ...(p.pactada
      ? { badge: { texto: 'Pactada', tono: 'pactada' as const }, detalle: `${fmt.monto(p.pactada.pagas, cuentaPorId(p.pactada.origenId)!.divisa)} a ${fmt.tdc(p.pactada.tdc ?? 0)}` }
      : { orden: ordenDePago(p) }),
  }));
  const hechas: VistaFila[] = estado.operaciones.filter((o) => o.estado === 'En proceso').map((o) => {
    const origen = cuentaPorId(o.origenId)!;
    return {
      id: o.id, fecha: fmt.diaRelativo(o.fechaValor, HOY), nombre: o.nombre ?? o.orden.destinatario, monto: -o.pagas, divisa: origen.divisa,
      detalle: o.tdc != null ? `${fmt.monto(o.orden.monto, o.orden.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
      badge: { texto: 'En proceso', tono: 'warning' as const },
    };
  });
  const pasados: VistaFila[] = realizados.map((r, i) => ({ id: `r${i}`, fecha: fmt.diaRelativo(r.fecha, HOY) === 'Hoy' ? 'Hoy' : `${r.fecha.getDate()} ${fmt.fecha(r.fecha).split(' ')[1]}`, nombre: r.nombre, monto: r.monto, divisa: r.divisa }));
  return {
    posiciones: vistaPos,
    nuevo: { monto: loNuevo.monto, divisa: loNuevo.divisa, de: loNuevo.de, meta: `Hoy ${loNuevo.hora} · ${loNuevo.banco} · Ref. ${loNuevo.referencia}`, orden: primerPendiente ? ordenDePago(primerPendiente) : null },
    proximos,
    realizados: [...hechas, ...pasados],
    tdc: { par: tipoDeCambio.par, compra: estado.tdcVivo.compra, venta: estado.tdcVivo.venta, tendencia: tipoDeCambio.tendenciaDia, hora: tipoDeCambio.hora, enVivo: true },
    cuentas: ctas.map((c) => ({ id: c.id, nombre: c.nombre, mascara: c.mascara, saldo: c.saldo, divisa: c.divisa })),
  };
}

// ------------------------------------------------------------------ Panel
export interface VistaOpcionOrigen {
  id: CuentaId;
  nombre: string;
  saldo: string;
  pagas: string;
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string };
  seleccionada: boolean;
}

export interface VistaFecha { fecha: Date; etiqueta: string; vence: boolean; seleccionada: boolean }

export interface VistaPanel {
  titulo: string;
  sub: string;
  paso: EstadoApp['panel']['paso'];
  sinTdc: boolean;
  primario: { label: string; habilitado: boolean; accion: 'continuar' | 'pedirPrecio' | 'confirmar' | 'volverInicio' | 'ninguna' };
  secundario: { label: string; accion: 'cancelar' | 'volver' | 'comprobante' } | null;
  origenes: VistaOpcionOrigen[];
  ordenes: { orden: Orden; fecha: string; monto: string }[];
  revision: {
    pagas: number; pagasDivisa: Divisa; recibe: number; recibeDivisa: Divisa; destinatario: string;
    fechas: VistaFecha[]; fechaEsHoy: boolean; fechaDia: string;
    texto: string; ayuda: string | null; tdc: number | null; concepto: string; referencia: string; saldoDespues: string;
  } | null;
  precio: {
    estado: 'fijo' | 'vencido' | 'sinTdc'; tdc: number | null; segundos: number; porVencer: boolean; pausado: boolean;
    pagas: number; pagasAprox: boolean; pagasDivisa: Divisa; recibe: number; recibeDivisa: Divisa; destinatario: string; desde: string; sale: string | null;
    token: string; tokenHabilitado: boolean;
  } | null;
  confirmacion: {
    tipo: 'enviado' | 'pactado'; fechaDia: string; tdc: number | null; pagas: number; pagasDivisa: Divisa; recibe: number; recibeDivisa: Divisa;
    destinatario: string; desde: string; referencia: string; detalle: { k: string; v: string }[];
  } | null;
}

export function vistaPanel(estado: EstadoApp): VistaPanel | null {
  const { panel } = estado;
  if (!panel.abierto) return null;
  const orden = panel.orden;
  const ctas = cuentasActuales(estado);
  const pos = porDivisa(estado);

  if (!orden) {
    const pendientes = pagosPendientes(estado).filter((p) => !p.pactada);
    return {
      titulo: 'Pagar', sub: '¿A quién le pagas?', paso: 'destinatario', sinTdc: false,
      primario: { label: 'Continuar', habilitado: false, accion: 'ninguna' }, secundario: { label: 'Cancelar', accion: 'cancelar' },
      origenes: [], ordenes: pendientes.map((p) => ({ orden: ordenDePago(p), fecha: fmt.diaCorto(p.fecha), monto: fmt.monto(p.monto, p.divisa) })),
      revision: null, precio: null, confirmacion: null,
    };
  }

  const origen = ctas.find((c) => c.id === panel.origenId) ?? null;
  const op = origen ? deducir(origen.divisa, orden.divisa) : null;
  const sinTdc = !!op && op.tipo === 'transferencia';
  const tdcInd = origen ? tdcIndicativo(estado, origen.divisa, orden.divisa) : null;
  const cotInd = origen ? cotizarCon(origen.divisa, orden.divisa, orden.monto, 'destino', tdcInd) : null;
  const con = origen ? NOMBRE_DIVISA[origen.divisa].con : '';
  const recibeNombre = orden.tipo === 'compra' ? `Tu ${orden.destinatario} recibe` : `${orden.destinatario} recibe`;
  const titulo = orden.tipo === 'compra' ? `Comprar ${fmt.monto(orden.monto, orden.divisa)}` : `Pagar a ${orden.destinatario}`;
  const subBase = orden.tipo === 'compra'
    ? `A tu ${orden.destinatario} · **** ${orden.cuentaDestino.mascara}`
    : [fmt.monto(orden.monto, orden.divisa), orden.vence ? `vence ${fmt.diaCorto(orden.vence)}` : null, orden.referencia].filter(Boolean).join(' · ');
  const ultima = estado.operaciones[0] ?? null;

  const origenes: VistaOpcionOrigen[] = ctas
    .filter((c) => c.id !== orden.cuentaDestinoId)
    .map((c) => {
      const ev = evaluarOrigen({ origen: c, monto: orden.monto, divisaPago: orden.divisa, posiciones: pos, proyeccionPago: proyeccionDe(estado, c) ?? undefined });
      return { id: c.id, nombre: c.nombre, saldo: `Saldo ${fmt.monto(c.saldo, c.divisa)}`, pagas: ev.pagasTexto, consecuencia: { texto: ev.consecuencia.texto, tono: tonoBadge[ev.consecuencia.tono], ayuda: ev.consecuencia.ayuda }, seleccionada: c.id === panel.origenId };
    });

  const fechasBase = fechasLiquidacion(HOY, orden.vence);
  const fechas: VistaFecha[] = fechasBase.map((f) => ({ ...f, seleccionada: mismoDia(f.fecha, panel.fechaValor) }));
  const fechaEsHoy = mismoDia(panel.fechaValor, HOY);
  const fechaDia = fechas.find((f) => f.seleccionada)?.etiqueta ?? fmt.diaCorto(panel.fechaValor);

  let revision: VistaPanel['revision'] = null;
  if (panel.paso === 'revision' && origen && cotInd) {
    const alcanzaHoy = cotInd.pagas <= origen.saldo;
    let texto: string;
    let ayuda: string | null = null;
    if (sinTdc) texto = `Vas a pagar ${fmt.monto(orden.monto, orden.divisa)} desde tu ${origen.nombre}, sin tipo de cambio.`;
    else if (fechaEsHoy) texto = `Vas a pagar ${fmt.monto(orden.monto, orden.divisa)} con ${con}. Compras los ${NOMBRE_DIVISA[orden.divisa].con} a ${fmt.tdc(tdcInd ?? 0)} MXN.`;
    else {
      const envio = orden.tipo === 'compra' ? `entran ${fmt.monto(orden.monto, orden.divisa)} a tu ${orden.destinatario}` : `se envía el pago a ${orden.destinatario}`;
      texto = oracion(`Cierras hoy el precio de ${fmt.monto(orden.monto, orden.divisa)}. El ${fechaDia} salen ≈ ${fmt.monto(cotInd.pagas, origen.divisa)} de tu ${origen.nombre} y ${envio}`);
      ayuda = alcanzaHoy ? `Hoy tienes el saldo. Asegúrate de que siga en tu cuenta el ${fechaDia}.` : `Hoy no tienes el saldo. Fondea ${fmt.monto(cotInd.pagas, origen.divisa)} antes del ${fechaDia}.`;
    }
    revision = {
      pagas: cotInd.pagas, pagasDivisa: origen.divisa, recibe: orden.monto, recibeDivisa: orden.divisa, destinatario: recibeNombre,
      fechas: sinTdc ? [] : fechas, fechaEsHoy, fechaDia, texto, ayuda, tdc: sinTdc ? null : tdcInd, concepto: orden.concepto, referencia: orden.referencia,
      saldoDespues: `Tu cuenta en ${con} queda en ≈ ${fmt.monto(origen.saldo - cotInd.pagas, origen.divisa)}.`,
    };
  }

  let precio: VistaPanel['precio'] = null;
  if (panel.paso === 'precio' && origen && cotInd) {
    const fijo = panel.precio.estado === 'fijo' ? panel.precio : null;
    const cotFija = fijo ? cotizarCon(origen.divisa, orden.divisa, orden.monto, 'destino', fijo.tdc) : null;
    const estadoPrecio = sinTdc ? 'sinTdc' : fijo ? 'fijo' : 'vencido';
    precio = {
      estado: estadoPrecio, tdc: fijo ? fijo.tdc : tdcInd, segundos: fijo ? fijo.venceEn : 0, porVencer: !!fijo && fijo.venceEn <= 30, pausado: estado.pausado,
      pagas: cotFija ? cotFija.pagas : cotInd.pagas, pagasAprox: !fijo && !sinTdc, pagasDivisa: origen.divisa, recibe: orden.monto, recibeDivisa: orden.divisa, destinatario: recibeNombre, desde: origen.nombre,
      sale: fechaEsHoy || sinTdc ? null : `El dinero sale el ${fechaDia}`,
      token: panel.token, tokenHabilitado: estadoPrecio !== 'vencido',
    };
  }

  let confirmacion: VistaPanel['confirmacion'] = null;
  if (panel.paso === 'confirmacion' && ultima) {
    const o = cuentaPorId(ultima.origenId)!;
    const dia = fmt.diaCorto(ultima.fechaValor);
    const detalle = [
      { k: ultima.orden.tipo === 'compra' ? 'Compraste' : 'Enviaste', v: ultima.orden.tipo === 'compra' ? `${fmt.monto(ultima.orden.monto, ultima.orden.divisa)} a tu ${ultima.orden.destinatario}` : `${fmt.monto(ultima.orden.monto, ultima.orden.divisa)} a ${ultima.orden.destinatario}` },
      { k: 'Pagaste', v: fmt.monto(ultima.pagas, o.divisa) },
      ...(ultima.tdc != null ? [{ k: 'TDC', v: fmt.tdc(ultima.tdc) }] : []),
      { k: 'Referencia', v: ultima.orden.referencia || '—' },
    ];
    confirmacion = { tipo: ultima.estado === 'Pactada' ? 'pactado' : 'enviado', fechaDia: dia, tdc: ultima.tdc, pagas: ultima.pagas, pagasDivisa: o.divisa, recibe: ultima.orden.monto, recibeDivisa: ultima.orden.divisa, destinatario: ultima.orden.destinatario, desde: o.nombre, referencia: ultima.orden.referencia, detalle };
  }

  const tokenListo = panel.token.length === 6;
  const primario: VistaPanel['primario'] =
    panel.paso === 'origen' ? { label: 'Continuar', habilitado: !!origen && !!cotInd, accion: 'continuar' }
      : panel.paso === 'revision' ? { label: sinTdc ? 'Continuar' : 'Pedir precio', habilitado: true, accion: 'pedirPrecio' }
        : panel.paso === 'precio' ? (panel.precio.estado === 'vencido' ? { label: 'Pedir precio', habilitado: true, accion: 'pedirPrecio' } : { label: 'Confirmar pago', habilitado: tokenListo, accion: 'confirmar' })
          : { label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' };
  const secundario: VistaPanel['secundario'] =
    panel.paso === 'origen' ? { label: 'Cancelar', accion: 'cancelar' }
      : panel.paso === 'revision' ? { label: 'Volver', accion: 'volver' }
        : panel.paso === 'precio' ? { label: 'Cancelar', accion: 'cancelar' }
          : { label: 'Descargar comprobante', accion: 'comprobante' };

  return {
    titulo, sub: panel.paso === 'confirmacion' && orden.tipo === 'pago' ? `${fmt.monto(orden.monto, orden.divisa)} · ${orden.referencia}` : subBase,
    paso: panel.paso, sinTdc, primario, secundario, origenes, ordenes: [], revision, precio, confirmacion,
  };
}

// ------------------------------------------------------------------ Operar clásico
export interface VistaOperar {
  tipo: EstadoApp['operar']['tipo'];
  tabs: { id: EstadoApp['operar']['tipo']; label: string; activa: boolean }[];
  cerrado: boolean;
  subtitulo: string;
  mercado: Badge;
  esCambio: boolean;
  par: { valor: string; abierto: boolean; grupos: { titulo: string; items: { par: string; nombre: string; seleccionado: boolean }[] }[] };
  labelIzq: string;
  labelDer: string;
  montoIzq: string;
  montoDer: string;
  divIzq: Divisa;
  divDer: Divisa;
  ladoActivo: 'izq' | 'der' | null;
  error: string | null;
  origen: { valor: string | null; abierto: boolean; opciones: { id: CuentaId; nombre: string; sub: string; seleccionado: boolean }[] };
  destino: { valor: string | null; abierto: boolean; busqueda: string; grupos: { titulo: string; items: { id: string; divisa: Divisa; nombre: string; sub: string; seleccionado: boolean }[] }[] };
  disponible: string;
  motivo: { valor: string | null; abierto: boolean; opciones: string[] };
  referencia: string;
  vencido: boolean;
  cotizacion: { titulo: string; badge: Badge; izqLabel: string; izq: string; derLabel: string; der: string; vacio: boolean; tdc: { valor: number; tipo: string; apagado: boolean } | null; notaTransfer: boolean };
  token: { visible: boolean; valor: string };
  cta: { label: string; habilitado: boolean; accion: 'pedirPrecio' | 'continuar' | 'confirmar' | 'ninguna' };
  nota: string;
}

const aNumero = (texto: string) => {
  const n = Number(texto.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const etiquetaCuenta = (c: Cuenta) => `${c.nombre} · **** ${c.mascara}`;
const etiquetaDestino = (d: Destino) => (d.propia ? `${d.nombre} · **** ${d.mascara}` : `${d.nombre} · ${d.banco} **** ${d.mascara}`);

export function vistaOperar(estado: EstadoApp): VistaOperar {
  const op = estado.operar;
  const ctas = cuentasActuales(estado);
  const d = divisasOperar(op);
  const esCambio = op.tipo !== 'transferir';
  const cerrado = estado.mercado === 'cerrado';
  const origen = ctas.find((c) => c.id === op.origenId) ?? null;
  const destinoSel = destinos.find((x) => x.id === op.destinoId) ?? null;
  const montoIzq = aNumero(op.montoIzq);
  const montoDer = aNumero(op.montoDer);
  const fijo = op.precio.estado === 'fijo' ? op.precio : null;
  const vencido = op.precio.estado === 'vencido';
  const tdcInd = esCambio ? tdcIndicativo(estado, d.origen, d.destino) : null;
  const tdc = fijo ? fijo.tdc : tdcInd;

  let error: string | null = null;
  const sale = op.tipo === 'comprar' ? montoDer : montoIzq;
  if (origen && sale > 0 && sale > origen.saldo) error = `Supera tu saldo disponible: ${fmt.monto(origen.saldo, origen.divisa)}.`;

  const origenOpciones = ctas.filter((c) => (op.tipo === 'transferir' ? true : c.divisa === d.origen)).map((c) => ({ id: c.id, nombre: c.nombre, sub: `${c.banco} · **** ${c.mascara}`, seleccionado: c.id === op.origenId }));
  const divDestino = op.tipo === 'transferir' ? (origen?.divisa ?? null) : d.destino;
  const busca = op.destinoBusqueda.trim().toLowerCase();
  const candidatos = destinos.filter((x) => (divDestino ? x.divisa === divDestino : true) && x.id !== op.origenId && (!busca || x.nombre.toLowerCase().includes(busca)));
  const grupos = [
    { titulo: 'Tus cuentas', items: candidatos.filter((x) => x.propia) },
    { titulo: `Destinatarios${divDestino ? ` en ${divDestino}` : ''}`, items: candidatos.filter((x) => !x.propia) },
  ]
    .filter((g) => g.items.length)
    .map((g) => ({ titulo: g.titulo, items: g.items.map((x) => ({ id: x.id, divisa: x.divisa, nombre: x.nombre, sub: `${x.banco} · **** ${x.mascara}`, seleccionado: x.id === op.destinoId })) }));

  const completo = montoIzq > 0 && !!origen && !!destinoSel && !!op.motivo && !error && (esCambio ? tdc != null : true);
  const conToken = op.conToken && (esCambio ? !!fijo : true);
  const verbo = op.tipo === 'comprar' ? 'compra' : op.tipo === 'vender' ? 'venta' : 'transferencia';
  const cta: VistaOperar['cta'] = cerrado
    ? { label: esCambio ? 'Pedir precio' : 'Continuar', habilitado: false, accion: 'ninguna' }
    : conToken
      ? { label: `Confirmar ${verbo}`, habilitado: op.token.length === 6, accion: 'confirmar' }
      : esCambio
        ? { label: 'Pedir precio', habilitado: completo, accion: 'pedirPrecio' }
        : { label: 'Continuar', habilitado: completo, accion: 'continuar' };

  const cotVacia = montoIzq <= 0;
  const cotizacion: VistaOperar['cotizacion'] = esCambio
    ? {
      titulo: 'Cotización',
      badge: vencido ? { texto: 'Vencido', tono: 'error' } : fijo ? { texto: `Precio fijo por ${fmt.cuentaRegresiva(fijo.venceEn)}${estado.pausado ? ' · pausa' : ''}`, tono: fijo.venceEn <= 30 ? 'warning' : 'success' } : { texto: 'Precio indicativo', tono: 'info' },
      izqLabel: op.tipo === 'comprar' ? 'Tu compra' : 'Tu venta', izq: fmt.monto(montoIzq, d.izq),
      derLabel: op.tipo === 'comprar' ? 'Total a pagar' : 'Recibirás', der: fmt.monto(montoDer, d.der),
      vacio: cotVacia,
      tdc: tdc != null ? { valor: tdc, tipo: cerrado ? 'Último cierre' : fijo ? 'Ejecutable' : 'Indicativo', apagado: vencido } : null,
      notaTransfer: false,
    }
    : {
      titulo: 'Resumen', badge: { texto: 'Sin tipo de cambio', tono: 'neutral' },
      izqLabel: 'Envías', izq: fmt.monto(montoIzq, d.izq), derLabel: destinoSel ? `Recibe ${destinoSel.nombre}` : 'Recibe', der: fmt.monto(montoIzq, d.der), vacio: cotVacia, tdc: null, notaTransfer: true,
    };

  return {
    tipo: op.tipo,
    tabs: (['comprar', 'vender', 'transferir'] as const).map((id) => ({ id, label: id === 'comprar' ? 'Comprar' : id === 'vender' ? 'Vender' : 'Transferir', activa: id === op.tipo })),
    cerrado,
    subtitulo: conToken ? 'Revisa y confirma' : 'Completa los campos',
    mercado: cerrado ? { texto: 'Mercado cerrado', tono: 'warning' } : { texto: 'Mercado abierto', tono: 'success' },
    esCambio,
    par: { valor: op.par, abierto: op.parAbierto, grupos: PARES_SELECTOR.map((g) => ({ titulo: g.titulo, items: g.items.map((i) => ({ ...i, seleccionado: i.par === op.par })) })) },
    labelIzq: op.tipo === 'comprar' ? 'Compras' : op.tipo === 'vender' ? 'Vendes' : 'Monto',
    labelDer: op.tipo === 'comprar' ? 'Pagas' : 'Recibes',
    montoIzq: op.montoIzq ? (op.editando === 'izq' && !fijo ? op.montoIzq : fmt.numero(montoIzq)) : '',
    montoDer: op.montoDer ? (op.editando === 'der' && !fijo ? op.montoDer : fmt.numero(montoDer)) : '',
    divIzq: d.izq, divDer: d.der, ladoActivo: fijo || vencido ? null : op.ladoActivo, error,
    origen: { valor: origen ? etiquetaCuenta(origen) : null, abierto: op.origenAbierto, opciones: origenOpciones },
    destino: { valor: destinoSel ? etiquetaDestino(destinoSel) : null, abierto: op.destinoAbierto, busqueda: op.destinoBusqueda, grupos },
    disponible: origen ? fmt.monto(origen.saldo, origen.divisa) : '',
    motivo: { valor: op.motivo, abierto: op.motivoAbierto, opciones: ['Pago de factura', 'Pago a proveedores', 'Compra de divisas', 'Venta de divisas', 'Nómina', 'Pago de servicios', 'Transferencia entre cuentas'] },
    referencia: op.referencia,
    vencido,
    cotizacion,
    token: { visible: conToken, valor: op.token },
    cta,
    nota: cerrado ? `Operas de lunes a viernes de ${HORARIO.abre} a ${HORARIO.cierra}, hora de CDMX.` : esCambio ? 'Ten tu token a mano: el precio dura 2 minutos.' : 'Sin tipo de cambio: te pedimos el token al continuar.',
  };
}
