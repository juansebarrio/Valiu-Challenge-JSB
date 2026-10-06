// src/state/vistas.ts — selectores puros: del estado a los props de cada componente.
import type { Centavos, TdcMicro } from '@/lib/dinero';
import { cotizar, deducir, fechasLiquidacion, mismoDia, PARES, tdcDe, type Divisa } from '@/lib/fx';
import * as fmt from '@/lib/format';
import { evaluarOrigen, type Posicion, type Tono } from '@/lib/posicion';
import { HOY, HORARIO, HORA_TDC, MOTIVOS, NOMBRE_DIVISA, ORDEN_POSICIONES, PARES_SELECTOR, TENDENCIA_DIA, AVISO_PAR_SIN_PROTOTIPO, type Cuenta, type CuentaId, type Destinatario, type PagoFuturo } from '@/data/escenario';
import { cuentaPorId, cuentasActuales, destinoDeCuenta, destinoDeDestinatario, ordenACuenta, pactadas, pagosPendientes, posiciones, posicionesPorDivisa, proyecciones } from './derivados';
import { cotizacionPanel, divisasOperar, type Clase, type Destino, type EstadoApp, type OperacionHecha, type Orden } from './estado';


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
  posiciones: VistaPosicion[];
  nuevo: { monto: Centavos; divisa: Divisa; de: string; meta: string } | null;
  proximos: VistaFila[];
  totalProximos: number;
  verTodos: boolean;
  realizados: VistaFila[];
  tdc: { par: string; compra: TdcMicro; venta: TdcMicro; tendencia: number[]; hora: string; enVivo: boolean; otros: { par: string; base: Divisa; compra: TdcMicro; venta: TdcMicro }[] };
  cuentas: VistaCuenta[];
  totalMXN: Centavos;
}

export function vistaHome(e: EstadoApp): VistaHome {
  const ctas = cuentasActuales(e);
  const pos = posiciones(e);
  const proy = proyecciones(e);
  const pendientes = pagosPendientes(e);
  const pact = pactadas(e);
  const ordenadas = [...ctas].sort((a, b) => ORDEN_POSICIONES.indexOf(a.id) - ORDEN_POSICIONES.indexOf(b.id));

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
        accion = { label: `Comprar ${fmt.compacto(p.resultado.monto)} ${c.divisa}`, orden: ordenACuenta(c, p.resultado.monto, 'MXN') };
      }
    } else if (e.datos.loNuevo && c.divisa === e.datos.loNuevo.divisa) {
      linea = `Incluye los ${fmt.numero(e.datos.loNuevo.monto)} de ${e.datos.loNuevo.de}`;
    }
    const cruce = pr ? pr.serie.findIndex((v) => v < 0) : -1;
    return {
      id: c.id, divisa: c.divisa, nombre: NOMBRE_DIVISA[c.divisa].plural, saldo: c.saldo,
      pactadasRecibir: p.pactadasRecibir, pactadasLiquidar: p.pactadasLiquidar, pagosFuturos: p.pagosFuturos, resultado: p.resultado,
      proyeccion: pr ? { serie: pr.serie, etiquetas: pr.dias.map(fmt.diaCorto), etiquetaCruce: cruce >= 0 ? 'faltante' : null } : null,
      linea, accion, enlace,
    };
  });

  const finSemana = (() => { const d = new Date(HOY); const resto = 5 - d.getDay(); d.setDate(d.getDate() + Math.max(0, resto)); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); })();
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

  const hechas: VistaFila[] = e.operaciones.filter((o) => o.estado === 'En proceso').map((o) => {
    const origen = cuentaPorId(e, o.origenId)!;
    return {
      id: o.id, fecha: 'Hoy', nombre: nombreMovimiento(o), monto: -o.pagas, divisa: origen.divisa, estaSemana: true,
      detalle: o.tdc != null ? `${fmt.monto(o.recibe, o.destino.divisa)} a ${fmt.tdc(o.tdc)}` : undefined,
      badge: { texto: 'En proceso', tono: 'warning' as const },
    };
  });
  const pasados: VistaFila[] = e.datos.realizados.map((r, i) => ({ id: `r${i}`, fecha: mismoDia(r.fecha, HOY) ? 'Hoy' : fmt.diaMes(r.fecha), nombre: r.nombre, monto: r.monto, divisa: r.divisa, estaSemana: true }));

  const usd = e.tdcVivo['USD/MXN'];
  const eurmxn = e.tdcVivo['EUR/MXN'];
  const totalMXN = ctas.reduce((acc, c) => acc + (c.divisa === 'MXN' ? c.saldo : (cotizar({ origen: c.divisa, destino: 'MXN', monto: c.saldo, ladoFijo: 'pagas', pares: e.tdcVivo })?.recibe ?? 0)), 0);

  return {
    posiciones: vistaPos,
    nuevo: e.datos.loNuevo ? { monto: e.datos.loNuevo.monto, divisa: e.datos.loNuevo.divisa, de: e.datos.loNuevo.de, meta: `Hoy ${e.datos.loNuevo.hora} · ${e.datos.loNuevo.banco} · Ref. ${e.datos.loNuevo.referencia}` } : null,
    proximos,
    totalProximos: todas.length,
    verTodos: e.verTodosLosPagos,
    realizados: [...hechas, ...pasados],
    tdc: { par: 'USD/MXN', compra: usd.compra, venta: usd.venta, tendencia: TENDENCIA_DIA, hora: HORA_TDC, enVivo: !e.congelado, otros: [{ par: 'EUR/MXN', base: 'EUR', compra: eurmxn.compra, venta: eurmxn.venta }] },
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

// ------------------------------------------------------------------ Panel
export interface VistaOpcionOrigen {
  id: CuentaId;
  nombre: string;
  saldo: string;
  pagas: string;
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string };
  seleccionada: boolean;
}

