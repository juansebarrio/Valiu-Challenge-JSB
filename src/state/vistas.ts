// src/state/vistas.ts — selectores puros: del estado a los props de cada componente.
import type { Centavos, TdcMicro } from '@/lib/dinero';
import { cotizar, deducir, ejecutable, fechasLiquidacion, mismoDia, PARES, tdcDe, unidadTdc, type Divisa } from '@/lib/fx';
import * as fmt from '@/lib/format';
import { evaluarOrigen, type Posicion, type Tono } from '@/lib/posicion';
import { HOY, HORARIO, HORA_TDC, NOMBRE_DIVISA, TENDENCIAS, type ArquetipoId, type CuentaId, type Destinatario, type PagoFuturo, type Realizado } from '@/data/escenario';
import { ARQUETIPO_IDS, arquetipoDe } from '@/data/arquetipos';
import { leerCentavos } from '@/lib/dinero';
import { calculoPosiciones, cuentaPorId, cuentasActuales, destinoDeCuenta, destinoDeDestinatario, finDeSemana, movimientoDe, notificaciones, opcionesDelCobro, ordenACuenta, ordenDePago, pactadas, pagoEnPosicion, pagosPendientes, posicionesPorDivisa, proyecciones } from './derivados';
import { comisionPara, cotizacionPanel, divisasCotizador, erroresDestinatario, estadoInicial, fechaAgendable, fechaMaximaAgendable, origenDeshabilitado, pagoAgendado, puedeInvertir, sinParCon, validarCotizador, type Clase, type Destino, type EstadoApp, type OperacionHecha, type Orden } from './estado';


export type TonoBadge = 'success' | 'warning' | 'error' | 'neutral' | 'pactada' | 'info';
export interface Badge { texto: string; tono: TonoBadge }
const tonoBadge: Record<Tono, TonoBadge> = { ok: 'success', warn: 'warning', neutro: 'neutral' };

/** Fila "Comisión": la tasa siempre ("0%") y, si no es 0, el monto en la divisa de la cuenta de origen ("0.50% · 135.69 MXN", C-50). */
export const filaComision = (bp: number, comision: Centavos, divisa: Divisa | null) => ({ k: 'Comisión', v: bp === 0 || !divisa ? fmt.tasa(bp) : `${fmt.tasa(bp)} · ${fmt.monto(comision, divisa)}` });

/** Texto bajo "¿Cuándo sale el dinero?" según lo elegido: el beneficio de elegir otro día (C-51). */
export function notaFechaLiquidacion(fechas: { etiqueta: string; seleccionada: boolean; deshabilitada?: boolean }[]): string {
  if (fechas.some((f) => f.etiqueta === 'Hoy' && f.deshabilitada)) return 'Hoy no te alcanza el saldo. Elige otro día: cierras el precio hoy y fondeas antes de esa fecha.';
  const elegida = fechas.find((f) => f.seleccionada);
  if (!elegida || elegida.etiqueta === 'Hoy') return 'Si eliges otro día, cierras el precio hoy y no necesitas tener el saldo hasta ese día.';
  return `Cierras el precio hoy y el dinero sale el ${elegida.etiqueta}. No necesitas tener el saldo hasta ese día.`;
}

// ------------------------------------------------------------------ Inicio
export interface VistaPosicion {
  id: CuentaId;
  divisa: Divisa;
  nombre: string;
  saldo: Centavos;
  pactadasRecibir: { cantidad: number; total: Centavos } | null;
  pactadasLiquidar: { cantidad: number; total: Centavos } | null;
  pagosFuturos: { cantidad: number; total: Centavos } | null;
  /** Pagos cargados en divisas sin cuenta que paga esta cuenta (la de fondeo), en su divisa y al indicativo de compra (C-54). */
  pagosOtrasDivisas: { cantidad: number; total: Centavos } | null;
  resultado: Posicion['resultado'];
  /** Con pagos en otras divisas el resultado se mueve con el precio y lleva "≈" (C-54). */
  aprox: boolean;
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

/** Cuentas a la vista en el menú lateral; con más, "Ver todas mis cuentas (n)" (C-56). */
export const CUENTAS_EN_MENU = 3;

/** Bloque "Tus cuentas" del menú lateral (C-56): nombre, saldo con lo operado en la sesión y máscara, en el orden de las cuentas. */
export interface VistaMenuCuentas {
  items: { id: CuentaId; nombre: string; saldo: string; mascara: string }[];
  verTodas: string;
}

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
  realizados: VistaFila[];
  tdc: VistaTipoDeCambio;
  cuentas: VistaMenuCuentas;
  totalMXN: Centavos;
}

/** Cotizador de la tarjeta de tipo de cambio (C-53): Recibes y Pagas apilados, invertir, la cuenta de la que sale y Continuar. */
export interface VistaCotizador {
  abierto: boolean;
  recibe: { divisa: Divisa; valor: string };
  pagas: { divisa: Divisa; valor: string };
  ladoFijo: 'recibe' | 'pagas' | null;
  /** Deshabilitado si la empresa no tiene cuenta en la divisa que pagaría. */
  invertir: boolean;
  /** "Desde Cuenta Principal MXN · saldo 1,180,000.00" */
  desde: string | null;
  /** El error de saldo de siempre, bajo el campo. */
  error: string | null;
  mercadoCerrado: { titulo: string; texto: string } | null;
  continuar: boolean;
}

export interface VistaTipoDeCambio {
  par: string;
  compra: TdcMicro;
  venta: TdcMicro;
  tendencia: number[];
  hora: string;
  enVivo: boolean;
  pausado: boolean;
  /** Selector de par (C-53): "Tus pares" (los de tus posiciones y tus pagos cargados) y "Otros pares". */
  selector: { abierto: boolean; grupos: { titulo: string; items: { par: string; seleccionado: boolean }[] }[] };
  /** Líneas compactas de los demás pares de "Tus pares". */
  otros: { par: string; base: Divisa; compra: TdcMicro; venta: TdcMicro }[];
  cotizador: VistaCotizador;
}

/** "Tus pares": los de tus posiciones y los de tus pagos cargados pendientes (con la cuenta de fondeo; GBP/MXN con un pago en libras, C-54). */
export function tusPares(e: EstadoApp): string[] {
  const arq = arquetipoDe(e.arquetipo);
  const fondeo = cuentaPorId(e, e.datos.cuentaFondeo);
  const deLosPagos = fondeo ? pagosPendientes(e).filter((p) => !p.pactada && p.divisa !== fondeo.divisa).map((p) => deducir(fondeo.divisa, p.divisa)?.par ?? null) : [];
  return [...new Set([...arq.paresTarjeta, ...deLosPagos].filter((par): par is string => !!par && !!PARES[par]))];
}

export function vistaTipoDeCambio(e: EstadoApp): VistaTipoDeCambio {
  const c = e.cotizador;
  const tuyos = tusPares(e);
  const otrosPares = Object.keys(PARES).filter((par) => !tuyos.includes(par));
  const t = e.tdcVivo[c.par];
  const item = (par: string) => ({ par, seleccionado: par === c.par });
  const d = divisasCotizador(c);
  const v = validarCotizador(e, c);
  return {
    par: c.par, compra: t.compra, venta: t.venta, tendencia: TENDENCIAS[c.par] ?? [], hora: HORA_TDC, enVivo: !e.congelado, pausado: e.pausado,
    selector: { abierto: c.parAbierto, grupos: [{ titulo: 'Tus pares', items: tuyos.map(item) }, ...(otrosPares.length ? [{ titulo: 'Otros pares', items: otrosPares.map(item) }] : [])] },
    otros: tuyos.filter((par) => par !== c.par).map((par) => ({ par, base: par.split('/')[0] as Divisa, compra: e.tdcVivo[par].compra, venta: e.tdcVivo[par].venta })),
    cotizador: {
      abierto: c.abierto,
      recibe: { divisa: d.recibe, valor: c.recibe },
      pagas: { divisa: d.pagas, valor: c.pagas },
      ladoFijo: c.ladoFijo,
      invertir: puedeInvertir(e, c),
      desde: v.cuenta ? `Desde ${v.cuenta.nombre} · saldo ${fmt.numero(v.cuenta.saldo)}` : null,
      error: v.superaSaldo && v.cuenta ? `Supera tu saldo disponible: ${fmt.monto(v.cuenta.saldo, v.cuenta.divisa)}.` : null,
      mercadoCerrado: e.datos.mercado === 'cerrado' ? avisoMercadoCerrado() : null,
      continuar: v.valido,
    },
  };
}

