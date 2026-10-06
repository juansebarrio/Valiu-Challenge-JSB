// src/state/vistas.ts — selectores puros: del estado a los props de cada componente.
import type { Centavos, TdcMicro } from '@/lib/dinero';
import { cotizar, deducir, fechasLiquidacion, mismoDia, PARES, tdcDe, type Divisa } from '@/lib/fx';
import * as fmt from '@/lib/format';
import { evaluarOrigen, type Posicion, type Tono } from '@/lib/posicion';
import { HOY, HORARIO, HORA_TDC, MOTIVOS, NOMBRE_DIVISA, PARES_SELECTOR, AVISO_PAR_SIN_PROTOTIPO, type ArquetipoId, type Cuenta, type CuentaId, type Destinatario, type PagoFuturo, type Realizado } from '@/data/escenario';
import { ARQUETIPO_IDS, arquetipoDe } from '@/data/arquetipos';
import { leerCentavos } from '@/lib/dinero';
import { cuentaPorId, cuentasActuales, destinoDeCuenta, destinoDeDestinatario, finDeSemana, movimientoDe, opcionesDelCobro, ordenACuenta, ordenDePago, pactadas, pagosPendientes, posiciones, posicionesPorDivisa, proyecciones } from './derivados';
import { cotizacionPanel, divisasOperar, estadoInicial, fechaAgendable, fechaMaximaAgendable, origenDeshabilitado, pagoAgendado, type Clase, type Destino, type EstadoApp, type OperacionHecha, type Orden } from './estado';


export type TonoBadge = 'success' | 'warning' | 'error' | 'neutral' | 'pactada' | 'info';
export interface Badge { texto: string; tono: TonoBadge }
const tonoBadge: Record<Tono, TonoBadge> = { ok: 'success', warn: 'warning', neutro: 'neutral' };

const etiquetaCuenta = (c: Cuenta) => `${c.nombre} · **** ${c.mascara}`;
const etiquetaDestino = (d: Destino) => (d.tipo === 'propia' ? `${d.nombre} · **** ${d.mascara}` : `${d.nombre} · ${d.banco} **** ${d.mascara}`);

// ------------------------------------------------------------------ Inicio
export interface VistaPosicion {
  id: CuentaId;
  divisa: Divisa;
  nombre: string;
  saldo: Centavos;
  pactadasRecibir: { cantidad: number; total: Centavos } | null;
  pactadasLiquidar: { cantidad: number; total: Centavos } | null;
  pagosFuturos: { cantidad: number; total: Centavos } | null;
  resultado: Posicion['resultado'];
  proyeccion: { serie: Centavos[]; etiquetas: string[]; etiquetaCruce: string | null } | null;
  linea: string;
  accion: { label: string; orden: Orden } | null;
  enlace: { label: string; accion: 'depositar' } | null;
}

export interface VistaFila {
  id: string;
  fecha: string;
  nombre: string;
  detalle?: string;
  monto: Centavos;
  divisa: Divisa;
  badge?: Badge;
  orden?: Orden;
  estaSemana: boolean;
}

export interface VistaCuenta { id: CuentaId; nombre: string; mascara: string; saldo: Centavos; divisa: Divisa }

export interface VistaHome {
  arquetipo: ArquetipoId;
  empresa: string;
  posiciones: VistaPosicion[];
  nuevo: { id: string; cuentaId: CuentaId; monto: Centavos; divisa: Divisa; de: string; meta: string } | null;
  proximos: VistaFila[];
  /** Todos los próximos (sección Movimientos). */
  proximosTodos: VistaFila[];
  /** "10 pagos próximos · 3,000.00 USD · 80,350.50 MXN" */
  resumenProximos: string;
  totalProximos: number;
  verTodos: boolean;
  realizados: VistaFila[];
  tdc: { par: string; compra: TdcMicro; venta: TdcMicro; tendencia: number[]; hora: string; enVivo: boolean; pausado: boolean; otros: { par: string; base: Divisa; compra: TdcMicro; venta: TdcMicro }[] };
  cuentas: VistaCuenta[];
  totalMXN: Centavos;
}

