'use client';
import { useEffect, useReducer, useRef } from 'react';
import { oscilarTdc } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import { CONFIRMANDO_MS, ESCENARIOS, HOY, OSCILACION_MS, OSCILACION_TDC, TDC_BASE, type EscenarioNombre } from '@/data/escenario';
import { ESTADO_INICIAL, reducer } from '@/state/estado';
import { estadoDeEscenario } from '@/state/escenarios';
import { HomeVista } from './HomeVista';
import { AvisoPantalla } from './AvisoPantalla';
import { ControlDemo } from './ControlDemo';

const TOAST_MS = 2500;

/** Reloj del escenario: 10:42 de CDMX más el tiempo real transcurrido desde la carga. */
const horaEscenario = (inicio: number) => fmt.hora(new Date(HOY.getTime() + (inicio ? Date.now() - inicio : 0)));

function opcionesDeUrl() {
  const params = new URLSearchParams(window.location.search);
  const nombre = params.get('escenario');
  const escenario: EscenarioNombre = ESCENARIOS.includes(nombre as EscenarioNombre) ? (nombre as EscenarioNombre) : 'faltante';
  return { escenario, congelado: params.get('congelar') === '1', demo: params.get('demo') === '1', recorrido: params.get('recorrido') !== '0' };
}

/**
 * Estado vivo del prototipo, todo en memoria (recargar reinicia el escenario):
 * reloj del escenario (10:42 + tiempo real), indicativo oscilando ±0.002 % cada 3–5 s, cuenta regresiva del precio,
 * "Confirmando…" de 800 ms y parámetros de URL: ?escenario= · ?congelar=1 · ?demo=1 · ?recorrido=0.
 */
export function HomeApp() {
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL);
  const raizRef = useRef<HTMLDivElement>(null);
  const inicioRef = useRef<number>(0);

  useEffect(() => {
    inicioRef.current = Date.now();
    const o = opcionesDeUrl();
    dispatch({ tipo: 'reiniciar', estado: estadoDeEscenario(o.escenario, o) });
  }, []);

  const hayFijo = estado.panel.precio.estado === 'fijo' || estado.operar.precio.estado === 'fijo';
  useEffect(() => {
    if (!hayFijo) return;
    const id = window.setInterval(() => dispatch({ tipo: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [hayFijo]);

  const { congelado } = estado;
  useEffect(() => {
    if (congelado) return;
    let id = 0;
    const paso = () => {
      const pares = Object.fromEntries(Object.entries(TDC_BASE).map(([par, v]) => {
        const r = (Math.random() * 2 - 1) * OSCILACION_TDC;
        return [par, { compra: oscilarTdc(v.compra, r), venta: oscilarTdc(v.venta, r) }];
      }));
      dispatch({ tipo: 'tdcVivo', pares });
      id = window.setTimeout(paso, OSCILACION_MS[0] + Math.random() * (OSCILACION_MS[1] - OSCILACION_MS[0]));
    };
    id = window.setTimeout(paso, OSCILACION_MS[0]);
    return () => window.clearTimeout(id);
  }, [congelado]);

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

  const onboardingActivo = estado.onboarding.activo;
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
          onReiniciar={() => { inicioRef.current = Date.now(); dispatch({ tipo: 'reiniciar', estado: estadoDeEscenario(estado.escenario, { congelado: estado.congelado, demo: true, recorrido: false }) }); }}
        />
      ) : null}
    </>
  );
}
