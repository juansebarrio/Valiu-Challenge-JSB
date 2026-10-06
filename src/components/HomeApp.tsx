'use client';
import { useEffect, useReducer, useRef } from 'react';
import { oscilarTdc } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import { CONFIRMANDO_MS, ESCENARIOS, HOY, OSCILACION_MS, OSCILACION_TDC, type ArquetipoId, type EscenarioNombre } from '@/data/escenario';
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
    /** ?pago=<id> abre el panel en Origen con ese pago; ?cobro=<id> lo abre desde el cobro de hoy. */
    pago: params.get('pago'),
    cobro: params.get('cobro'),
  };
}

/** Acciones iniciales que piden los parámetros de URL, sobre el estado ya reiniciado. */
function accionesDeUrl(estado: ReturnType<typeof estadoDeEscenario>, o: ReturnType<typeof opcionesDeUrl>): Accion[] {
  const pago = o.pago ? pagoPorId(estado, o.pago) : null;
  if (pago) return [{ tipo: 'abrirPanel', orden: ordenDePago(pago) }];
  if (o.cobro && estado.datos.loNuevo?.id === o.cobro) return [{ tipo: 'abrirCobro', cobroId: o.cobro }];
  return [];
}

/**
 * Estado vivo del prototipo, todo en memoria (recargar reinicia el escenario):
 * reloj del escenario (10:42 + tiempo real), indicativo oscilando ±0.002 % cada 3–5 s, cuenta regresiva del precio,
 * "Confirmando…" y "Cancelando…" de 800 ms y parámetros de URL: ?escenario= · ?congelar=1 · ?demo=1 · ?recorrido=0.
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

  const hayFijo = estado.panel.precio.estado === 'fijo' || estado.operar.precio.estado === 'fijo';
  useEffect(() => {
    if (!hayFijo) return;
    const id = window.setInterval(() => dispatch({ tipo: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [hayFijo]);

  const { congelado, tdcBase } = estado;
  useEffect(() => {
    if (congelado) return;
    let id = 0;
    const paso = () => {
      const pares = Object.fromEntries(Object.entries(tdcBase).map(([par, v]) => {
        const r = (Math.random() * 2 - 1) * OSCILACION_TDC;
        return [par, { compra: oscilarTdc(v.compra, r), venta: oscilarTdc(v.venta, r) }];
      }));
      dispatch({ tipo: 'tdcVivo', pares });
      id = window.setTimeout(paso, OSCILACION_MS[0] + Math.random() * (OSCILACION_MS[1] - OSCILACION_MS[0]));
    };
    id = window.setTimeout(paso, OSCILACION_MS[0]);
    return () => window.clearTimeout(id);
  }, [congelado, tdcBase]);

  const confirmandoPanel = estado.panel.confirmando;
  useEffect(() => {
    if (!confirmandoPanel) return;
    const id = window.setTimeout(() => dispatch({ tipo: 'confirmado', hora: horaEscenario(inicioRef.current) }), CONFIRMANDO_MS);
    return () => window.clearTimeout(id);
  }, [confirmandoPanel]);

  const cancelando = estado.panel.cancelando;
  useEffect(() => {
    if (!cancelando) return;
    const id = window.setTimeout(() => dispatch({ tipo: 'pactadaCancelada', hora: horaEscenario(inicioRef.current) }), CONFIRMANDO_MS);
    return () => window.clearTimeout(id);
  }, [cancelando]);

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