export function vistaHome(e: EstadoApp): VistaHome {
  const arq = arquetipoDe(e.arquetipo);
  const ctas = cuentasActuales(e);
  const pos = posiciones(e);
  const proy = proyecciones(e);
  const pendientes = pagosPendientes(e);
  const pact = pactadas(e);
  const ordenadas = [...ctas].sort((a, b) => arq.ordenPosiciones.indexOf(a.id) - arq.ordenPosiciones.indexOf(b.id));

  const vistaPos: VistaPosicion[] = ordenadas.map((c) => {
    const p = pos[c.id];
    const pr = proy[c.divisa];
    let linea = '';
    let enlace: VistaPosicion['enlace'] = null;
    let accion: VistaPosicion['accion'] = null;
    if (p.resultado.tipo === 'faltan') {
      if (c.divisa === 'MXN') {
        const primera = pact.filter((o) => o.origenId === c.id).sort((a, b) => a.fechaValor.getTime() - b.fechaValor.getTime())[0];
        linea = `Fondea ${fmt.monto(p.resultado.monto, 'MXN')}${primera ? ` para el ${fmt.diaCorto(primera.fechaValor)}` : ''}`;
        if (c.clabe) enlace = { label: 'Ver datos para depositar', accion: 'depositar' };
      } else {
        const op = deducir('MXN', c.divisa);
        const t = op ? tdcDe(op, e.tdcVivo) : null;
        const cot = t != null ? cotizar({ origen: 'MXN', destino: c.divisa, monto: p.resultado.monto, ladoFijo: 'recibe', pares: e.tdcVivo }) : null;
        if (cot) linea = `≈ ${fmt.monto(cot.pagas, 'MXN')} a precio de compra`;
        accion = { label: `Comprar ${fmt.compacto(p.resultado.monto)} ${c.divisa}`, orden: ordenACuenta(c, p.resultado.monto) };
      }
    } else if (e.datos.loNuevo && c.divisa === e.datos.loNuevo.divisa) {
      linea = `Incluye los ${fmt.numero(e.datos.loNuevo.monto)} de ${e.datos.loNuevo.de}`;
    } else if (p.resultado.tipo === 'nada') {
      // Sin pendientes porque el único pago en esta divisa ya se pagó (o pactó) desde otra cuenta: la tarjeta dice con qué.
      const op = e.operaciones.find((o) => o.pagoId && o.destino.divisa === c.divisa && o.estado !== 'Cancelada' && o.origenId !== c.id);
      if (op) {
        const con = NOMBRE_DIVISA[cuentaPorId(e, op.origenId)!.divisa].con;
        linea = op.estado === 'Pactada' ? `${op.destino.nombre}: pactado en ${con}, sale el ${fmt.diaCorto(op.fechaValor)}` : `${op.destino.nombre}: pagado hoy en ${con}`;
      }
    }
    const cruce = pr ? pr.serie.findIndex((v) => v < 0) : -1;
    return {
      id: c.id, divisa: c.divisa, nombre: NOMBRE_DIVISA[c.divisa].plural, saldo: c.saldo,
      pactadasRecibir: p.pactadasRecibir, pactadasLiquidar: p.pactadasLiquidar, pagosFuturos: p.pagosFuturos, resultado: p.resultado,
      proyeccion: pr ? { serie: pr.serie, etiquetas: pr.dias.map(fmt.diaCorto), etiquetaCruce: cruce >= 0 ? 'faltante' : null } : null,
      linea, accion, enlace,
    };
  });

  const finSemana = finDeSemana(HOY);
  const filasPendientes: VistaFila[] = pendientes.map((p) => ({
    id: p.id, fecha: fmt.diaCorto(p.fecha), nombre: p.destinatario, monto: -p.monto, divisa: p.divisa, estaSemana: p.fecha.getTime() <= finSemana.getTime(),
    ...(p.pactada
      ? { badge: { texto: 'Pactada', tono: 'pactada' as const }, detalle: `${fmt.monto(p.pactada.pagas, cuentaPorId(e, p.pactada.origenId)!.divisa)} a ${fmt.tdc(p.pactada.tdc ?? 0)}` }
      : { orden: ordenDePagoVista(p) }),
  }));
  // Pactadas a cuentas propias: no tienen fila de pago cargado, así que suman la suya a Próximos.
  const filasPactadasPropias: VistaFila[] = pact.filter((o) => !o.pagoId).map((o) => ({
    id: o.id, fecha: fmt.diaCorto(o.fechaValor), nombre: `Pasar a tu ${o.destino.nombre}`, monto: -o.pagas, divisa: cuentaPorId(e, o.origenId)!.divisa, estaSemana: o.fechaValor.getTime() <= finSemana.getTime(),
    badge: { texto: 'Pactada', tono: 'pactada' as const }, detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
  }));
  const todas = [...filasPendientes, ...filasPactadasPropias].sort((a, b) => ordenFecha(a, e) - ordenFecha(b, e));
  const proximos = e.verTodosLosPagos ? todas : todas.filter((f) => f.estaSemana);
  const totales = todas.reduce<{ divisa: Divisa; total: Centavos }[]>((acc, f) => {
    const t = acc.find((x) => x.divisa === f.divisa);
    if (t) t.total += -f.monto; else acc.push({ divisa: f.divisa, total: -f.monto });
    return acc;
  }, []);
  const resumenProximos = todas.length ? `${todas.length} ${todas.length === 1 ? 'pago próximo' : 'pagos próximos'} · ${totales.map((t) => fmt.monto(t.total, t.divisa)).join(' · ')}` : 'Sin pagos próximos.';

  // Hoy: lo que salió (En proceso) y las pactadas que se cancelaron (no movieron dinero, pero quedan en el historial).
  const hechas: VistaFila[] = e.operaciones.filter((o) => o.estado !== 'Pactada').map((o) => {
    const origen = cuentaPorId(e, o.origenId)!;
    return {
      id: o.id, fecha: 'Hoy', nombre: nombreMovimiento(o), monto: -o.pagas, divisa: origen.divisa, estaSemana: true,
      detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
      badge: o.estado === 'Cancelada' ? { texto: 'Cancelada', tono: 'neutral' as const } : { texto: 'En proceso', tono: 'warning' as const },
    };
  });
  const pasados: VistaFila[] = e.datos.realizados.map((r) => ({ id: r.id, fecha: mismoDia(r.fecha, HOY) ? 'Hoy' : fmt.diaMes(r.fecha), nombre: r.nombre, monto: r.monto, divisa: r.divisa, estaSemana: true }));

  const [parPrincipal, ...otrosPares] = arq.paresTarjeta;
  const principal = e.tdcVivo[parPrincipal];
  const totalMXN = ctas.reduce((acc, c) => acc + (c.divisa === 'MXN' ? c.saldo : (cotizar({ origen: c.divisa, destino: 'MXN', monto: c.saldo, ladoFijo: 'pagas', pares: e.tdcVivo })?.recibe ?? 0)), 0);

  return {
    arquetipo: e.arquetipo,
    empresa: arq.empresa,
    posiciones: vistaPos,
    nuevo: e.datos.loNuevo ? { id: e.datos.loNuevo.id, cuentaId: e.datos.loNuevo.cuentaId, monto: e.datos.loNuevo.monto, divisa: e.datos.loNuevo.divisa, de: e.datos.loNuevo.de, meta: `Hoy ${e.datos.loNuevo.hora} · ${e.datos.loNuevo.banco} · Ref. ${e.datos.loNuevo.referencia}` } : null,
    proximos,
    proximosTodos: todas,
    resumenProximos,
    totalProximos: todas.length,
    verTodos: e.verTodosLosPagos,
    realizados: [...hechas, ...pasados],
    tdc: { par: parPrincipal, compra: principal.compra, venta: principal.venta, tendencia: arq.tendencia, hora: HORA_TDC, enVivo: !e.congelado, pausado: e.pausado, otros: otrosPares.map((par) => ({ par, base: par.split('/')[0] as Divisa, compra: e.tdcVivo[par].compra, venta: e.tdcVivo[par].venta })) },
    cuentas: ctas.map((c) => ({ id: c.id, nombre: c.nombre, mascara: c.mascara, saldo: c.saldo, divisa: c.divisa })),
    totalMXN,
  };
}

function ordenFecha(f: VistaFila, e: EstadoApp): number {
  const p = e.datos.pagosFuturos.find((x) => x.id === f.id);
  if (p) return p.fecha.getTime();
  const o = e.operaciones.find((x) => x.id === f.id);
  return o ? o.fechaValor.getTime() : 0;
}

function ordenDePagoVista(p: PagoFuturo): Orden {
  return { destino: { tipo: 'tercero', id: p.destinatarioId, nombre: p.destinatario, divisa: p.divisa, banco: p.cuentaDestino.banco, mascara: p.cuentaDestino.mascara }, pagoId: p.id, vence: p.fecha, monto: p.monto, ladoFijo: 'recibe', conFactura: true, motivo: p.motivo, referencia: p.referencia };
}

function nombreMovimiento(o: OperacionHecha): string {
  if (o.clase === 'pago') return o.destino.nombre;
  if (o.clase === 'compra') return `Compra de ${fmt.monto(o.recibe, o.destino.divisa)}`;
  if (o.clase === 'venta') return `Venta a tu ${o.destino.nombre}`;
  return `Pasar a tu ${o.destino.nombre}`;
}

// ------------------------------------------------------ Pantalla inicial
export interface VistaArquetipo {
  id: ArquetipoId;
  href: string;
  empresa: string;
  persona: string;
  iniciales: string;
  contexto: string[];
  cta: string;
}

/** Tarjetas de la pantalla inicial: una por empresa de ejemplo, con su contexto y el CTA "Entrar como …". */
export function vistaArquetipos(): VistaArquetipo[] {
  return ARQUETIPO_IDS.map((id) => {
    const a = arquetipoDe(id);
    return { id, href: `/${id}`, empresa: a.empresa, persona: `${a.usuario.nombre} · ${a.usuario.rol}`, iniciales: a.usuario.iniciales, contexto: a.contexto, cta: `Entrar como ${a.usuario.nombre}` };
  });
}

/** El estado base de un arquetipo (para calcular contexto fuera de la app, p. ej. en tests). */
export const estadoBaseDe = (id: ArquetipoId) => estadoInicial('faltante', {}, id);

// ------------------------------------------------------------------ Panel
export interface VistaOpcionOrigen {
  id: CuentaId;
  nombre: string;
  saldo: string;
  pagas: string;
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string };
  seleccionada: boolean;
  /** Sin saldo en la divisa del pago: no se puede elegir (D-31). */
  deshabilitada: boolean;
}

export interface VistaOpcionPago {
  id: string;
  destinatario: string;
  monto: string;
  /** "Vence vie 9 · Reserva 88213 · usa ≈ 89,250.00 MXN" */
  linea: string;
  consecuencia: { texto: string; tono: TonoBadge };
  seleccionada: boolean;
}

export interface VistaFecha { fecha: Date; etiqueta: string; vence: boolean; seleccionada: boolean; deshabilitada: boolean; motivo?: string }

export interface GrupoDestino {
  titulo: string;
  items: { id: string; divisa: Divisa; nombre: string; sub: string; seleccionado: boolean; destino: Destino; pago?: PagoFuturo }[];
}

