'use client';
import { useEffect, useReducer, useRef } from 'react';
import { ESTADO_INICIAL, ordenDePago, pagoPorId, reducer } from '@/state/estado';
import { HomeVista } from './HomeVista';

const CLAVE_ONBOARDING = 'valiu.onboarding.visto';
const PASO_TDC = 0.0008;

/**
 * Estado vivo del home: cuenta regresiva del precio (P la pausa), tipo de cambio en una banda chica,
 * onboarding una sola vez (flag en localStorage) y parámetros de URL:
 *   ?pago=p1 abre el panel · ?pestana=operar · ?mercado=cerrado · ?recorrido=1 repite el onboarding.
 */
export function HomeApp() {
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL);
  const raizRef = useRef<HTMLDivElement>(null);
  const hayFijo = estado.panel.precio.estado === 'fijo' || estado.operar.precio.estado === 'fijo';
  const { pausado } = estado;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mercado') === 'cerrado') dispatch({ tipo: 'mercado', mercado: 'cerrado' });
    if (params.get('pestana') === 'operar') dispatch({ tipo: 'pestana', pestana: 'operar' });
    const pago = params.get('pago');
    if (pago && pagoPorId(pago)) dispatch({ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(pago)!) });
    let visto = false;
    try { visto = window.localStorage.getItem(CLAVE_ONBOARDING) === '1'; } catch { visto = true; }
    if (params.get('recorrido') === '1' || (!visto && !pago)) dispatch({ tipo: 'onboardingIniciar' });
  }, []);

  const onboardingActivo = estado.onboarding.activo;
  const vioAlguno = useRef(false);
  useEffect(() => {
    if (onboardingActivo) { vioAlguno.current = true; return; }
    if (vioAlguno.current) { try { window.localStorage.setItem(CLAVE_ONBOARDING, '1'); } catch { /* sin almacenamiento */ } }
  }, [onboardingActivo]);

  const pagoAbierto = estado.panel.abierto ? estado.panel.orden?.pagoId ?? null : null;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (pagoAbierto) url.searchParams.set('pago', pagoAbierto); else url.searchParams.delete('pago');
    url.searchParams.delete('recorrido');
    window.history.replaceState(null, '', url);
  }, [pagoAbierto]);

  useEffect(() => {
    if (!hayFijo) return;
    const id = window.setInterval(() => dispatch({ tipo: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [hayFijo]);

  useEffect(() => {
    if (hayFijo || pausado) return;
    const id = window.setInterval(() => dispatch({ tipo: 'tdcDeriva', delta: (Math.random() - 0.5) * PASO_TDC }), 3000);
    return () => window.clearInterval(id);
  }, [hayFijo, pausado]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if ((e.key === 'p' || e.key === 'P') && hayFijo) dispatch({ tipo: 'pausar' });
      if (e.key === 'Escape' && onboardingActivo) dispatch({ tipo: 'onboardingCerrar' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hayFijo, onboardingActivo]);

  return <HomeVista estado={estado} dispatch={dispatch} modo="app" raizRef={raizRef} />;
}