export interface VistaFecha { fecha: Date; etiqueta: string; vence: boolean; seleccionada: boolean; deshabilitada: boolean; motivo?: string }

export interface GrupoDestino {
  titulo: string;
  items: { id: string; divisa: Divisa; nombre: string; sub: string; seleccionado: boolean; destino: Destino; pago?: PagoFuturo }[];
}

export interface VistaPanel {
  tipo: 'pago' | 'depositar';
  titulo: string;
  sub: string;
  paso: EstadoApp['panel']['paso'];
  sinTdc: boolean;
  mercadoCerrado: boolean;
  primario: { label: string; habilitado: boolean; accion: 'continuar' | 'pedirPrecio' | 'confirmar' | 'volverInicio' | 'cerrar' | 'ninguna' };
  secundario: { label: string; accion: 'cancelar' | 'volver' | 'volverOrigen' | 'comprobante' | 'volverDestino' } | null;
  destino: { busqueda: string; grupos: GrupoDestino[] } | null;
  origenes: VistaOpcionOrigen[];
  revision: {
    editable: boolean;
    pagas: Centavos; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; ladoFijo: 'recibe' | 'pagas'; destinatario: string;
    fechas: VistaFecha[]; fechaEsHoy: boolean; fechaDia: string; hoyNoAlcanza: boolean;
    texto: string; ayuda: string | null; efecto: string; posVencimiento: string | null;
    tdc: TdcMicro | null; motivo: string | null; motivos: string[]; referencia: string;
  } | null;
  precio: {
    estado: 'fijo' | 'vencido' | 'sinTdc'; tdc: TdcMicro | null; segundos: number; porVencer: boolean;
    pagas: Centavos; pagasAprox: boolean; pagasDivisa: Divisa; recibe: Centavos; recibeDivisa: Divisa; destinatario: string; desde: string; sale: string | null;
    token: string; tokenError: string | null; confirmando: boolean;
  } | null;
  confirmacion: VistaConfirmacion | null;
  depositar: { cuenta: string; clabe: string; banco: string } | null;
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

export function gruposDestino(e: EstadoApp, busqueda: string, opciones: { conPagos: boolean; divisa?: Divisa | null; excluirCuentaId?: CuentaId | null; divisaDestinatarios?: Divisa | null }): GrupoDestino[] {
  const q = busqueda.trim().toLowerCase();
  const coincide = (n: string) => !q || n.toLowerCase().includes(q);
  const grupos: GrupoDestino[] = [];
  if (opciones.conPagos) {
    const pend = pagosPendientes(e).filter((p) => !p.pactada && coincide(p.destinatario));
    if (pend.length) grupos.push({ titulo: 'Pagos próximos', items: pend.map((p) => ({ id: `pago:${p.id}`, divisa: p.divisa, nombre: p.destinatario, sub: `${fmt.monto(p.monto, p.divisa)} · vence ${fmt.diaCorto(p.fecha)} · ${p.referencia}`, seleccionado: false, destino: destinoDeDestinatario({ id: p.destinatarioId, nombre: p.destinatario, divisa: p.divisa, banco: p.cuentaDestino.banco, mascara: p.cuentaDestino.mascara }), pago: p })) });
  }
  const cuentas = e.datos.cuentas.filter((c) => c.id !== opciones.excluirCuentaId && (!opciones.divisa || c.divisa === opciones.divisa) && coincide(c.nombre));
  if (cuentas.length) grupos.push({ titulo: 'Tus cuentas', items: cuentas.map((c) => ({ id: c.id, divisa: c.divisa, nombre: c.nombre, sub: `${c.banco} · **** ${c.mascara}`, seleccionado: false, destino: destinoDeCuenta(c) })) });
  const divisaDest = opciones.divisaDestinatarios ?? opciones.divisa ?? null;
  const dest = e.datos.destinatarios.filter((d) => (!divisaDest || d.divisa === divisaDest) && coincide(d.nombre));
  if (dest.length) grupos.push({ titulo: divisaDest ? `Destinatarios en ${divisaDest}` : 'Destinatarios', items: dest.map((d: Destinatario) => ({ id: d.id, divisa: d.divisa, nombre: d.nombre, sub: `${d.banco} · **** ${d.mascara}`, seleccionado: false, destino: destinoDeDestinatario(d) })) });
  return grupos;
}

export function vistaPanel(e: EstadoApp): VistaPanel | null {
  const { panel } = e;
  if (!panel.abierto) return null;
  const vacio: VistaPanel = { tipo: panel.tipo, titulo: 'Pagar', sub: '', paso: panel.paso, sinTdc: false, mercadoCerrado: e.datos.mercado === 'cerrado', primario: { label: 'Continuar', habilitado: false, accion: 'ninguna' }, secundario: { label: 'Cancelar', accion: 'cancelar' }, destino: null, origenes: [], revision: null, precio: null, confirmacion: null, depositar: null };

  if (panel.tipo === 'depositar') {
    const mxn = e.datos.cuentas.find((c) => c.clabe);
    return { ...vacio, titulo: 'Datos para depositar', sub: mxn ? `${mxn.nombre} · **** ${mxn.mascara}` : '', primario: { label: 'Listo', habilitado: true, accion: 'cerrar' }, secundario: null, depositar: mxn ? { cuenta: mxn.nombre, clabe: mxn.clabe!, banco: mxn.banco } : null };
  }

  const orden = panel.orden;
  if (panel.paso === 'destino' || !orden) {
    return { ...vacio, titulo: 'Pagar', sub: '¿A quién le pagas?', paso: 'destino', destino: { busqueda: panel.busquedaDestino, grupos: gruposDestino(e, panel.busquedaDestino, { conPagos: true, excluirCuentaId: panel.origenId }) } };
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

  const origenes: VistaOpcionOrigen[] = ctas
    .filter((c) => c.id !== orden.destino.cuentaId)
    .map((c) => {
      const ev = evaluarOrigen({ origen: c, monto: montoRecibe, divisaDestino: orden.destino.divisa, destinoPropio: orden.destino.tipo === 'propia', pagoCargado: !!orden.pagoId, posiciones: pos, proyecciones: proy, pares: e.tdcVivo });
      return { id: c.id, nombre: c.nombre, saldo: `Saldo ${fmt.monto(c.saldo, c.divisa)}`, pagas: ev.pagasTexto, consecuencia: { texto: ev.consecuencia.texto, tono: tonoBadge[ev.consecuencia.tono], ayuda: ev.consecuencia.ayuda }, seleccionada: c.id === panel.origenId };
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
      tdc: sinTdc ? null : tdcInd, motivo: orden.motivo, motivos: MOTIVOS, referencia: orden.referencia,
    };
  }

  let precio: VistaPanel['precio'] = null;
  if (panel.paso === 'precio' && origen && cotInd) {
    const fijo = panel.precio.estado === 'fijo' ? panel.precio : null;
    const vencido = panel.precio.estado === 'vencido' ? panel.precio : null;
    const estadoPrecio = sinTdc ? 'sinTdc' : fijo ? 'fijo' : 'vencido';
    const cotFija = fijo && cot ? cot : null;
    precio = {
      estado: estadoPrecio, tdc: fijo ? fijo.tdc : vencido ? vencido.tdc : cotInd.tdc, segundos: fijo ? fijo.venceEn : 0, porVencer: !!fijo && fijo.venceEn <= 30,
      pagas: cotFija ? cotFija.pagas : cotInd.pagas, pagasAprox: !fijo && !sinTdc, pagasDivisa: origen.divisa, recibe: cotFija ? cotFija.recibe : cotInd.recibe, recibeDivisa: orden.destino.divisa, destinatario: recibeNombre, desde: origen.nombre,
      sale: fechaEsHoy || sinTdc ? null : `El dinero sale el ${fechaDia}`,
      token: panel.token, tokenError: panel.tokenError, confirmando: panel.confirmando,
    };
  }

  let confirmacion: VistaPanel['confirmacion'] = null;
  if (panel.paso === 'confirmacion' && ultima) confirmacion = vistaConfirmacion(e, ultima);

  const tokenListo = panel.token.length === 6 && !panel.confirmando;
  const mercadoCerrado = e.datos.mercado === 'cerrado';
  const puedeContinuar = !!origen && !!cotInd && cotInd.recibe > 0;
  const primario: VistaPanel['primario'] =
    panel.paso === 'origen' ? { label: 'Continuar', habilitado: puedeContinuar, accion: 'continuar' }
      : panel.paso === 'revision' ? (sinTdc ? { label: 'Continuar', habilitado: puedeContinuar, accion: 'pedirPrecio' } : { label: 'Pedir precio', habilitado: puedeContinuar && !mercadoCerrado, accion: 'pedirPrecio' })
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
    ...(o.motivo ? [{ k: 'Motivo', v: o.motivo }] : []),
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