export interface VistaPanel {
  tipo: 'pago' | 'depositar' | 'detalle' | 'agendar';
  titulo: string;
  sub: string;
  paso: EstadoApp['panel']['paso'];
  sinTdc: boolean;
  mercadoCerrado: boolean;
  /** pagar: abre el flujo de pago con `orden` (detalle de un pendiente o "Pagar ahora" tras agendar) · continuarPago: del paso Pago al Origen. */
  primario: { label: string; habilitado: boolean; accion: 'continuar' | 'continuarPago' | 'pedirPrecio' | 'confirmar' | 'volverInicio' | 'cerrar' | 'pagar' | 'agendar' | 'confirmarCancelacion' | 'ninguna' };
  secundario: { label: string; accion: 'cancelar' | 'volver' | 'volverOrigen' | 'comprobante' | 'volverDestino' | 'volverPago' | 'cancelarPactada' | 'pagar' } | null;
  destino: { titulo: string; busqueda: string; grupos: GrupoDestino[] } | null;
  /** Paso "¿Qué pagas con este cobro?" (entrada desde "Usar para pagar", D-30). */
  pago: { titulo: string; opciones: VistaOpcionPago[]; resto: string | null; otro: { label: string } } | null;
  origenes: VistaOpcionOrigen[];
  revision: {
    /** Sin factura: los dos montos se editan ("Recibe" y "Pagas"); el que escribes queda fijo y el otro se recalcula con el indicativo. */
    editable: boolean;
    pagas: Centavos; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; ladoFijo: 'recibe' | 'pagas'; destinatario: string;
    fechas: VistaFecha[]; fechaEsHoy: boolean; fechaDia: string; hoyNoAlcanza: boolean;
    texto: string; ayuda: string | null; efecto: string; posVencimiento: string | null;
    tdc: TdcMicro | null; concepto: string; referencia: string;
  } | null;
  precio: {
    estado: 'fijo' | 'vencido' | 'sinTdc'; tdc: TdcMicro | null; segundos: number; porVencer: boolean; pausado: boolean;
    pagas: Centavos; pagasAprox: boolean; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; destinatario: string; desde: string; sale: string | null;
    token: string; tokenError: string | null; confirmando: boolean;
  } | null;
  confirmacion: VistaConfirmacion | null;
  depositar: { cuenta: string; clabe: string; banco: string } | null;
  /** Detalle de una fila de Movimientos; también la confirmación de "Agendar un pago". */
  detalle: VistaDetalle | null;
  /** Paso de datos de "Agendar un pago". */
  agenda: VistaAgenda | null;
}

export interface VistaDetalle {
  clase: 'pendiente' | 'pactada' | 'proceso' | 'cancelada' | 'cobro' | 'pago' | 'agendado';
  icono: 'clock-ten' | 'calendar-alt' | 'check-circle' | 'times-circle' | 'arrow-down';
  titulo: string;
  badge: Badge;
  monto: Centavos;
  divisa: Divisa;
  texto: string | null;
  filas: { k: string; v: string }[];
  fondeo: string | null;
  /** Paso "cancelar": la pregunta antes de cancelar la pactada. */
  pregunta: { titulo: string; texto: string } | null;
  /** Orden para "Pagar" (pendiente) o "Pagar ahora" (agendado). */
  orden: Orden | null;
}

export interface VistaAgenda {
  destinatario: string;
  destinoSub: string;
  divisa: Divisa;
  montoTexto: string;
  montoError: string | null;
  /** yyyy-mm-dd para el input de fecha. */
  fecha: string;
  fechaMin: string;
  fechaMax: string;
  fechaError: string | null;
  concepto: string;
  referencia: string;
  /** Resumen cuando todo está completo. */
  resumen: string | null;
}

export interface VistaConfirmacion {
  estado: 'proceso' | 'pactada';
  clase: Clase;
  titulo: string;
  fechaDia: string;
  tdc: TdcMicro | null;
  pagas: Centavos; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa;
  destino: string; desde: string; referencia: string;
  detalle: { k: string; v: string }[];
  texto: string | null;
  fondeo: string | null;
  comprobante: 'Descargar comprobante' | 'Descargar confirmación';
}

export const tituloDe = (destino: Destino | null) => (!destino ? 'Pagar' : destino.tipo === 'propia' ? `Pasar a tu ${destino.nombre}` : `Pagar a ${destino.nombre}`);

export function gruposDestino(e: EstadoApp, busqueda: string, opciones: { conPagos: boolean; divisa?: Divisa | null; excluirCuentaId?: CuentaId | null; divisaDestinatarios?: Divisa | null; soloDestinatarios?: boolean }): GrupoDestino[] {
  const q = busqueda.trim().toLowerCase();
  const coincide = (n: string) => !q || n.toLowerCase().includes(q);
  const grupos: GrupoDestino[] = [];
  if (opciones.conPagos) {
    const pend = pagosPendientes(e).filter((p) => !p.pactada && coincide(p.destinatario));
    if (pend.length) grupos.push({ titulo: 'Pagos próximos', items: pend.map((p) => ({ id: `pago:${p.id}`, divisa: p.divisa, nombre: p.destinatario, sub: `${fmt.monto(p.monto, p.divisa)} · vence ${fmt.diaCorto(p.fecha)} · ${p.referencia}`, seleccionado: false, destino: destinoDeDestinatario({ id: p.destinatarioId, nombre: p.destinatario, divisa: p.divisa, banco: p.cuentaDestino.banco, mascara: p.cuentaDestino.mascara }), pago: p })) });
  }
  const cuentas = opciones.soloDestinatarios ? [] : e.datos.cuentas.filter((c) => c.id !== opciones.excluirCuentaId && (!opciones.divisa || c.divisa === opciones.divisa) && coincide(c.nombre));
  if (cuentas.length) grupos.push({ titulo: 'Tus cuentas', items: cuentas.map((c) => ({ id: c.id, divisa: c.divisa, nombre: c.nombre, sub: `${c.banco} · **** ${c.mascara}`, seleccionado: false, destino: destinoDeCuenta(c) })) });
  const divisaDest = opciones.divisaDestinatarios ?? opciones.divisa ?? null;
  const dest = e.datos.destinatarios.filter((d) => (!divisaDest || d.divisa === divisaDest) && coincide(d.nombre));
  if (dest.length) grupos.push({ titulo: divisaDest ? `Destinatarios en ${divisaDest}` : 'Destinatarios', items: dest.map((d: Destinatario) => ({ id: d.id, divisa: d.divisa, nombre: d.nombre, sub: `${d.banco} · **** ${d.mascara}`, seleccionado: false, destino: destinoDeDestinatario(d) })) });
  return grupos;
}