export function vistaHome(e: EstadoApp): VistaHome {
  const arq = arquetipoDe(e.arquetipo);
  const ctas = cuentasActuales(e);
  const calc = calculoPosiciones(e);
  const pos = calc.porCuenta as Record<CuentaId, Posicion>;
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
        linea = `Fondea ${p.aprox ? '≈ ' : ''}${fmt.monto(p.resultado.monto, 'MXN')}${primera ? ` para el ${fmt.diaCorto(primera.fechaValor)}` : ''}`;
        if (c.clabe) enlace = { label: 'Ver datos para depositar', accion: 'depositar' };
      } else {
        const op = deducir('MXN', c.divisa);
        const t = op ? tdcDe(op, e.tdcVivo) : null;
        const cot = t != null ? cotizar({ origen: 'MXN', destino: c.divisa, monto: p.resultado.monto, ladoFijo: 'recibe', pares: e.tdcVivo }) : null;
        if (cot) linea = `≈ ${fmt.monto(cot.pagas, 'MXN')} a precio de compra`;
        accion = { label: `Comprar ${fmt.compacto(p.resultado.monto)} ${c.divisa}`, orden: ordenACuenta(c, p.resultado.monto) };
      }
    } else if (p.resultado.tipo === 'nada') {
      // Sin pendientes porque el único pago en esta divisa ya se pagó (o pactó) desde otra cuenta: la tarjeta dice con qué.
      const op = e.operaciones.find((o) => o.pagoId && o.destino.divisa === c.divisa && o.origenId !== c.id);
      if (op) {
        const con = NOMBRE_DIVISA[cuentaPorId(e, op.origenId)!.divisa].con;
        linea = op.estado === 'Pactada' ? `${op.destino.nombre}: pactado en ${con}, sale el ${fmt.diaCorto(op.fechaValor)}` : `${op.destino.nombre}: pagado hoy en ${con}`;
      }
    }
    const cruce = pr ? pr.serie.findIndex((v) => v < 0) : -1;
    return {
      id: c.id, divisa: c.divisa, nombre: NOMBRE_DIVISA[c.divisa].plural, saldo: c.saldo,
      pactadasRecibir: p.pactadasRecibir, pactadasLiquidar: p.pactadasLiquidar, pagosFuturos: p.pagosFuturos, pagosOtrasDivisas: p.pagosOtrasDivisas, resultado: p.resultado, aprox: p.aprox,
      proyeccion: pr ? { serie: pr.serie, etiquetas: pr.dias.map(fmt.diaCorto), etiquetaCruce: cruce >= 0 ? 'faltante' : null } : null,
      linea, accion, enlace,
    };
  });

  const finSemana = finDeSemana(HOY);
  // Un pago en una divisa sin cuenta (C-54): el monto en su divisa y, debajo, lo que cuesta hoy en la cuenta que lo paga; sin par, no se paga.
  const otraDivisa = (p: PagoFuturo): Partial<VistaFila> => {
    if (calc.sinPar.includes(p.id)) return { detalle: 'Sin par disponible' };
    const conv = calc.convertidos[p.id];
    const cuenta = conv ? cuentaPorId(e, conv.cuentaId as CuentaId) : null;
    return { orden: ordenDePagoVista(p), ...(conv && cuenta ? { detalle: `≈ ${fmt.monto(conv.monto, cuenta.divisa)} hoy` } : {}) };
  };
  const filasPendientes: VistaFila[] = pendientes.map((p) => ({
    id: p.id, fecha: fmt.diaCorto(p.fecha), nombre: p.destinatario, monto: -p.monto, divisa: p.divisa, estaSemana: p.fecha.getTime() <= finSemana.getTime(),
    ...(p.pactada
      ? { badge: { texto: 'Pactada', tono: 'pactada' as const }, detalle: `${fmt.monto(p.pactada.pagas, cuentaPorId(e, p.pactada.origenId)!.divisa)} a ${fmt.tdc(p.pactada.tdc ?? 0)}` }
      : otraDivisa(p)),
  }));
  // Pactadas a cuentas propias: no tienen fila de pago cargado, así que suman la suya a Próximos.
  const filasPactadasPropias: VistaFila[] = pact.filter((o) => !o.pagoId).map((o) => ({
    id: o.id, fecha: fmt.diaCorto(o.fechaValor), nombre: `Pasar a tu ${o.destino.nombre}`, monto: -o.pagas, divisa: cuentaPorId(e, o.origenId)!.divisa, estaSemana: o.fechaValor.getTime() <= finSemana.getTime(),
    badge: { texto: 'Pactada', tono: 'pactada' as const }, detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
  }));
  const todas = [...filasPendientes, ...filasPactadasPropias].sort((a, b) => ordenFecha(a, e) - ordenFecha(b, e));
  const proximos = todas.filter((f) => f.estaSemana);
  const totales = todas.reduce<{ divisa: Divisa; total: Centavos }[]>((acc, f) => {
    const t = acc.find((x) => x.divisa === f.divisa);
    if (t) t.total += -f.monto; else acc.push({ divisa: f.divisa, total: -f.monto });
    return acc;
  }, []);
  const resumenProximos = todas.length ? `${todas.length} ${todas.length === 1 ? 'pago próximo' : 'pagos próximos'} · ${totales.map((t) => fmt.monto(t.total, t.divisa)).join(' · ')}` : 'Sin pagos próximos.';

  // Hoy: lo que salió (En proceso).
  const hechas: VistaFila[] = e.operaciones.filter((o) => o.estado !== 'Pactada').map((o) => {
    const origen = cuentaPorId(e, o.origenId)!;
    return {
      id: o.id, fecha: 'Hoy', nombre: nombreMovimiento(o), monto: -o.pagas, divisa: origen.divisa, estaSemana: true,
      detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
      badge: { texto: 'En proceso', tono: 'warning' as const },
    };
  });
  const pasados: VistaFila[] = e.datos.realizados.map((r) => ({ id: r.id, fecha: mismoDia(r.fecha, HOY) ? 'Hoy' : fmt.diaMes(r.fecha), nombre: r.nombre, monto: r.monto, divisa: r.divisa, estaSemana: true }));

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
    realizados: [...hechas, ...pasados],
    tdc: vistaTipoDeCambio(e),
    cuentas: {
      items: ctas.slice(0, CUENTAS_EN_MENU).map((c) => ({ id: c.id, nombre: c.nombre, saldo: fmt.monto(c.saldo, c.divisa), mascara: `····${c.mascara}` })),
      verTodas: ctas.length > CUENTAS_EN_MENU ? `Ver todas mis cuentas (${ctas.length})` : 'Ver todas mis cuentas',
    },
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

// ------------------------------------------------- Secciones del menú lateral
export interface VistaControl {
  resumen: string;
  grupos: { titulo: string; filas: VistaFila[]; vacio: string }[];
}

/** Control de operaciones: todo lo operado en la sesión por estado, más lo realizado antes de hoy. */
export function vistaControl(e: EstadoApp): VistaControl {
  const h = vistaHome(e);
  const filaDe = (o: OperacionHecha): VistaFila => {
    const origen = cuentaPorId(e, o.origenId)!;
    return {
      id: o.id, fecha: o.estado === 'Pactada' ? fmt.diaCorto(o.fechaValor) : 'Hoy', nombre: nombreMovimiento(o), monto: -o.pagas, divisa: origen.divisa, estaSemana: true,
      detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
      badge: o.estado === 'Pactada' ? { texto: 'Pactada', tono: 'pactada' } : { texto: 'En proceso', tono: 'warning' },
    };
  };
  const pact = e.operaciones.filter((o) => o.estado === 'Pactada').map(filaDe);
  const proc = e.operaciones.filter((o) => o.estado === 'En proceso').map(filaDe);
  const previas = h.realizados.filter((f) => f.fecha !== 'Hoy' || !e.operaciones.some((o) => o.id === f.id)).filter((f) => !e.operaciones.some((o) => o.id === f.id));
  const n = e.operaciones.length;
  return {
    resumen: n ? `${n} ${n === 1 ? 'operación' : 'operaciones'} hoy · ${proc.length} en proceso · ${pact.length} ${pact.length === 1 ? 'pactada' : 'pactadas'}` : 'Todavía no operaste hoy.',
    grupos: [
      { titulo: `Pactadas (${pact.length})`, filas: pact, vacio: 'Sin pagos pactados. Al elegir otra fecha en la revisión, la operación queda acá hasta que salga el dinero.' },
      { titulo: `En proceso (${proc.length})`, filas: proc, vacio: 'Nada en proceso.' },
      { titulo: `Realizadas (${previas.length})`, filas: previas, vacio: 'Sin movimientos anteriores.' },
    ],
  };
}

