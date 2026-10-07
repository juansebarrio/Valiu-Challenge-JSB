'use client';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import * as fmt from '@/lib/format';
import type { TablaPares } from '@/lib/fx';
import { CONFIRMANDO_MS, ESCENARIOS, HOY, type ArquetipoId, type EscenarioNombre } from '@/data/escenario';
import { useTdcEnVivo } from '@/hooks/useTdcEnVivo';
import { estadoInicial, pagoPorId, reducer, type Accion } from '@/state/estado';
import { estadoDeEscenario } from '@/state/escenarios';
import { ordenDePago } from '@/state/derivados';
import { HomeVista } from './HomeVista';
import { AvisoPantalla } from './AvisoPantalla';
import { ControlDemo } from './ControlDemo';

const TOAST_MS = 2500;

/** Reloj del escenario: 10:42 de CDMX más el tiempo real transcurrido desde la carga. */
const horaEscenario = (inicio: number) => fmt.hora(new Date(HOY.getTime() + (inicio ? Date.now() - inicio : 0)));

/** Arquetipos cuyo recorrido ya se cerró en esta sesión (en memoria: recargar lo vuelve a mostrar, C-23). */
const RECORRIDOS_VISTOS = new Set<ArquetipoId>();

function opcionesDeUrl(arquetipo: ArquetipoId) {
  const params = new URLSearchParams(window.location.search);
  const nombre = params.get('escenario');
  const escenario: EscenarioNombre = ESCENARIOS.includes(nombre as EscenarioNombre) ? (nombre as EscenarioNombre) : 'faltante';
  return {
    escenario,
    congelado: params.get('congelar') === '1',
    demo: params.get('demo') === '1',
    recorrido: params.get('recorrido') !== '0' && !RECORRIDOS_VISTOS.has(arquetipo),
    /** ?pago=<id> abre la ventana de pago en Origen con ese pago; ?cobro=<id> la abre desde el cobro de hoy. */
    pago: params.get('pago'),
    cobro: params.get('cobro'),
    /** ?seccion=movimientos|control|destinatarios|monitoreo abre esa sección del menú. */
    seccion: params.get('seccion'),
  };
}

/** Acciones iniciales que piden los parámetros de URL, sobre el estado ya reiniciado. */
function accionesDeUrl(estado: ReturnType<typeof estadoDeEscenario>, o: ReturnType<typeof opcionesDeUrl>): Accion[] {
  const secciones = ['movimientos', 'control', 'destinatarios', 'monitoreo'] as const;
  const seccion = secciones.find((x) => x === o.seccion);
  const acciones: Accion[] = seccion ? [{ tipo: 'seccion', seccion }] : [];
  const pago = o.pago ? pagoPorId(estado, o.pago) : null;
  if (pago) acciones.push({ tipo: 'abrirPanel', orden: ordenDePago(pago) });
  else if (o.cobro && estado.datos.loNuevo?.id === o.cobro) acciones.push({ tipo: 'abrirCobro', cobroId: o.cobro });
  return acciones;
}

/**
 * Estado vivo del prototipo, todo en memoria (recargar reinicia el escenario):
 * reloj del escenario (10:42 + tiempo real), indicativo oscilando ±0.002 % cada 3–5 s, cuenta regresiva del precio,
 * "Confirmando…" de 800 ms y parámetros de URL: ?escenario= · ?congelar=1 · ?demo=1 · ?recorrido=0.
 */
export function HomeApp({ arquetipo }: { arquetipo: ArquetipoId }) {
  const [estado, dispatch] = useReducer(reducer, arquetipo, (a) => estadoInicial('faltante', {}, a));
  const raizRef = useRef<HTMLDivElement>(null);
  const inicioRef = useRef<number>(0);

  useEffect(() => {
    inicioRef.current = Date.now();
    const o = opcionesDeUrl(arquetipo);
    const inicial = estadoDeEscenario(o.escenario, o, arquetipo);
    dispatch({ tipo: 'reiniciar', estado: inicial });
    for (const accion of accionesDeUrl(inicial, o)) dispatch(accion);
  }, [arquetipo]);

  // El recorrido se muestra una vez por arquetipo dentro de la sesión.
  const onboardingActivo = estado.onboarding.activo;
  const huboRecorrido = useRef(false);
  useEffect(() => {
    if (onboardingActivo) huboRecorrido.current = true;
    else if (huboRecorrido.current) RECORRIDOS_VISTOS.add(arquetipo);
  }, [onboardingActivo, arquetipo]);

  const { congelado, pausado, tdcBase } = estado;
  const hayFijo = estado.panel.precio.estado === 'fijo' || estado.operar.precio.estado === 'fijo';
  useEffect(() => {
    if (!hayFijo || pausado) return;
    const id = window.setInterval(() => dispatch({ tipo: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [hayFijo, pausado]);

  // Indicativo en vivo: el último valor entregado es el que usan todos los montos "≈" (vistas.ts cotiza con estado.tdcVivo).
  const onPaso = useCallback((pares: TablaPares) => dispatch({ tipo: 'tdcVivo', pares }), []);
  useTdcEnVivo({ base: tdcBase, activo: !congelado && !pausado, onPaso });

  // Tecla P (D-32): pausa el indicativo en vivo y la cuenta regresiva, solo con ?demo=1 (C-40). Nunca se dispara con el foco en un campo.
  const demo = estado.demo;
  useEffect(() => {
    if (!demo) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'p' && e.key !== 'P') || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const enCampo = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (enCampo) return;
      e.preventDefault();
      dispatch({ tipo: 'alternarPausa' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [demo]);

  const confirmandoPanel = estado.panel.confirmando;
  useEffect(() => {
    if (!confirmandoPanel) return;
    const id = window.setTimeout(() => dispatch({ tipo: 'confirmado', hora: horaEscenario(inicioRef.current) }), CONFIRMANDO_MS);
    return () => window.clearTimeout(id);
  }, [confirmandoPanel]);

  const confirmandoOperar = estado.operar.confirmando;
  useEffect(() => {
    if (!confirmandoOperar) return;
    const id = window.setTimeout(() => dispatch({ tipo: 'opConfirmado', hora: horaEscenario(inicioRef.current) }), CONFIRMANDO_MS);
    return () => window.clearTimeout(id);
  }, [confirmandoOperar]);

  const toastId = estado.toast?.id ?? null;
  useEffect(() => {
    if (toastId == null) return;
    const id = window.setTimeout(() => dispatch({ tipo: 'cerrarToast' }), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toastId]);

  useEffect(() => {
    if (!onboardingActivo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({ tipo: 'onboardingCerrar' }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onboardingActivo]);

  return (
    <>
      <AvisoPantalla />
      <HomeVista estado={estado} dispatch={dispatch} modo="app" raizRef={raizRef} />
      {estado.demo ? (
        <ControlDemo
          hayPrecio={hayFijo}
          onVencer={() => dispatch({ tipo: 'vencerPrecio' })}
          onRecorrido={() => dispatch({ tipo: 'onboardingIniciar' })}
          onReiniciar={() => { inicioRef.current = Date.now(); dispatch({ tipo: 'reiniciar', estado: estadoDeEscenario(estado.escenario, { congelado: estado.congelado, demo: true, recorrido: false }, arquetipo) }); }}
        />
      ) : null}
    </>
  );
}