export function vistaPanel(e: EstadoApp): VistaPanel | null {
  const { panel } = e;
  if (!panel.abierto) return null;
  const vacio: VistaPanel = { tipo: panel.tipo, titulo: 'Pagar', sub: '', paso: panel.paso, sinTdc: false, mercadoCerrado: e.datos.mercado === 'cerrado', primario: { label: 'Continuar', habilitado: false, accion: 'ninguna' }, secundario: { label: 'Cancelar', accion: 'cancelar' }, destino: null, pago: null, origenes: [], revision: null, precio: null, confirmacion: null, depositar: null, detalle: null, agenda: null };

  if (panel.tipo === 'detalle') return vistaDetallePanel(e, vacio);
  if (panel.tipo === 'agendar') return vistaAgendarPanel(e, vacio);

  if (panel.tipo === 'depositar') {
    const mxn = e.datos.cuentas.find((c) => c.clabe);
    return { ...vacio, titulo: 'Datos para depositar', sub: mxn ? `${mxn.nombre} · **** ${mxn.mascara}` : '', primario: { label: 'Listo', habilitado: true, accion: 'cerrar' }, secundario: null, depositar: mxn ? { cuenta: mxn.nombre, clabe: mxn.clabe!, banco: mxn.banco } : null };
  }

  if (panel.paso === 'pago') return vistaPagoPanel(e, vacio);

  const orden = panel.orden;
  if (panel.paso === 'destino' || !orden) {
    const desdeCobro = !!panel.cobroId && e.datos.loNuevo?.id === panel.cobroId;
    return {
      ...vacio, titulo: 'Pagar', sub: '¿A quién le pagas?', paso: 'destino',
      destino: { titulo: '¿A quién le pagas?', busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { conPagos: true, excluirCuentaId: panel.origenId }) },
      secundario: desdeCobro ? { label: 'Volver', accion: 'volverPago' } : { label: 'Cancelar', accion: 'cancelar' },
    };
  }

  const ctas = cuentasActuales(e);
  const pos = posicionesPorDivisa(e);
  const proy = proyecciones(e);
  const origen = ctas.find((c) => c.id === panel.origenId) ?? null;
  const op = origen ? deducir(origen.divisa, orden.destino.divisa) : null;
  const sinTdc = !!op && op.tipo === 'transferencia';
  const cot = cotizacionPanel(e, panel);
  const cotInd = origen ? cotizar({ origen: origen.divisa, destino: orden.destino.divisa, monto: orden.monto, ladoFijo: orden.ladoFijo, pares: e.tdcVivo }) : null;
  const con = origen ? NOMBRE_DIVISA[origen.divisa].con : '';
  const clase: Clase = origen ? (orden.destino.tipo === 'tercero' ? 'pago' : op?.tipo === 'compra' ? 'compra' : op?.tipo === 'venta' ? 'venta' : 'transferencia') : 'pago';
  const recibeNombre = orden.destino.tipo === 'propia' ? `Tu ${orden.destino.nombre} recibe` : `${orden.destino.nombre} recibe`;
  const titulo = tituloDe(orden.destino);
  const montoRecibe = cotInd ? cotInd.recibe : orden.ladoFijo === 'recibe' ? orden.monto : 0;
  const sub = orden.destino.tipo === 'propia'
    ? `${fmt.monto(montoRecibe, orden.destino.divisa)} · ${orden.destino.banco} **** ${orden.destino.mascara}`
    : [fmt.monto(montoRecibe, orden.destino.divisa), orden.vence ? `vence ${fmt.diaCorto(orden.vence)}` : null, orden.referencia || null].filter(Boolean).join(' · ');
  const ultima = e.operaciones[0] ?? null;

  const cobro = panel.cobroId && e.datos.loNuevo?.id === panel.cobroId ? e.datos.loNuevo : null;
  const origenes: VistaOpcionOrigen[] = ctas
    .filter((c) => c.id !== orden.destino.cuentaId)
    .map((c) => {
      const ev = evaluarOrigen({ origen: c, monto: montoRecibe, divisaDestino: orden.destino.divisa, destinoPropio: orden.destino.tipo === 'propia', pagoCargado: !!orden.pagoId, posiciones: pos, proyecciones: proy, pares: e.tdcVivo });
      const deshabilitada = origenDeshabilitado(c, orden);
      const saldo = `Saldo ${fmt.monto(c.saldo, c.divisa)}${cobro && cobro.cuentaId === c.id ? ' · incluye el cobro de hoy' : ''}`;
      const consecuencia = deshabilitada ? { texto: 'Sin saldo', tono: 'neutral' as const } : { texto: ev.consecuencia.texto, tono: tonoBadge[ev.consecuencia.tono], ayuda: ev.consecuencia.ayuda };
      return { id: c.id, nombre: c.nombre, saldo, pagas: montoRecibe > 0 ? ev.pagasTexto : 'El monto se elige después', consecuencia, seleccionada: c.id === panel.origenId, deshabilitada };
    });

  const hoyNoAlcanza = !!origen && !!cotInd && cotInd.pagas > origen.saldo;
  const fechasBase = fechasLiquidacion(HOY, orden.vence);
  const fechas: VistaFecha[] = fechasBase.map((f) => ({ ...f, seleccionada: mismoDia(f.fecha, panel.fechaValor), deshabilitada: hoyNoAlcanza && f.etiqueta === 'Hoy', motivo: hoyNoAlcanza && f.etiqueta === 'Hoy' ? 'Hoy no alcanza el saldo' : undefined }));
  const fechaEsHoy = mismoDia(panel.fechaValor, HOY);
  const fechaDia = fechas.find((f) => f.seleccionada)?.etiqueta ?? fmt.diaCorto(panel.fechaValor);
  const posVencimiento = orden.vence && panel.fechaValor.getTime() > new Date(orden.vence.getFullYear(), orden.vence.getMonth(), orden.vence.getDate(), 23, 59).getTime() ? `El dinero sale después del vencimiento (${fmt.diaCorto(orden.vence)}).` : null;

  let revision: VistaPanel['revision'] = null;
  if (panel.paso === 'revision' && origen && cotInd) {
    const tdcInd = cotInd.tdc;
    let texto: string;
    let ayuda: string | null = null;
    const recibeTxt = fmt.monto(cotInd.recibe, orden.destino.divisa);
    if (sinTdc) texto = `Vas a ${orden.destino.tipo === 'propia' ? 'pasar' : 'pagar'} ${recibeTxt} desde tu ${origen.nombre}, sin tipo de cambio.`;
    else if (fechaEsHoy) {
      texto = clase === 'venta'
        ? `Vas a vender ${fmt.monto(cotInd.pagas, origen.divisa)}. Recibes ${recibeTxt} a ${fmt.tdc(tdcInd ?? 0)} MXN.`
        : `Vas a ${clase === 'pago' ? 'pagar' : 'comprar'} ${recibeTxt} con ${con}. Compras los ${NOMBRE_DIVISA[orden.destino.divisa].con} a ${fmt.tdc(tdcInd ?? 0)} MXN.`;
    } else {
      const envio = orden.destino.tipo === 'propia' ? `entran ${recibeTxt} a tu ${orden.destino.nombre}` : `se envía el pago a ${orden.destino.nombre}`;
      texto = fmt.oracion(`Cierras hoy el precio de ${recibeTxt}. El ${fechaDia} salen ≈ ${fmt.monto(cotInd.pagas, origen.divisa)} de tu ${origen.nombre} y ${envio}`);
      ayuda = hoyNoAlcanza ? `Hoy no tienes el saldo. Fondea ${fmt.monto(cotInd.pagas, origen.divisa)} antes del ${fechaDia}.` : `Hoy tienes el saldo. Asegúrate de que siga en tu cuenta el ${fechaDia}.`;
    }
    const queda = fmt.monto(origen.saldo - cotInd.pagas, origen.divisa);
    const efecto = fechaEsHoy ? `Tu cuenta en ${con} queda en ≈ ${queda}.` : `El ${fechaDia} tu cuenta en ${con} queda en ≈ ${queda}.`;
    revision = {
      editable: !orden.conFactura,
      pagas: cotInd.pagas, pagasDivisa: origen.divisa, recibe: cotInd.recibe, recibeDivisa: orden.destino.divisa, ladoFijo: orden.ladoFijo, destinatario: recibeNombre,
      fechas: sinTdc ? [] : fechas, fechaEsHoy, fechaDia, hoyNoAlcanza, texto, ayuda, efecto, posVencimiento: sinTdc ? null : posVencimiento,
      tdc: sinTdc ? null : tdcInd, concepto: orden.motivo ?? '', referencia: orden.referencia,
    };
  }

  let precio: VistaPanel['precio'] = null;
  if (panel.paso === 'precio' && origen && cotInd) {
    const fijo = panel.precio.estado === 'fijo' ? panel.precio : null;
    const vencido = panel.precio.estado === 'vencido' ? panel.precio : null;
    const estadoPrecio = sinTdc ? 'sinTdc' : fijo ? 'fijo' : 'vencido';
    const cotFija = fijo && cot ? cot : null;
    precio = {
      estado: estadoPrecio, tdc: fijo ? fijo.tdc : vencido ? vencido.tdc : cotInd.tdc, segundos: fijo ? fijo.venceEn : 0, porVencer: !!fijo && fijo.venceEn <= 30, pausado: e.pausado,
      pagas: cotFija ? cotFija.pagas : cotInd.pagas, pagasAprox: !fijo && !sinTdc, pagasDivisa: origen.divisa, recibe: cotFija ? cotFija.recibe : cotInd.recibe, recibeDivisa: orden.destino.divisa, destinatario: recibeNombre, desde: origen.nombre,
      sale: fechaEsHoy || sinTdc ? null : `El dinero sale el ${fechaDia}`,
      token: panel.token, tokenError: panel.tokenError, confirmando: panel.confirmando,
    };
  }

  let confirmacion: VistaPanel['confirmacion'] = null;
  if (panel.paso === 'confirmacion' && ultima) confirmacion = vistaConfirmacion(e, ultima);

  const tokenListo = panel.token.length === 6 && !panel.confirmando;
  const mercadoCerrado = e.datos.mercado === 'cerrado';
  // Sin factura el monto se elige en la revisión, así que desde Origen se puede continuar con monto 0; para pedir precio sí hace falta un monto.
  const puedeContinuar = !!origen && !!cotInd && (cotInd.recibe > 0 || !orden.conFactura);
  const puedePedir = !!origen && !!cotInd && cotInd.recibe > 0;
  const primario: VistaPanel['primario'] =
    panel.paso === 'origen' ? { label: 'Continuar', habilitado: puedeContinuar, accion: 'continuar' }
      : panel.paso === 'revision' ? (sinTdc ? { label: 'Continuar', habilitado: puedePedir, accion: 'pedirPrecio' } : { label: 'Pedir precio', habilitado: puedePedir && !mercadoCerrado, accion: 'pedirPrecio' })
        : panel.paso === 'precio' ? (panel.precio.estado === 'vencido' ? { label: 'Pedir precio', habilitado: !mercadoCerrado, accion: 'pedirPrecio' } : { label: panel.confirmando ? 'Confirmando…' : 'Confirmar pago', habilitado: tokenListo, accion: 'confirmar' })
          : { label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' };
  const secundario: VistaPanel['secundario'] =
    panel.paso === 'origen' ? { label: orden.pagoId || orden.destino.tipo === 'propia' ? 'Cancelar' : 'Volver', accion: orden.pagoId || orden.destino.tipo === 'propia' ? 'cancelar' : 'volverDestino' }
      : panel.paso === 'revision' ? { label: 'Volver', accion: 'volverOrigen' }
        : panel.paso === 'precio' ? { label: 'Volver', accion: 'volver' }
          : { label: confirmacion?.comprobante ?? 'Descargar comprobante', accion: 'comprobante' };

  return { ...vacio, titulo, sub: panel.paso === 'confirmacion' && orden.destino.tipo === 'tercero' ? [fmt.monto(montoRecibe, orden.destino.divisa), orden.referencia || null].filter(Boolean).join(' · ') : sub, paso: panel.paso, sinTdc, mercadoCerrado, primario, secundario, origenes, revision, precio, confirmacion };
}