export interface VistaDestinatario {
  id: string;
  nombre: string;
  divisa: Divisa;
  cuenta: string;
  pendientes: string | null;
}

/** Destinatarios: la lista con su cuenta y lo que tienen pendiente; "Pagar" abre la ventana de pago sin monto. */
export function vistaDestinatarios(e: EstadoApp): { resumen: string; items: VistaDestinatario[] } {
  const pend = pagosPendientes(e).filter((p) => !p.pactada);
  const items = e.datos.destinatarios.map((d) => {
    const suyos = pend.filter((p) => p.destinatarioId === d.id);
    const total = suyos.reduce((acc, p) => acc + p.monto, 0);
    return { id: d.id, nombre: d.nombre, divisa: d.divisa, cuenta: `${d.banco} · **** ${d.mascara}`, pendientes: suyos.length ? `${suyos.length} ${suyos.length === 1 ? 'pago pendiente' : 'pagos pendientes'} · ${fmt.monto(total, d.divisa)}` : null };
  });
  return { resumen: `${items.length} destinatarios`, items };
}

export interface VistaParMonitoreo {
  par: string;
  base: Divisa;
  cotizada: Divisa;
  compra: TdcMicro;
  venta: TdcMicro;
  /** Ejecutables con los factores de fx.ts, para que se vea el spread sobre el indicativo. */
  ejecutableCompra: TdcMicro;
  ejecutableVenta: TdcMicro;
  tendencia: number[] | null;
  enPosiciones: boolean;
}

/** Monitoreo de divisas: los pares operables con sus dos lados y el ejecutable que saldría ahora mismo. */
export function vistaMonitoreo(e: EstadoApp): { estado: 'vivo' | 'congelado' | 'pausa'; hora: string; pares: VistaParMonitoreo[] } {
  const arq = arquetipoDe(e.arquetipo);
  const operables = Object.keys(PARES);
  const pares = [...arq.paresTarjeta, ...operables.filter((p) => !arq.paresTarjeta.includes(p))].map((par) => {
    const [base, cotizada] = par.split('/') as [Divisa, Divisa];
    const t = e.tdcVivo[par];
    return { par, base, cotizada, compra: t.compra, venta: t.venta, ejecutableCompra: ejecutable(t.compra, 'comprar'), ejecutableVenta: ejecutable(t.venta, 'vender'), tendencia: par === arq.paresTarjeta[0] ? TENDENCIAS[par] ?? null : null, enPosiciones: arq.paresTarjeta.includes(par) };
  });
  return { estado: e.pausado ? 'pausa' : e.congelado ? 'congelado' : 'vivo', hora: HORA_TDC, pares };
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

// ------------------------------------------------ Ventana de pago y panel lateral (C-47)
export interface VistaOpcionOrigen {
  id: CuentaId;
  nombre: string;
  saldo: string;
  /** "Pagas ≈ X" con monto; vacío sin monto (C-49). */
  pagas: string;
  /** Un chip como máximo, solo si cambia la decisión, o el motivo de la cuenta deshabilitada; null sin monto (C-49). */
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string } | null;
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
  /** Un chip como máximo: success o warning (C-49). */
  consecuencia: { texto: string; tono: TonoBadge } | null;
  seleccionada: boolean;
}

export interface VistaFecha { fecha: Date; etiqueta: string; vence: boolean; seleccionada: boolean; deshabilitada: boolean; motivo?: string }

export interface GrupoDestino {
  titulo: string;
  items: { id: string; divisa: Divisa; nombre: string; sub: string; seleccionado: boolean; destino: Destino }[];
}

/** Una línea del desglose de una fila de la posición (C-55): día, destinatario, referencia y monto; "Pagar" si está pendiente. */
export interface VistaItemDesglose {
  id: string;
  dia: string;
  nombre: string;
  referencia: string;
  monto: string;
  /** En otras divisas, "≈ 972,000.00 MXN a 24.300000"; en las pactadas, lo que llega o sale y el precio cerrado. */
  linea: string | null;
  /** Pago pendiente: "Pagar" sigue con el flujo de pago en la misma ventana. */
  pagoId: string | null;
}

export interface VistaPanel {
  tipo: 'pago' | 'depositar' | 'detalle' | 'agendar' | 'notificaciones' | 'cuentas' | 'destinatario' | 'desglose';
  titulo: string;
  sub: string;
  paso: EstadoApp['panel']['paso'];
  sinTdc: boolean;
  mercadoCerrado: boolean;
  /** pagar: abre el flujo de pago con `orden` (detalle de un pendiente o "Pagar ahora" tras agendar) · continuarPago: del paso Pago al Origen. */
  primario: { label: string; habilitado: boolean; accion: 'continuar' | 'continuarPago' | 'pedirPrecio' | 'confirmar' | 'volverInicio' | 'cerrar' | 'pagar' | 'agendar' | 'guardarDestinatario' | 'ninguna' };
  secundario: { label: string; accion: 'cancelar' | 'volver' | 'volverOrigen' | 'comprobante' | 'volverDestino' | 'volverPago' | 'pagar' | 'volverDesglose' } | null;
  /** titulo null: desde el cotizador el título de la ventana ya hace la pregunta (C-53). */
  destino: { titulo: string | null; busqueda: string; grupos: GrupoDestino[] } | null;
  /** Paso "¿Qué pagas con este cobro?" (entrada desde "Usar para pagar", D-30). */
  pago: { titulo: string; opciones: VistaOpcionPago[]; resto: string | null; otro: { label: string } } | null;
  origenes: VistaOpcionOrigen[];
  revision: {
    /** Sin factura: los dos montos se editan ("Recibe" y "Pagas"); el que escribes queda fijo y el otro se recalcula con el indicativo. */
    editable: boolean;
    /** Transferencia en la misma divisa: un solo monto, "Envías" (C-50). */
    unico: boolean;
    pagas: Centavos; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; ladoFijo: 'recibe' | 'pagas'; destinatario: string;
    fechas: VistaFecha[]; fechaEsHoy: boolean; fechaDia: string; hoyNoAlcanza: boolean;
    /** Texto bajo "¿Cuándo sale el dinero?" (C-51). */
    notaFecha: string;
    /** El destinatario elegido tiene un pago cargado pendiente: "Tienes un pago cargado para X: …" con "Usar este pago" (C-49). */
    pagoCargado: { id: string; texto: string } | null;
    /** texto y efecto ya no van en pantalla (C-47: repetían montos y tipo de cambio a la vista; el efecto es la fila "Tu cuenta queda en" de resumen); flujo.test.ts los sigue leyendo. */
    texto: string; efecto: string; posVencimiento: string | null;
    /** Transferencia con saldo insuficiente: no se puede continuar. */
    error: string | null;
    tdc: TdcMicro | null; concepto: string; referencia: string;
  } | null;
  precio: {
    /** ejecutable: la ventana para confirmar está abierta y el precio sigue al mercado (C-48). */
    estado: 'ejecutable' | 'vencido' | 'sinTdc'; tdc: TdcMicro | null; segundos: number; porVencer: boolean;
    /** pagasAprox: vencido, los montos vuelven al indicativo (≈); con la ventana abierta son exactos en cada instante. */
    pagas: Centavos; pagasAprox: boolean; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; destinatario: string; sale: string | null;
    /** Lado que quedó fijo en la revisión: el BloqueMonto de solo lectura lo marca con el tag "Fijo"; el otro "se actualiza en vivo". */
    ladoFijo: 'recibe' | 'pagas';
    /** Transferencia en la misma divisa: un solo monto (C-50). */
    unico: boolean;
    token: string; tokenError: string | null; confirmando: boolean;
  } | null;
  /** Columna derecha de Origen, Revisión y Precio en la ventana de pago (C-47): lo que significa lo que se decide a la izquierda. */
  resumen: VistaResumen | null;
  confirmacion: VistaConfirmacion | null;
  depositar: { cuenta: string; clabe: string; banco: string } | null;
  /** Detalle de una fila de Movimientos; también la confirmación de "Cargar un pago". */
  detalle: VistaDetalle | null;
  /** Paso de datos de "Cargar un pago". */
  agenda: VistaAgenda | null;
  notificaciones: { id: string; texto: string; movimientoId: string | null; tono: TonoBadge }[] | null;
  /** elegida: la cuenta desde la que se abrió en el menú lateral, primera y con el foco (C-56). */
  cuentas: { id: CuentaId; nombre: string; divisa: Divisa; banco: string; mascara: string; saldo: string; clabe: string | null; elegida: boolean }[] | null;
  destinatario: { nombre: string; divisa: Divisa; divisas: Divisa[]; banco: string; cuenta: string; errores: Partial<Record<'nombre' | 'banco' | 'cuenta', string>>; valido: boolean; volverA: 'destino' | null } | null;
  /** Lo que compone una fila de la posición (C-55). */
  desglose: { items: VistaItemDesglose[] } | null;
}