export function vistaConfirmacion(e: EstadoApp, o: OperacionHecha): VistaConfirmacion {
  const origen = cuentaPorId(e, o.origenId)!;
  const dia = fmt.diaCorto(o.fechaValor);
  const pactada = o.estado === 'Pactada';
  const recibe = fmt.monto(o.recibe, o.destino.divisa);
  const pagas = fmt.monto(o.pagas, origen.divisa);
  const sustantivo = o.clase === 'pago' ? 'Pago' : o.clase === 'compra' ? 'Compra' : o.clase === 'venta' ? 'Venta' : 'Transferencia';
  const titulo = pactada ? `${sustantivo} pactad${sustantivo === 'Pago' ? 'o' : 'a'}` : `${sustantivo} en proceso`;
  const destino = o.destino.tipo === 'propia' ? `tu ${o.destino.nombre}` : o.destino.nombre;
  const detalle = [
    { k: o.clase === 'compra' ? 'Compraste' : o.clase === 'venta' ? 'Vendiste' : o.clase === 'transferencia' ? 'Pasaste' : 'Enviaste', v: o.clase === 'venta' ? `${pagas} desde tu ${origen.nombre}` : `${recibe} a ${destino}` },
    { k: o.clase === 'venta' ? 'Recibes' : 'Pagaste', v: o.clase === 'venta' ? recibe : pagas },
    ...(o.tdc != null ? [{ k: 'TDC', v: fmt.tdc(o.tdc) }] : []),
    ...(o.motivo ? [{ k: 'Concepto', v: o.motivo }] : []),
    { k: 'Referencia', v: o.referencia || '—' },
  ];
  const envio = o.destino.tipo === 'propia' ? `entran ${recibe} a ${destino}` : `se envían ${recibe} a ${destino}`;
  return {
    estado: pactada ? 'pactada' : 'proceso', clase: o.clase, titulo, fechaDia: dia, tdc: o.tdc, pagas: o.pagas, pagasDivisa: origen.divisa, recibe: o.recibe, recibeDivisa: o.destino.divisa,
    destino, desde: origen.nombre, referencia: o.referencia, detalle,
    texto: pactada ? fmt.oracion(`Cerraste el precio en ${o.tdc != null ? fmt.tdc(o.tdc) : '—'}. El ${dia} salen ${pagas} de tu ${origen.nombre} y ${envio}`) : null,
    fondeo: pactada ? `Ten ${pagas} en tu ${origen.nombre} el ${dia} para que el pago salga.` : null,
    comprobante: pactada ? 'Descargar confirmación' : 'Descargar comprobante',
  };
}

// ------------------------------------- Paso "¿Qué pagas con este cobro?"
/** Entrada desde el cobro de hoy: cada pago pendiente con cuánto del cobro usa y su consecuencia; el faltante viene seleccionado (D-30). */
function vistaPagoPanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const cobro = e.datos.loNuevo;
  if (!cobro) return { ...vacio, titulo: 'Usar el cobro', sub: 'No hay un cobro de hoy.', primario: { label: 'Cerrar', habilitado: true, accion: 'cerrar' }, secundario: null };
  const cuenta = cuentaPorId(e, cobro.cuentaId)!;
  const opciones = opcionesDelCobro(e, cobro);
  const elegida = opciones.find((o) => o.pago.id === e.panel.pagoElegidoId) ?? null;
  const vistaOpciones: VistaOpcionPago[] = opciones.map((o) => ({
    id: o.pago.id,
    destinatario: o.pago.destinatario,
    monto: fmt.monto(o.pago.monto, o.pago.divisa),
    linea: [`Vence ${fmt.diaCorto(o.pago.fecha)}`, o.pago.referencia || null, o.usa != null ? `${o === elegida ? 'usa' : 'usaría'} ${o.aprox ? '≈ ' : ''}${fmt.monto(o.usa, cobro.divisa)}` : null].filter(Boolean).join(' · '),
    consecuencia: { texto: o.consecuencia.texto, tono: tonoBadge[o.consecuencia.tono] },
    seleccionada: o === elegida,
  }));
  const resto = elegida?.usa != null
    ? elegida.usa > cobro.monto
      ? `El cobro no cubre este pago: faltan ${fmt.monto(elegida.usa - cobro.monto, cobro.divisa)}.`
      : `Del cobro quedan ${elegida.aprox ? '≈ ' : ''}${fmt.monto(cobro.monto - elegida.usa, cobro.divisa)} en tu ${cuenta.nombre}.`
    : null;
  return {
    ...vacio, tipo: 'pago', paso: 'pago',
    titulo: `Usar el cobro de ${cobro.de}`,
    sub: `${fmt.montoSigno(cobro.monto, cobro.divisa)} · Hoy ${cobro.hora} · Ref. ${cobro.referencia}`,
    pago: { titulo: '¿Qué pagas con este cobro?', opciones: vistaOpciones, resto, otro: { label: 'Pagar a otro destinatario' } },
    primario: { label: 'Continuar', habilitado: !!elegida && elegida.usa != null && elegida.usa <= cobro.monto, accion: 'continuarPago' },
    secundario: { label: 'Cancelar', accion: 'cancelar' },
  };
}

// ------------------------------------------------------- Detalle de movimiento
const cuentaDe = (e: EstadoApp, divisa: Divisa) => e.datos.cuentas.find((c) => c.divisa === divisa) ?? null;
const conCuenta = (nombre: string, banco: string, mascara: string) => `${nombre} · ${banco} **** ${mascara}`;

/** Filas del detalle de una operación hecha desde el panel o el clásico (en proceso, pactada o cancelada). */
function filasOperacion(e: EstadoApp, o: OperacionHecha): { k: string; v: string }[] {
  const origen = cuentaPorId(e, o.origenId)!;
  const destino = o.destino.tipo === 'propia' ? `Tu ${o.destino.nombre} · **** ${o.destino.mascara}` : conCuenta(o.destino.nombre, o.destino.banco, o.destino.mascara);
  return [
    { k: o.clase === 'pago' ? 'Destinatario' : 'Destino', v: destino },
    { k: o.estado === 'Pactada' ? 'Sale el' : 'Fecha', v: o.estado === 'Pactada' ? fmt.fechaLarga(o.fechaValor) : `Hoy ${o.hora}` },
    { k: o.clase === 'venta' ? 'Vendes' : 'Pagas', v: `${fmt.monto(o.pagas, origen.divisa)} desde tu ${origen.nombre}` },
    { k: o.clase === 'venta' ? 'Recibes' : o.destino.tipo === 'propia' ? 'Entran' : 'Recibe', v: fmt.monto(o.recibe, o.destino.divisa) },
    ...(o.tdc != null ? [{ k: 'TDC', v: fmt.tdc(o.tdc) }] : []),
    ...(o.motivo ? [{ k: 'Concepto', v: o.motivo }] : []),
    { k: 'Referencia', v: o.referencia || '—' },
    ...(o.estado === 'Pactada' ? [{ k: 'Pactada', v: `Hoy ${o.hora}` }] : []),
    ...(o.estado === 'Cancelada' && o.cancelada ? [{ k: 'Cancelada', v: `Hoy ${o.cancelada}` }] : []),
  ];
}

const sustantivoDe = (clase: Clase) => (clase === 'pago' ? 'Pago' : clase === 'compra' ? 'Compra' : clase === 'venta' ? 'Venta' : 'Transferencia');
const participio = (clase: Clase, raiz: string) => `${raiz}${clase === 'pago' ? 'o' : 'a'}`;

/** Detalle de un pago cargado todavía pendiente (del escenario o agendado). */
function detallePendiente(e: EstadoApp, p: PagoFuturo, agendado: boolean): VistaDetalle {
  const cot = p.divisa !== 'MXN' ? cotizar({ origen: 'MXN', destino: p.divisa, monto: p.monto, ladoFijo: 'recibe', pares: e.tdcVivo }) : null;
  return {
    clase: agendado ? 'agendado' : 'pendiente', icono: agendado ? 'calendar-alt' : 'clock-ten', titulo: agendado ? 'Pago agendado' : 'Pago pendiente', badge: { texto: 'Pendiente', tono: 'neutral' },
    monto: -p.monto, divisa: p.divisa,
    texto: agendado ? `Ya está en Próximos. Puedes pagarlo ahora o cuando quieras antes del ${fmt.diaCorto(p.fecha)}.` : `Vence el ${fmt.fechaLarga(p.fecha)}. Elige desde qué cuenta pagarlo cuando quieras.`,
    filas: [
      { k: 'Destinatario', v: conCuenta(p.destinatario, p.cuentaDestino.banco, p.cuentaDestino.mascara) },
      { k: 'Monto', v: fmt.monto(p.monto, p.divisa) },
      { k: 'Vence', v: fmt.fechaLarga(p.fecha) },
      ...(p.motivo ? [{ k: 'Concepto', v: p.motivo }] : []),
      { k: 'Referencia', v: p.referencia || '—' },
      ...(cot ? [{ k: 'Con pesos, hoy', v: `≈ ${fmt.monto(cot.pagas, 'MXN')}` }] : []),
    ],
    fondeo: null, pregunta: null, orden: ordenDePago(p),
  };
}

function detalleOperacion(e: EstadoApp, o: OperacionHecha, pregunta: boolean): VistaDetalle {
  const origen = cuentaPorId(e, o.origenId)!;
  const sustantivo = sustantivoDe(o.clase);
  const conf = vistaConfirmacion(e, o);
  const base = { monto: -o.pagas, divisa: origen.divisa, filas: filasOperacion(e, o), orden: null };
  if (o.estado === 'Pactada') {
    const dia = fmt.diaCorto(o.fechaValor);
    const efecto = o.destino.tipo === 'propia' ? `no entran ${fmt.monto(o.recibe, o.destino.divisa)} a tu ${o.destino.nombre}` : `no sale dinero de tu ${origen.nombre}`;
    const vuelve = o.pagoId ? ` El pago a ${o.destino.nombre} vuelve a Próximos como pendiente y ${efecto} el ${dia}.` : ` El ${dia} ${efecto}.`;
    return {
      ...base, clase: 'pactada', icono: 'calendar-alt', titulo: `${sustantivo} ${participio(o.clase, 'pactad')}`, badge: { texto: 'Pactada', tono: 'pactada' },
      texto: conf.texto, fondeo: conf.fondeo,
      pregunta: pregunta ? { titulo: `¿Cancelar ${o.clase === 'pago' ? 'el pago pactado' : `la ${sustantivo.toLowerCase()} pactada`}?`, texto: `Se libera el precio de ${o.tdc != null ? fmt.tdc(o.tdc) : '—'} que cerraste hoy.${vuelve}` } : null,
    };
  }
  if (o.estado === 'Cancelada') {
    return {
      ...base, clase: 'cancelada', icono: 'times-circle', titulo: `${sustantivo} ${participio(o.clase, 'cancelad')}`, badge: { texto: 'Cancelada', tono: 'neutral' },
      texto: o.pagoId ? `El pago a ${o.destino.nombre} volvió a Próximos como pendiente. No salió dinero de tu ${origen.nombre}.` : `No salió dinero de tu ${origen.nombre}.`,
      fondeo: null, pregunta: null,
    };
  }
  return {
    ...base, clase: 'proceso', icono: 'check-circle', titulo: `${sustantivo} en proceso`, badge: { texto: 'En proceso', tono: 'warning' },
    texto: 'Te avisamos cuando Banco BASE confirme el envío.', fondeo: null, pregunta: null,
  };
}

function detalleRealizado(e: EstadoApp, r: Realizado): VistaDetalle {
  const cuenta = cuentaDe(e, r.divisa);
  const propia = cuenta ? `${cuenta.nombre} · **** ${cuenta.mascara}` : '—';
  const cobro = r.tipo === 'cobro';
  return {
    clase: cobro ? 'cobro' : 'pago', icono: cobro ? 'arrow-down' : 'check-circle', titulo: cobro ? 'Cobro confirmado' : 'Pago enviado', badge: { texto: r.estado, tono: 'success' },
    monto: r.monto, divisa: r.divisa,
    texto: cobro ? `Ya está disponible en tu ${cuenta?.nombre ?? 'cuenta'}.` : `Banco BASE confirmó el envío.`,
    filas: [
      { k: cobro ? 'De' : 'Para', v: conCuenta(r.nombre, r.banco, r.mascara) },
      { k: 'Monto', v: fmt.montoSigno(r.monto, r.divisa) },
      { k: 'Fecha', v: `${mismoDia(r.fecha, HOY) ? 'Hoy' : fmt.fechaLarga(r.fecha)}, ${r.hora}` },
      ...(r.motivo ? [{ k: 'Concepto', v: r.motivo }] : []),
      { k: 'Referencia', v: r.referencia },
      { k: cobro ? 'A' : 'Desde', v: propia },
      { k: 'Estado', v: r.estado },
    ],
    fondeo: null, pregunta: null, orden: null,
  };
}