export interface VistaResumen {
  /** Tipo de cambio del par, siempre arriba: indicativo en Origen y Revisión; ejecutable (con la cuenta regresiva para confirmar) o vencido en Precio. */
  tdc: { valor: TdcMicro; unidad: string; estado: 'indicativo' | 'ejecutable' | 'vencido'; segundos: number; porVencer: boolean; pausado: boolean } | null;
  /** Debajo del precio ejecutable: "Se mueve con el mercado hasta que confirmas." (C-48). */
  linea?: string | null;
  /** En lugar del precio: "Sin tipo de cambio" (transferencia en la misma divisa) o, en Origen sin cuenta elegida, "Depende de la cuenta que elijas." */
  sinPrecio: string | null;
  filas: { k: string; v: string }[];
  /** "El dinero sale después del vencimiento (jue 8)." cuando aplica (Revisión). */
  aviso: string | null;
  /** Al pie: "Ten tu token a mano: tienes 2 minutos para confirmar." (Revisión con tipo de cambio). */
  nota: string | null;
}

/** Montos finales para el BloqueMonto de solo lectura: "Pagas" y "{destinatario} recibe"; en una transferencia, un solo monto (C-50). */
export interface VistaMontos {
  pagas: { monto: Centavos; divisa: Divisa };
  recibe: { monto: Centavos; divisa: Divisa; destinatario: string };
  unico: boolean;
}

export interface VistaDetalle {
  clase: 'pendiente' | 'pactada' | 'proceso' | 'cobro' | 'pago' | 'agendado';
  icono: 'clock-ten' | 'calendar-alt' | 'check-circle' | 'arrow-down';
  titulo: string;
  badge: Badge;
  monto: Centavos;
  divisa: Divisa;
  /** Operación hecha (en proceso o pactada): los montos finales van en el BloqueMonto, como en la confirmación (C-50). */
  montos?: VistaMontos | null;
  /** Comprobante descargable de una operación hecha: los montos y las mismas filas. */
  filasComprobante?: { k: string; v: string }[];
  texto: string | null;
  filas: { k: string; v: string }[];
  fondeo: string | null;
  /** Pactada: el precio ya está cerrado; cancelar se pide por WhatsApp desde Contáctanos (C-27 revertida). */
  nota: string | null;
  /** Orden para "Pagar" (pendiente) o "Pagar ahora" (cargado recién). */
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
  /** Arriba, el BloqueMonto de solo lectura con los montos finales (C-50). */
  montos: VistaMontos;
  /** Sale de, Sale el dinero, Tipo de cambio, Comisión, Concepto y Referencia (C-50); las mismas en el detalle del movimiento. */
  detalle: { k: string; v: string }[];
  /** Comprobante descargable: los montos y las mismas filas. */
  filasComprobante: { k: string; v: string }[];
  fondeo: string | null;
  comprobante: 'Descargar comprobante' | 'Descargar confirmación';
}

export const tituloDe = (destino: Destino | null) => (!destino ? 'Pagar' : destino.tipo === 'propia' ? `Pasar a tu ${destino.nombre}` : `Pagar a ${destino.nombre}`);

/**
 * Grupos del selector de destino. En la ventana de pago se elige un destinatario, no un pago: "Destinatarios" primero y después
 * "Tus cuentas" (C-49; los pagos cargados se pagan desde su fila). Desde el cotizador (C-53), "Tus cuentas" en la divisa que llega y después
 * "Destinatarios en X".
 */
export function gruposDestino(e: EstadoApp, busqueda: string, opciones: { divisa?: Divisa | null; excluirCuentaId?: CuentaId | null; soloDestinatarios?: boolean; destinatariosPrimero?: boolean }): GrupoDestino[] {
  const q = busqueda.trim().toLowerCase();
  const coincide = (n: string) => !q || n.toLowerCase().includes(q);
  const grupos: GrupoDestino[] = [];
  const cuentas = opciones.soloDestinatarios ? [] : e.datos.cuentas.filter((c) => c.id !== opciones.excluirCuentaId && (!opciones.divisa || c.divisa === opciones.divisa) && coincide(c.nombre));
  const grupoCuentas: GrupoDestino | null = cuentas.length ? { titulo: 'Tus cuentas', items: cuentas.map((c) => ({ id: c.id, divisa: c.divisa, nombre: c.nombre, sub: `${c.banco} · **** ${c.mascara}`, seleccionado: false, destino: destinoDeCuenta(c) })) } : null;
  const divisaDest = opciones.divisa ?? null;
  const dest = e.datos.destinatarios.filter((d) => (!divisaDest || d.divisa === divisaDest) && coincide(d.nombre));
  const grupoDestinatarios: GrupoDestino | null = dest.length ? { titulo: divisaDest ? `Destinatarios en ${divisaDest}` : 'Destinatarios', items: dest.map((d: Destinatario) => ({ id: d.id, divisa: d.divisa, nombre: d.nombre, sub: `${d.banco} · **** ${d.mascara}`, seleccionado: false, destino: destinoDeDestinatario(d) })) } : null;
  for (const g of opciones.destinatariosPrimero ? [grupoDestinatarios, grupoCuentas] : [grupoCuentas, grupoDestinatarios]) if (g) grupos.push(g);
  return grupos;
}