/** Panel "detalle": una fila de Movimientos abierta; con paso "cancelar" muestra la pregunta antes de cancelar una pactada. */
function vistaDetallePanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const { panel } = e;
  const mov = panel.movimientoId ? movimientoDe(e, panel.movimientoId) : null;
  if (!mov) return { ...vacio, titulo: 'Movimiento', sub: 'No encontramos este movimiento.', primario: { label: 'Cerrar', habilitado: true, accion: 'cerrar' }, secundario: null };
  const cancelando = panel.paso === 'cancelar';
  let detalle: VistaDetalle;
  let titulo: string;
  let sub: string;
  if (mov.tipo === 'pago') {
    const p = mov.pago;
    detalle = detallePendiente(e, p, p.id.startsWith('a'));
    titulo = p.destinatario;
    sub = [fmt.monto(p.monto, p.divisa), `vence ${fmt.diaCorto(p.fecha)}`, p.referencia || null].filter(Boolean).join(' · ');
  } else if (mov.tipo === 'operacion') {
    const o = mov.op;
    const origen = cuentaPorId(e, o.origenId)!;
    detalle = detalleOperacion(e, o, cancelando);
    titulo = nombreMovimiento(o);
    sub = [fmt.monto(o.pagas, origen.divisa), o.estado === 'Pactada' ? `sale el ${fmt.diaCorto(o.fechaValor)}` : `Hoy ${o.estado === 'Cancelada' && o.cancelada ? o.cancelada : o.hora}`, o.referencia || null].filter(Boolean).join(' · ');
  } else {
    const r = mov.realizado;
    detalle = detalleRealizado(e, r);
    titulo = r.tipo === 'cobro' ? `Cobro de ${r.nombre}` : `Pago a ${r.nombre}`;
    sub = `${mismoDia(r.fecha, HOY) ? 'Hoy' : fmt.diaCorto(r.fecha)} ${r.hora} · ${r.banco} **** ${r.mascara}`;
  }
  const cerrar = { label: 'Cerrar', habilitado: true, accion: 'cerrar' as const };
  const comprobante = { label: 'Descargar comprobante', accion: 'comprobante' as const };
  let primario: VistaPanel['primario'] = cerrar;
  let secundario: VistaPanel['secundario'] = null;
  if (cancelando) {
    primario = { label: panel.cancelando ? 'Cancelando…' : 'Sí, cancelar', habilitado: !panel.cancelando, accion: 'confirmarCancelacion' };
    secundario = { label: 'Volver', accion: 'volverOrigen' };
  } else if (detalle.clase === 'pendiente' || detalle.clase === 'agendado') {
    primario = { label: 'Pagar', habilitado: true, accion: 'pagar' };
    secundario = { label: 'Cerrar', accion: 'cancelar' };
  } else if (detalle.clase === 'pactada') {
    secundario = { label: 'Cancelar pacto', accion: 'cancelarPactada' };
  } else if (detalle.clase === 'proceso' || detalle.clase === 'cobro' || detalle.clase === 'pago') {
    secundario = comprobante;
  }
  return { ...vacio, tipo: 'detalle', titulo, sub, paso: panel.paso, primario, secundario, detalle };
}

// ------------------------------------------------------------ Agendar un pago
const aIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** yyyy-mm-dd del input de fecha → Date local (null si está vacío o es inválido). */
export function fechaDeIso(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Panel "agendar": destino → datos → confirmación (el pago nuevo entra a Próximos y se paga con el flujo de siempre). */
function vistaAgendarPanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const { panel } = e;
  const { agenda } = panel;
  const titulo = 'Agendar un pago';
  if (panel.paso === 'destino' || !agenda.destino) {
    return {
      ...vacio, tipo: 'agendar', titulo, sub: '¿A quién le vas a pagar?', paso: 'destino',
      destino: { titulo: '¿A quién le vas a pagar?', busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { conPagos: false, soloDestinatarios: true }) },
      primario: { label: 'Continuar', habilitado: false, accion: 'ninguna' }, secundario: { label: 'Cancelar', accion: 'cancelar' },
    };
  }
  const d = agenda.destino;
  if (panel.paso === 'confirmacion' && agenda.creado) {
    const pago = e.datos.pagosFuturos.find((p) => p.id === agenda.creado)!;
    return {
      ...vacio, tipo: 'agendar', titulo, sub: [fmt.monto(pago.monto, pago.divisa), `vence ${fmt.diaCorto(pago.fecha)}`, pago.referencia || null].filter(Boolean).join(' · '), paso: 'confirmacion',
      detalle: detallePendiente(e, pago, true),
      primario: { label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' }, secundario: { label: 'Pagar ahora', accion: 'pagar' },
    };
  }
  const monto = leerCentavos(agenda.montoTexto);
  const montoError = agenda.montoTexto && (monto == null || monto <= 0) ? 'Escribe un monto mayor a 0.' : null;
  const validez = agenda.fecha ? fechaAgendable(agenda.fecha) : null;
  const fechaError = validez === 'fin-de-semana' ? 'Elige un día hábil.' : validez === 'fuera-de-rango' ? `Elige una fecha entre hoy y el ${fmt.fechaLarga(fechaMaximaAgendable())}.` : null;
  const pago = pagoAgendado(e);
  const resumen = pago ? `Vence el ${fmt.fechaLarga(pago.fecha)}. Lo verás en Próximos y podrás pagarlo cuando quieras.` : null;
  return {
    ...vacio, tipo: 'agendar', titulo, sub: `${d.nombre} · ${d.banco} **** ${d.mascara}`, paso: 'revision',
    agenda: {
      destinatario: d.nombre, destinoSub: `${d.banco} **** ${d.mascara}`, divisa: d.divisa,
      montoTexto: agenda.montoTexto, montoError,
      fecha: agenda.fecha ? aIso(agenda.fecha) : '', fechaMin: aIso(HOY), fechaMax: aIso(fechaMaximaAgendable()), fechaError,
      concepto: agenda.motivo ?? '', referencia: agenda.referencia, resumen,
    },
    primario: { label: 'Agendar', habilitado: !!pago, accion: 'agendar' }, secundario: { label: 'Volver', accion: 'volverDestino' },
  };
}

// ------------------------------------------------------------------ Operar clásico
export interface VistaOperar {
  tipo: EstadoApp['operar']['tipo'];
  paso: 'formulario' | 'confirmacion';
  tabs: { id: EstadoApp['operar']['tipo']; label: string; activa: boolean }[];
  cerrado: boolean;
  avisoCerrado: { titulo: string; texto: string } | null;
  subtitulo: string;
  mercado: Badge;
  esCambio: boolean;
  par: { valor: string; abierto: boolean; aviso: string | null; grupos: { titulo: string; items: { par: string; nombre: string; seleccionado: boolean }[] }[] };
  labelIzq: string;
  labelDer: string;
  montoIzq: string;
  montoDer: string;
  divIzq: Divisa;
  divDer: Divisa;
  ladoActivo: 'izq' | 'der' | null;
  error: string | null;
  origen: { valor: string | null; abierto: boolean; opciones: { id: CuentaId; nombre: string; sub: string; seleccionado: boolean }[] };
  destino: { valor: string | null; abierto: boolean; busqueda: string; grupos: GrupoDestino[] };
  disponible: string;
  motivo: { valor: string | null; abierto: boolean; opciones: string[] };
  referencia: string;
  vencido: boolean;
  cotizacion: { titulo: string; badge: Badge; izqLabel: string; izq: string; derLabel: string; der: string; vacio: boolean; tdc: { valor: TdcMicro; tipo: string; apagado: boolean } | null; notaTransfer: boolean };
  token: { visible: boolean; valor: string; error: string | null; confirmando: boolean };
  cta: { label: string; habilitado: boolean; accion: 'pedirPrecio' | 'continuar' | 'confirmar' | 'ninguna' };
  nota: string;
  confirmacion: VistaConfirmacion | null;
}

export function avisoMercadoCerrado(): { titulo: string; texto: string } {
  const horario = HORARIO.abre && HORARIO.cierra ? ` Operas de lunes a viernes de ${HORARIO.abre} a ${HORARIO.cierra}, hora de CDMX.` : '';
  return { titulo: 'Mercado cerrado.', texto: `No se puede pedir precio hasta que abra.${horario} Puedes dejar el formulario listo.` };
}

export function vistaOperar(e: EstadoApp): VistaOperar {
  const op = e.operar;
  const ctas = cuentasActuales(e);
  const d = divisasOperar(e, op);
  const esCambio = op.tipo !== 'transferir';
  const cerrado = e.datos.mercado === 'cerrado';
  const origen = ctas.find((c) => c.id === op.origenId) ?? null;
  const destinoCuenta = e.datos.cuentas.find((c) => c.id === op.destinoId);
  const destinoTercero = e.datos.destinatarios.find((x) => x.id === op.destinoId);
  const destinoSel: Destino | null = destinoCuenta ? destinoDeCuenta(destinoCuenta) : destinoTercero ? destinoDeDestinatario(destinoTercero) : null;
  const cIzq = leerMonto(op.montoIzq);
  const cDer = leerMonto(op.montoDer);
  const fijo = op.precio.estado === 'fijo' ? op.precio : null;
  const vencido = op.precio.estado === 'vencido';
  const deducida = esCambio ? deducir(d.origen, d.destino) : null;
  const tdcInd = deducida ? tdcDe(deducida, e.tdcVivo) : null;
  const tdc = fijo ? fijo.tdc : op.precio.estado === 'vencido' ? op.precio.tdc : tdcInd;
  const parSinPrototipo = !!PARES[op.par]?.sinPrototipo;

  let error: string | null = null;
  const sale = op.tipo === 'comprar' ? cDer : cIzq;
  if (origen && sale > 0 && sale > origen.saldo) error = `Supera tu saldo disponible: ${fmt.monto(origen.saldo, origen.divisa)}.`;

  const origenOpciones = ctas.filter((c) => (op.tipo === 'transferir' ? true : c.divisa === d.origen)).map((c) => ({ id: c.id, nombre: c.nombre, sub: `${c.banco} · **** ${c.mascara}`, seleccionado: c.id === op.origenId }));
  const divDestino: Divisa | null = op.tipo === 'transferir' ? (origen?.divisa ?? null) : d.destino;
  const grupos = gruposDestino(e, op.destinoBusqueda, { conPagos: false, divisa: divDestino, excluirCuentaId: op.origenId }).map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, seleccionado: i.id === op.destinoId })) }));

  const completo = cIzq > 0 && !!origen && !!destinoSel && !!op.motivo && !error && !parSinPrototipo && (esCambio ? tdc != null : true);
  const conToken = op.conToken && (esCambio ? !!fijo : true);
  const verbo = op.tipo === 'comprar' ? 'compra' : op.tipo === 'vender' ? 'venta' : 'transferencia';
  const cta: VistaOperar['cta'] = cerrado
    ? { label: esCambio ? 'Pedir precio' : 'Continuar', habilitado: false, accion: 'ninguna' }
    : conToken
      ? { label: op.confirmando ? 'Confirmando…' : `Confirmar ${verbo}`, habilitado: op.token.length === 6 && !op.confirmando, accion: 'confirmar' }
      : esCambio
        ? { label: 'Pedir precio', habilitado: completo, accion: 'pedirPrecio' }
        : { label: 'Continuar', habilitado: completo, accion: 'continuar' };

  const cotVacia = cIzq <= 0;
  const cotizacion: VistaOperar['cotizacion'] = esCambio
    ? {
      titulo: 'Cotización',
      badge: vencido ? { texto: 'Vencido', tono: 'error' } : fijo ? { texto: `Precio fijo por ${fmt.cuentaRegresiva(fijo.venceEn)}`, tono: fijo.venceEn <= 30 ? 'warning' : 'success' } : { texto: 'Precio indicativo', tono: 'info' },
      izqLabel: op.tipo === 'comprar' ? 'Tu compra' : 'Tu venta', izq: fmt.monto(cIzq, d.izq),
      derLabel: op.tipo === 'comprar' ? 'Total a pagar' : 'Recibirás', der: fmt.monto(cDer, d.der),
      vacio: cotVacia,
      tdc: tdc != null ? { valor: tdc, tipo: cerrado ? 'Último cierre' : fijo ? 'Ejecutable' : vencido ? 'Vencido' : 'Indicativo', apagado: vencido } : null,
      notaTransfer: false,
    }
    : {
      titulo: 'Resumen', badge: { texto: 'Sin tipo de cambio', tono: 'neutral' },
      izqLabel: 'Envías', izq: fmt.monto(cIzq, d.izq), derLabel: destinoSel ? `Recibe ${destinoSel.nombre}` : 'Recibe', der: fmt.monto(cIzq, d.der), vacio: cotVacia, tdc: null, notaTransfer: true,
    };

  return {
    tipo: op.tipo,
    paso: op.paso,
    tabs: (['comprar', 'vender', 'transferir'] as const).map((id) => ({ id, label: id === 'comprar' ? 'Comprar' : id === 'vender' ? 'Vender' : 'Transferir', activa: id === op.tipo })),
    cerrado,
    avisoCerrado: cerrado ? avisoMercadoCerrado() : null,
    subtitulo: conToken ? 'Revisa y confirma' : 'Completa los campos',
    mercado: cerrado ? { texto: 'Mercado cerrado', tono: 'warning' } : { texto: 'Mercado abierto', tono: 'success' },
    esCambio,
    par: { valor: op.par, abierto: op.parAbierto, aviso: parSinPrototipo ? AVISO_PAR_SIN_PROTOTIPO : null, grupos: PARES_SELECTOR.map((g) => ({ titulo: g.titulo, items: g.items.map((i) => ({ ...i, seleccionado: i.par === op.par })) })) },
    labelIzq: op.tipo === 'comprar' ? 'Compras' : op.tipo === 'vender' ? 'Vendes' : 'Monto',
    labelDer: op.tipo === 'comprar' ? 'Pagas' : 'Recibes',
    montoIzq: op.montoIzq ? (op.editando === 'izq' && !fijo ? op.montoIzq : fmt.numero(cIzq)) : '',
    montoDer: op.montoDer ? (op.editando === 'der' && !fijo ? op.montoDer : fmt.numero(cDer)) : '',
    divIzq: d.izq, divDer: d.der, ladoActivo: fijo || vencido ? null : op.ladoActivo, error,
    origen: { valor: origen ? etiquetaCuenta(origen) : null, abierto: op.origenAbierto, opciones: origenOpciones },
    destino: { valor: destinoSel ? etiquetaDestino(destinoSel) : null, abierto: op.destinoAbierto, busqueda: op.destinoBusqueda, grupos },
    disponible: origen ? fmt.monto(origen.saldo, origen.divisa) : '',
    motivo: { valor: op.motivo, abierto: op.motivoAbierto, opciones: MOTIVOS },
    referencia: op.referencia,
    vencido,
    cotizacion,
    token: { visible: conToken, valor: op.token, error: op.tokenError, confirmando: op.confirmando },
    cta,
    nota: cerrado ? avisoMercadoCerrado().titulo : esCambio ? 'Ten tu token a mano: el precio dura 2 minutos.' : 'Sin tipo de cambio: te pedimos el token al continuar.',
    confirmacion: op.paso === 'confirmacion' && op.ultima ? vistaConfirmacion(e, op.ultima) : null,
  };
}

function leerMonto(texto: string): Centavos {
  const limpio = texto.replace(/,/g, '').trim();
  if (!limpio) return 0;
  const n = Number(limpio);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