export function vistaPanel(e: EstadoApp): VistaPanel | null {
  const { panel } = e;
  if (!panel.abierto) return null;
  const vacio: VistaPanel = { tipo: panel.tipo, titulo: 'Pagar', sub: '', paso: panel.paso, sinTdc: false, mercadoCerrado: e.datos.mercado === 'cerrado', primario: { label: 'Continuar', habilitado: false, accion: 'ninguna' }, secundario: { label: 'Cancelar', accion: 'cancelar' }, destino: null, pago: null, origenes: [], revision: null, precio: null, confirmacion: null, resumen: null, depositar: null, detalle: null, agenda: null, notificaciones: null, cuentas: null, destinatario: null, desglose: null };

  if (panel.tipo === 'detalle') return vistaDetallePanel(e, vacio);
  if (panel.tipo === 'desglose') return vistaDesglosePanel(e, vacio);
  if (panel.tipo === 'agendar') return vistaAgendarPanel(e, vacio);
  if (panel.tipo === 'notificaciones') {
    const items = notificaciones(e).map((n) => ({ id: n.id, texto: n.texto, movimientoId: n.movimientoId, tono: tonoBadge[n.tono === 'warn' ? 'warn' : n.tono === 'ok' ? 'ok' : 'neutro'] as TonoBadge }));
    return { ...vacio, tipo: 'notificaciones', titulo: 'Notificaciones', sub: items.length ? `${items.length} ${items.length === 1 ? 'aviso' : 'avisos'} de hoy y de la semana` : 'Nada nuevo por ahora.', primario: { label: 'Cerrar', habilitado: true, accion: 'cerrar' }, secundario: null, notificaciones: items };
  }
  if (panel.tipo === 'cuentas') {
    const todas = cuentasActuales(e).map((c) => ({ id: c.id, nombre: c.nombre, divisa: c.divisa, banco: c.banco, mascara: c.mascara, saldo: fmt.monto(c.saldo, c.divisa), clabe: c.clabe ?? null, elegida: c.id === panel.cuentaElegida }));
    // Desde una fila del menú lateral, esa cuenta va primera; las demás siguen en su orden (C-56).
    const items = [...todas.filter((c) => c.elegida), ...todas.filter((c) => !c.elegida)];
    return { ...vacio, tipo: 'cuentas', titulo: 'Tus cuentas', sub: `${items.length} cuentas en Banco BASE`, primario: { label: 'Cerrar', habilitado: true, accion: 'cerrar' }, secundario: null, cuentas: items };
  }
  if (panel.tipo === 'destinatario') {
    const d = panel.destinatarioNuevo;
    const errores = erroresDestinatario(d);
    const mostrar = { nombre: d.nombre ? errores.nombre : undefined, banco: d.banco ? errores.banco : undefined, cuenta: d.cuenta ? errores.cuenta : undefined };
    return {
      ...vacio, tipo: 'destinatario', titulo: 'Agregar destinatario', sub: panel.volverA === 'destino' ? 'Después sigues con el pago a este destinatario.' : 'Queda en tu lista de destinatarios.',
      primario: { label: panel.volverA === 'destino' ? 'Guardar y pagar' : 'Guardar', habilitado: Object.keys(errores).length === 0, accion: 'guardarDestinatario' },
      secundario: panel.volverA === 'destino' ? { label: 'Volver', accion: 'volverDestino' } : { label: 'Cancelar', accion: 'cancelar' },
      // Cualquier divisa de Valiu, haya o no cuenta en ella (C-54): se paga con tipo de cambio desde una cuenta que sí la tenga.
      destinatario: { nombre: d.nombre, divisa: d.divisa, divisas: ['MXN', 'USD', 'EUR', 'GBP', 'CAD'], banco: d.banco, cuenta: d.cuenta, errores: mostrar, valido: Object.keys(errores).length === 0, volverA: panel.volverA },
    };
  }

  if (panel.tipo === 'depositar') {
    const mxn = e.datos.cuentas.find((c) => c.clabe);
    return { ...vacio, titulo: 'Datos para depositar', sub: mxn ? `${mxn.nombre} · **** ${mxn.mascara}` : '', primario: { label: 'Listo', habilitado: true, accion: 'cerrar' }, secundario: null, depositar: mxn ? { cuenta: mxn.nombre, clabe: mxn.clabe!, banco: mxn.banco } : null };
  }

  if (panel.paso === 'pago') return vistaPagoPanel(e, vacio);

  const orden = panel.orden;
  if ((panel.paso === 'destino' || !orden) && panel.desdeCotizador) {
    // Desde el cotizador (C-53): a dónde llega lo que compras; tus cuentas en esa divisa y los destinatarios en esa divisa.
    const d = panel.desdeCotizador;
    return {
      ...vacio, titulo: `¿A dónde llegan los ${d.ladoFijo === 'pagas' ? '≈ ' : ''}${fmt.monto(d.recibe, d.divisa)}?`, sub: '', paso: 'destino',
      destino: { titulo: null, busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { divisa: d.divisa, excluirCuentaId: panel.origenId }) },
      secundario: { label: 'Cancelar', accion: 'cancelar' },
    };
  }
  if (panel.paso === 'destino' || !orden) {
    const desdeCobro = !!panel.cobroId && e.datos.loNuevo?.id === panel.cobroId;
    return {
      ...vacio, titulo: 'Pagar', sub: '¿A quién le pagas?', paso: 'destino',
      destino: { titulo: '¿A quién le pagas?', busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { excluirCuentaId: panel.origenId, destinatariosPrimero: true }) },
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
  // Cotización con el indicativo en vivo y la comisión de la operación (C-50).
  const cotInd = origen ? cotizar({ origen: origen.divisa, destino: orden.destino.divisa, monto: orden.monto, ladoFijo: orden.ladoFijo, pares: e.tdcVivo, comisionBp: comisionPara(e, origen.divisa, orden.destino) }) : null;
  const con = origen ? NOMBRE_DIVISA[origen.divisa].con : '';
  const clase: Clase = origen ? (orden.destino.tipo === 'tercero' ? 'pago' : op?.tipo === 'compra' ? 'compra' : op?.tipo === 'venta' ? 'venta' : 'transferencia') : 'pago';
  const recibeNombre = orden.destino.tipo === 'propia' ? `Tu ${orden.destino.nombre} recibe` : `${orden.destino.nombre} recibe`;
  const titulo = tituloDe(orden.destino);
  const montoRecibe = cotInd ? cotInd.recibe : orden.ladoFijo === 'recibe' ? orden.monto : 0;
  // Sin monto todavía (destinatario o cuenta propia sin pago cargado) el subtítulo lleva la cuenta de destino, no "0.00".
  const sub = orden.destino.tipo === 'propia'
    ? [montoRecibe > 0 ? fmt.monto(montoRecibe, orden.destino.divisa) : null, `${orden.destino.banco} **** ${orden.destino.mascara}`].filter(Boolean).join(' · ')
    : [montoRecibe > 0 ? fmt.monto(montoRecibe, orden.destino.divisa) : `${orden.destino.banco} **** ${orden.destino.mascara}`, orden.vence ? `vence ${fmt.diaCorto(orden.vence)}` : null, orden.referencia || null].filter(Boolean).join(' · ');
  const ultima = e.operaciones[0] ?? null;

  const cobro = panel.cobroId && e.datos.loNuevo?.id === panel.cobroId ? e.datos.loNuevo : null;
  // Sin monto (entrada por "Pagar" y un destinatario) cada cuenta muestra solo nombre y saldo; con monto, "Pagas ≈ X" y un chip
  // como máximo, solo si cambia la decisión (C-49). Los motivos de cuenta deshabilitada se mantienen.
  const conMonto = montoRecibe > 0;
  // Dónde cuenta hoy el pago cargado: en su divisa o, sin cuenta en ella, en la cuenta de fondeo convertido (C-54).
  const pagoCargado = orden.pagoId ? pagosPendientes(e).find((p) => p.id === orden.pagoId) ?? null : null;
  const pagoEn = pagoCargado ? pagoEnPosicion(e, pagoCargado) : null;
  const origenes: VistaOpcionOrigen[] = ctas
    .filter((c) => c.id !== orden.destino.cuentaId)
    .map((c) => {
      const ev = evaluarOrigen({ origen: c, monto: montoRecibe, divisaDestino: orden.destino.divisa, destinoPropio: orden.destino.tipo === 'propia', pagoCargado: !!orden.pagoId, pagoEn, posiciones: pos, proyecciones: proy, pares: e.tdcVivo, comisionBp: comisionPara(e, c.divisa, orden.destino) });
      const deshabilitada = origenDeshabilitado(c, orden);
      const sinPar = sinParCon(c, orden);
      const saldo = `Saldo ${fmt.monto(c.saldo, c.divisa)}${cobro && cobro.cuentaId === c.id ? ' · incluye el cobro de hoy' : ''}`;
      // Una cuenta sin par con la divisa del destino no puede pagar: "Sin par disponible" (C-54).
      const consecuencia = deshabilitada
        ? { texto: sinPar ? 'Sin par disponible' : c.saldo <= 0 ? 'Sin saldo' : 'No alcanza el saldo', tono: 'neutral' as const }
        : conMonto && ev.consecuencia ? { texto: ev.consecuencia.texto, tono: tonoBadge[ev.consecuencia.tono], ayuda: ev.consecuencia.ayuda } : null;
      return { id: c.id, nombre: c.nombre, saldo, pagas: conMonto && !sinPar ? ev.pagasTexto : '', consecuencia, seleccionada: c.id === panel.origenId, deshabilitada };
    });

  const hoyNoAlcanza = !!origen && !!cotInd && cotInd.pagas > origen.saldo;
  // Una transferencia (misma divisa) no tiene fecha valor para fondear: con saldo insuficiente no se puede continuar.
  const saldoInsuficiente = !!origen && !!cotInd && sinTdc && orden.destino.tipo === 'tercero' && cotInd.pagas > origen.saldo;
  const fechasBase = fechasLiquidacion(HOY, orden.vence);
  const fechas: VistaFecha[] = fechasBase.map((f) => ({ ...f, seleccionada: mismoDia(f.fecha, panel.fechaValor), deshabilitada: hoyNoAlcanza && f.etiqueta === 'Hoy', motivo: hoyNoAlcanza && f.etiqueta === 'Hoy' ? 'Hoy no alcanza el saldo' : undefined }));
  const fechaEsHoy = mismoDia(panel.fechaValor, HOY);
  const fechaDia = fechas.find((f) => f.seleccionada)?.etiqueta ?? fmt.diaCorto(panel.fechaValor);
  const posVencimiento = orden.vence && panel.fechaValor.getTime() > new Date(orden.vence.getFullYear(), orden.vence.getMonth(), orden.vence.getDate(), 23, 59).getTime() ? `El dinero sale después del vencimiento (${fmt.diaCorto(orden.vence)}).` : null;
  const unidad = unidadTdc(op?.par ?? null);
  // Comisión de la operación (C-50): la tasa por clase y, si no es 0, el monto en la divisa de origen. Va debajo del tipo de cambio.
  // Sin cuenta de origen todavía, la tasa solo se muestra si es la misma para todas las cuentas que pueden pagar.
  const tasasPosibles = new Set(ctas.filter((c) => !(orden.destino.tipo === 'propia' && c.id === orden.destino.id)).map((c) => comisionPara(e, c.divisa, orden.destino)));
  const comisionBp = origen ? comisionPara(e, origen.divisa, orden.destino) : tasasPosibles.size === 1 ? [...tasasPosibles][0] : null;
  const comision = (c: { comision: Centavos } | null) => (comisionBp == null ? [] : [filaComision(comisionBp, c?.comision ?? 0, c ? origen?.divisa ?? null : null)]);
  // Filas de la columna derecha en Revisión y Precio: de dónde y cuándo sale el dinero y cómo queda la cuenta ese día. En una transferencia
  // (misma divisa, siempre hoy): lo que recibe el destinatario, de dónde sale y cómo queda la cuenta (C-50).
  const filasSalida = (o: { nombre: string; divisa: Divisa }, c: { comision: Centavos; recibe: Centavos } | null, queda: string) => sinTdc
    ? [...comision(c), { k: recibeNombre, v: fmt.monto(c?.recibe ?? 0, orden.destino.divisa) }, { k: 'Sale de', v: o.nombre }, { k: 'Tu cuenta queda en', v: queda }]
    : [...comision(c), { k: 'Sale de', v: o.nombre }, { k: 'Sale el dinero', v: fechaDia }, { k: fechaEsHoy ? 'Tu cuenta queda en' : `El ${fechaDia} tu cuenta queda en`, v: queda }];

  let resumen: VistaPanel['resumen'] = null;
  if (panel.paso === 'origen') {
    // Tipo de cambio indicativo del par de la cuenta seleccionada; cambia al elegir otra. Sin monto, solo el precio (y el vencimiento si lo hay).
    const tdcOrigen = cotInd?.tdc ?? null;
    resumen = {
      tdc: tdcOrigen != null ? { valor: tdcOrigen, unidad, estado: 'indicativo', segundos: 0, porVencer: false, pausado: false } : null,
      sinPrecio: !origen ? 'Depende de la cuenta que elijas.' : tdcOrigen == null ? 'Sin tipo de cambio' : null,
      filas: [
        ...(conMonto ? [...comision(cotInd), { k: recibeNombre, v: fmt.monto(montoRecibe, orden.destino.divisa) }] : []),
        ...(orden.vence ? [{ k: 'Vence', v: fmt.fechaLarga(orden.vence) }] : []),
      ],
      aviso: null,
      nota: null,
    };
  }

  let revision: VistaPanel['revision'] = null;
  if (panel.paso === 'revision' && origen && cotInd) {
    const tdcInd = cotInd.tdc;
    let texto: string;
    const recibeTxt = fmt.monto(cotInd.recibe, orden.destino.divisa);
    if (sinTdc) texto = `Vas a ${orden.destino.tipo === 'propia' ? 'pasar' : 'pagar'} ${recibeTxt} desde tu ${origen.nombre}, sin tipo de cambio.`;
    else if (fechaEsHoy) {
      texto = clase === 'venta'
        ? `Vas a vender ${fmt.monto(cotInd.pagas, origen.divisa)}. Recibes ${recibeTxt} a ${fmt.tdc(tdcInd ?? 0)} MXN.`
        : `Vas a ${clase === 'pago' ? 'pagar' : 'comprar'} ${recibeTxt} con ${con}. Compras los ${NOMBRE_DIVISA[orden.destino.divisa].con} a ${fmt.tdc(tdcInd ?? 0)} MXN.`;
    } else {
      const envio = orden.destino.tipo === 'propia' ? `entran ${recibeTxt} a tu ${orden.destino.nombre}` : `se envía el pago a ${orden.destino.nombre}`;
      texto = fmt.oracion(`Cierras hoy el precio de ${recibeTxt}. El ${fechaDia} salen ≈ ${fmt.monto(cotInd.pagas, origen.divisa)} de tu ${origen.nombre} y ${envio}`);
    }
    const queda = fmt.monto(origen.saldo - cotInd.pagas, origen.divisa);
    const efecto = fechaEsHoy ? `Tu cuenta en ${con} queda en ≈ ${queda}.` : `El ${fechaDia} tu cuenta en ${con} queda en ≈ ${queda}.`;
    // Para no pagar dos veces lo mismo (C-49): el destinatario elegido tiene un pago cargado pendiente (el que vence antes).
    const sugerido = !orden.pagoId && orden.destino.tipo === 'tercero' ? pagosPendientes(e).find((p) => !p.pactada && p.destinatarioId === orden.destino.id) ?? null : null;
    revision = {
      editable: !orden.conFactura, unico: sinTdc,
      pagas: cotInd.pagas, pagasDivisa: origen.divisa, recibe: cotInd.recibe, recibeDivisa: orden.destino.divisa, ladoFijo: orden.ladoFijo, destinatario: recibeNombre,
      fechas: sinTdc ? [] : fechas, fechaEsHoy, fechaDia, hoyNoAlcanza, notaFecha: notaFechaLiquidacion(fechas),
      pagoCargado: sugerido ? { id: sugerido.id, texto: `Tienes un pago cargado para ${sugerido.destinatario}: ${fmt.monto(sugerido.monto, sugerido.divisa)}, vence ${fmt.diaCorto(sugerido.fecha)}.` } : null,
      texto, efecto, posVencimiento: sinTdc ? null : posVencimiento,
      error: saldoInsuficiente ? `No alcanza el saldo de tu ${origen.nombre} (${fmt.monto(origen.saldo, origen.divisa)}).` : null,
      tdc: sinTdc ? null : tdcInd, concepto: orden.motivo ?? '', referencia: orden.referencia,
    };
    resumen = {
      tdc: !sinTdc && tdcInd != null ? { valor: tdcInd, unidad, estado: 'indicativo', segundos: 0, porVencer: false, pausado: false } : null,
      sinPrecio: sinTdc ? 'Sin tipo de cambio' : null,
      filas: filasSalida(origen, cotInd, `${sinTdc ? '' : '≈ '}${queda}`),
      aviso: sinTdc ? null : posVencimiento,
      nota: sinTdc ? null : 'Ten tu token a mano: tienes 2 minutos para confirmar.',
    };
  }

  let precio: VistaPanel['precio'] = null;
  if (panel.paso === 'precio' && origen && cotInd) {
    // C-48: el precio ejecutable sigue al mercado mientras la ventana para confirmar está abierta; el lado fijo no cambia y el otro es exacto en cada instante.
    const ejec = panel.precio.estado === 'ejecutable' ? panel.precio : null;
    const vencido = panel.precio.estado === 'vencido' ? panel.precio : null;
    const estadoPrecio = sinTdc ? 'sinTdc' : ejec ? 'ejecutable' : 'vencido';
    const cotEjec = ejec && cot ? cot : null;
    const enPrecio = cotEjec ?? cotInd;
    precio = {
      estado: estadoPrecio, tdc: ejec ? ejec.tdc : vencido ? vencido.tdc : cotInd.tdc, segundos: ejec ? ejec.venceEn : 0, porVencer: !!ejec && ejec.venceEn <= 30,
      pagas: enPrecio.pagas, pagasAprox: !ejec && !sinTdc, pagasDivisa: origen.divisa, recibe: enPrecio.recibe, recibeDivisa: orden.destino.divisa, destinatario: recibeNombre,
      sale: fechaEsHoy || sinTdc ? null : `El dinero sale el ${fechaDia}`,
      ladoFijo: orden.ladoFijo, unico: sinTdc,
      token: panel.token, tokenError: panel.tokenError, confirmando: panel.confirmando,
    };
    resumen = {
      tdc: ejec ? { valor: ejec.tdc, unidad, estado: 'ejecutable', segundos: ejec.venceEn, porVencer: ejec.venceEn <= 30, pausado: e.pausado }
        : vencido ? { valor: vencido.tdc, unidad, estado: 'vencido', segundos: 0, porVencer: false, pausado: false } : null,
      linea: ejec ? 'Se mueve con el mercado hasta que confirmas.' : null,
      sinPrecio: sinTdc ? 'Sin tipo de cambio' : null,
      filas: filasSalida(origen, enPrecio, `${vencido ? '≈ ' : ''}${fmt.monto(origen.saldo - enPrecio.pagas, origen.divisa)}`),
      aviso: null,
      nota: null,
    };
  }

  let confirmacion: VistaPanel['confirmacion'] = null;
  if (panel.paso === 'confirmacion' && ultima) confirmacion = vistaConfirmacion(e, ultima);

  const tokenListo = panel.token.length === 6 && !panel.confirmando;
  const mercadoCerrado = e.datos.mercado === 'cerrado';
  // Sin factura el monto se elige en la revisión, así que desde Origen se puede continuar con monto 0; para pedir precio sí hace falta un monto.
  const puedeContinuar = !!origen && !!cotInd && (cotInd.recibe > 0 || !orden.conFactura);
  const puedePedir = !!origen && !!cotInd && cotInd.recibe > 0 && !saldoInsuficiente;
  const primario: VistaPanel['primario'] =
    panel.paso === 'origen' ? { label: 'Continuar', habilitado: puedeContinuar, accion: 'continuar' }
      : panel.paso === 'revision' ? (sinTdc ? { label: 'Continuar', habilitado: puedePedir, accion: 'pedirPrecio' } : { label: 'Pedir precio', habilitado: puedePedir && !mercadoCerrado, accion: 'pedirPrecio' })
        : panel.paso === 'precio' ? (panel.precio.estado === 'vencido' ? { label: 'Pedir precio', habilitado: !mercadoCerrado, accion: 'pedirPrecio' } : { label: panel.confirmando ? 'Confirmando…' : 'Confirmar pago', habilitado: tokenListo, accion: 'confirmar' })
          : { label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' };
  // Desde el desglose de la posición (C-55), "Volver" en Origen regresa a la lista; desde el cotizador (C-53) la revisión vuelve a Destino.
  const secundario: VistaPanel['secundario'] =
    panel.paso === 'origen' ? (panel.desglose ? { label: 'Volver', accion: 'volverDesglose' } : { label: orden.pagoId || orden.destino.tipo === 'propia' ? 'Cancelar' : 'Volver', accion: orden.pagoId || orden.destino.tipo === 'propia' ? 'cancelar' : 'volverDestino' })
      : panel.paso === 'revision' ? { label: 'Volver', accion: panel.desdeCotizador ? 'volverDestino' : 'volverOrigen' }
        : panel.paso === 'precio' ? { label: 'Volver', accion: 'volver' }
          : { label: confirmacion?.comprobante ?? 'Descargar comprobante', accion: 'comprobante' };

  return { ...vacio, titulo, sub: panel.paso === 'confirmacion' && orden.destino.tipo === 'tercero' ? [fmt.monto(montoRecibe, orden.destino.divisa), orden.referencia || null].filter(Boolean).join(' · ') : sub, paso: panel.paso, sinTdc, mercadoCerrado, primario, secundario, origenes, revision, precio, confirmacion, resumen };
}

/** Montos finales de una operación hecha para el BloqueMonto de solo lectura (C-50). */
export function montosDe(e: EstadoApp, o: OperacionHecha): VistaMontos {
  const origen = cuentaPorId(e, o.origenId)!;
  const recibeNombre = o.destino.tipo === 'propia' ? `Tu ${o.destino.nombre} recibe` : `${o.destino.nombre} recibe`;
  return { pagas: { monto: o.pagas, divisa: origen.divisa }, recibe: { monto: o.recibe, divisa: o.destino.divisa, destinatario: recibeNombre }, unico: o.tdc == null };
}

/** Filas de una operación hecha (C-50): las mismas en la confirmación, el comprobante y el detalle del movimiento. */
export function filasOperacion(e: EstadoApp, o: OperacionHecha): { k: string; v: string }[] {
  const origen = cuentaPorId(e, o.origenId)!;
  return [
    { k: 'Sale de', v: origen.nombre },
    { k: 'Sale el dinero', v: o.estado === 'Pactada' ? fmt.diaCorto(o.fechaValor) : 'Hoy' },
    { k: 'Tipo de cambio', v: o.tdc != null ? `${fmt.tdc(o.tdc)} ${unidadTdc(deducir(origen.divisa, o.destino.divisa)?.par ?? null)}` : 'Sin tipo de cambio' },
    filaComision(o.comisionBp, o.comision, origen.divisa),
    ...(o.motivo ? [{ k: 'Concepto', v: o.motivo }] : []),
    { k: 'Referencia', v: o.referencia || '—' },
  ];
}

/** El comprobante descargable lleva los montos del BloqueMonto como filas y después las mismas filas de la confirmación. */
const filasComprobanteDe = (m: VistaMontos, filas: { k: string; v: string }[]) => [
  ...(m.unico ? [{ k: 'Envías', v: fmt.monto(m.pagas.monto, m.pagas.divisa) }] : [{ k: 'Pagas', v: fmt.monto(m.pagas.monto, m.pagas.divisa) }, { k: m.recibe.destinatario, v: fmt.monto(m.recibe.monto, m.recibe.divisa) }]),
  ...filas,
];

export function vistaConfirmacion(e: EstadoApp, o: OperacionHecha): VistaConfirmacion {
  const origen = cuentaPorId(e, o.origenId)!;
  const dia = fmt.diaCorto(o.fechaValor);
  const pactada = o.estado === 'Pactada';
  const pagas = fmt.monto(o.pagas, origen.divisa);
  const sustantivo = o.clase === 'pago' ? 'Pago' : o.clase === 'compra' ? 'Compra' : o.clase === 'venta' ? 'Venta' : 'Transferencia';
  const titulo = pactada ? `${sustantivo} pactad${sustantivo === 'Pago' ? 'o' : 'a'}` : `${sustantivo} en proceso`;
  const destino = o.destino.tipo === 'propia' ? `tu ${o.destino.nombre}` : o.destino.nombre;
  const montos = montosDe(e, o);
  const detalle = filasOperacion(e, o);
  return {
    estado: pactada ? 'pactada' : 'proceso', clase: o.clase, titulo, fechaDia: dia, tdc: o.tdc, pagas: o.pagas, pagasDivisa: origen.divisa, recibe: o.recibe, recibeDivisa: o.destino.divisa,
    destino, desde: origen.nombre, referencia: o.referencia, montos, detalle, filasComprobante: filasComprobanteDe(montos, detalle),
    // C-51: sin "para que el pago salga": no está confirmado qué pasa si no se fondea.
    fondeo: pactada ? `Ten ${pagas} en tu ${origen.nombre} el ${dia}.` : null,
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
    consecuencia: o.consecuencia ? { texto: o.consecuencia.texto, tono: tonoBadge[o.consecuencia.tono] } : null,
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

const sustantivoDe = (clase: Clase) => (clase === 'pago' ? 'Pago' : clase === 'compra' ? 'Compra' : clase === 'venta' ? 'Venta' : 'Transferencia');
const participio = (clase: Clase, raiz: string) => `${raiz}${clase === 'pago' ? 'o' : 'a'}`;

/** Detalle de un pago cargado todavía pendiente (del escenario o cargado en la sesión). */
function detallePendiente(e: EstadoApp, p: PagoFuturo, agendado: boolean): VistaDetalle {
  const cot = p.divisa !== 'MXN' ? cotizar({ origen: 'MXN', destino: p.divisa, monto: p.monto, ladoFijo: 'recibe', pares: e.tdcVivo }) : null;
  return {
    clase: agendado ? 'agendado' : 'pendiente', icono: agendado ? 'calendar-alt' : 'clock-ten', titulo: agendado ? 'Pago cargado' : 'Pago pendiente', badge: { texto: 'Pendiente', tono: 'neutral' },
    monto: -p.monto, divisa: p.divisa,
    texto: agendado ? 'Queda en Próximos para que lo pagues cuando quieras.' : `Vence el ${fmt.fechaLarga(p.fecha)}. Elige desde qué cuenta pagarlo cuando quieras.`,
    filas: [
      { k: 'Destinatario', v: conCuenta(p.destinatario, p.cuentaDestino.banco, p.cuentaDestino.mascara) },
      { k: 'Monto', v: fmt.monto(p.monto, p.divisa) },
      { k: 'Vence', v: fmt.fechaLarga(p.fecha) },
      ...(p.motivo ? [{ k: 'Concepto', v: p.motivo }] : []),
      { k: 'Referencia', v: p.referencia || '—' },
      ...(cot ? [{ k: 'Con pesos, hoy', v: `≈ ${fmt.monto(cot.pagas, 'MXN')}` }] : []),
    ],
    fondeo: null, nota: null, orden: ordenDePago(p),
  };
}

/** Una pactada no se cancela desde el prototipo: el precio ya está cerrado y la cancelación se pide por WhatsApp (C-27 revertida). */
export const NOTA_PACTADA = 'Ya cerraste el precio de esta operación. Si necesitas cancelarla, escríbenos por WhatsApp desde Contáctanos.';

/** Detalle de una operación hecha: como la confirmación, los montos finales en el BloqueMonto y las mismas filas (C-50). */
function detalleOperacion(e: EstadoApp, o: OperacionHecha): VistaDetalle {
  const origen = cuentaPorId(e, o.origenId)!;
  const sustantivo = sustantivoDe(o.clase);
  const conf = vistaConfirmacion(e, o);
  const base = { monto: -o.pagas, divisa: origen.divisa, montos: conf.montos, filas: conf.detalle, filasComprobante: conf.filasComprobante, orden: null };
  if (o.estado === 'Pactada') {
    return {
      ...base, clase: 'pactada', icono: 'calendar-alt', titulo: `${sustantivo} ${participio(o.clase, 'pactad')}`, badge: { texto: 'Pactada', tono: 'pactada' },
      texto: null, fondeo: conf.fondeo, nota: NOTA_PACTADA,
    };
  }
  return {
    ...base, clase: 'proceso', icono: 'check-circle', titulo: `${sustantivo} en proceso`, badge: { texto: 'En proceso', tono: 'warning' },
    texto: 'Te avisamos cuando Banco BASE confirme el envío.', fondeo: null, nota: null,
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
    fondeo: null, nota: null, orden: null,
  };
}

/** Tipo "detalle" (panel lateral): una fila de Movimientos abierta. */
function vistaDetallePanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const { panel } = e;
  const mov = panel.movimientoId ? movimientoDe(e, panel.movimientoId) : null;
  if (!mov) return { ...vacio, titulo: 'Movimiento', sub: 'No encontramos este movimiento.', primario: { label: 'Cerrar', habilitado: true, accion: 'cerrar' }, secundario: null };
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
    detalle = detalleOperacion(e, o);
    titulo = nombreMovimiento(o);
    sub = [fmt.monto(o.pagas, origen.divisa), o.estado === 'Pactada' ? `sale el ${fmt.diaCorto(o.fechaValor)}` : `Hoy ${o.hora}`, o.referencia || null].filter(Boolean).join(' · ');
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
  if (detalle.clase === 'pendiente' || detalle.clase === 'agendado') {
    primario = { label: 'Pagar', habilitado: true, accion: 'pagar' };
    secundario = { label: 'Cerrar', accion: 'cancelar' };
  } else if (detalle.clase === 'proceso' || detalle.clase === 'cobro' || detalle.clase === 'pago') {
    secundario = comprobante;
  }
  return { ...vacio, tipo: 'detalle', titulo, sub, paso: panel.paso, primario, secundario, detalle };
}

// ------------------------------------------------- Desglose de la posición (C-55)
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Tipo "desglose" (ventana de pago, una columna): lo que compone una fila de TarjetaPosicion, por fecha; desde ahí se paga. */
function vistaDesglosePanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const d = e.panel.desglose;
  const cuenta = d ? cuentaPorId(e, d.cuentaId) : null;
  const cerrar = { label: 'Cerrar', habilitado: true, accion: 'cerrar' as const };
  if (!d || !cuenta) return { ...vacio, tipo: 'desglose', titulo: 'Posición', sub: '', primario: cerrar, secundario: null, desglose: { items: [] } };
  const calc = calculoPosiciones(e);
  const pend = pagosPendientes(e).filter((p) => !p.pactada);
  const pagoItem = (p: PagoFuturo, linea: string | null): VistaItemDesglose => ({ id: p.id, dia: fmt.diaCorto(p.fecha), nombre: p.destinatario, referencia: p.referencia, monto: fmt.montoSigno(-p.monto, p.divisa), linea, pagoId: p.id });
  const opItem = (o: OperacionHecha, sale: boolean): VistaItemDesglose => {
    const origen = cuentaPorId(e, o.origenId)!;
    const otra = sale ? fmt.monto(o.recibe, o.destino.divisa) : fmt.monto(o.pagas, origen.divisa);
    return { id: o.id, dia: fmt.diaCorto(o.fechaValor), nombre: nombreMovimiento(o), referencia: o.referencia, monto: sale ? fmt.montoSigno(-o.pagas, origen.divisa) : fmt.montoSigno(o.recibe, o.destino.divisa), linea: o.tdc != null ? `${otra} a ${fmt.tdc(o.tdc)}` : null, pagoId: null };
  };
  const total = (xs: { monto: Centavos }[]) => xs.reduce((a, x) => a + x.monto, 0);
  let titulo: string;
  let sub: string;
  let items: VistaItemDesglose[];
  if (d.fila === 'pagosFuturos') {
    const pagos = pend.filter((p) => !calc.convertidos[p.id] && !calc.sinPar.includes(p.id) && p.divisa === cuenta.divisa);
    titulo = `Pagos futuros en ${cuenta.divisa}`;
    sub = `${plural(pagos.length, 'pago', 'pagos')} · ${fmt.monto(-total(pagos), cuenta.divisa)}`;
    items = pagos.map((p) => pagoItem(p, null));
  } else if (d.fila === 'pagosOtrasDivisas') {
    const pagos = pend.filter((p) => calc.convertidos[p.id]?.cuentaId === cuenta.id);
    titulo = 'Pagos en otras divisas';
    sub = `${plural(pagos.length, 'pago', 'pagos')} · ≈ ${fmt.monto(-pagos.reduce((a, p) => a + calc.convertidos[p.id].monto, 0), cuenta.divisa)}`;
    items = pagos.map((p) => {
      const op = deducir(cuenta.divisa, p.divisa);
      const tdc = op ? tdcDe(op, e.tdcVivo) : null;
      return pagoItem(p, `≈ ${fmt.monto(calc.convertidos[p.id].monto, cuenta.divisa)}${tdc != null ? ` a ${fmt.tdc(tdc)}` : ''}`);
    });
  } else {
    const sale = d.fila === 'pactadasLiquidar';
    const ops = pactadas(e).filter((o) => (sale ? o.origenId === cuenta.id : o.destino.cuentaId === cuenta.id)).sort((a, b) => a.fechaValor.getTime() - b.fechaValor.getTime());
    titulo = `${sale ? 'Pactadas por liquidar' : 'Pactadas por recibir'} en ${cuenta.divisa}`;
    sub = `${plural(ops.length, 'pactada', 'pactadas')} · ${sale ? fmt.monto(-total(ops.map((o) => ({ monto: o.pagas }))), cuenta.divisa) : fmt.montoSigno(total(ops.map((o) => ({ monto: o.recibe }))), cuenta.divisa)}`;
    items = ops.map((o) => opItem(o, sale));
  }
  return { ...vacio, tipo: 'desglose', titulo, sub, primario: cerrar, secundario: null, desglose: { items } };
}

// ------------------------------------------------------------ Cargar un pago
const aIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** yyyy-mm-dd del input de fecha → Date local (null si está vacío o es inválido). */
export function fechaDeIso(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Tipo "agendar" (Cargar un pago, en la ventana de pago): destino → datos → confirmación (el pago nuevo entra a Próximos y se paga con el flujo de siempre). */
function vistaAgendarPanel(e: EstadoApp, vacio: VistaPanel): VistaPanel {
  const { panel } = e;
  const { agenda } = panel;
  const titulo = 'Cargar un pago';
  if (panel.paso === 'destino' || !agenda.destino) {
    return {
      ...vacio, tipo: 'agendar', titulo, sub: '¿A quién le vas a pagar?', paso: 'destino',
      destino: { titulo: '¿A quién le vas a pagar?', busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { soloDestinatarios: true }) },
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
    primario: { label: 'Cargar', habilitado: !!pago, accion: 'agendar' }, secundario: { label: 'Volver', accion: 'volverDestino' },
  };
}

// ------------------------------------------------------------------ Mercado cerrado
/** El aviso de siempre con el mercado cerrado: en el cotizador y en la revisión (sin horario mientras el dato no esté confirmado). */
export function avisoMercadoCerrado(): { titulo: string; texto: string } {
  const horario = HORARIO.abre && HORARIO.cierra ? ` Operas de lunes a viernes de ${HORARIO.abre} a ${HORARIO.cierra}, hora de CDMX.` : '';
  return { titulo: 'Mercado cerrado.', texto: `No se puede pedir precio hasta que abra.${horario}` };
}
