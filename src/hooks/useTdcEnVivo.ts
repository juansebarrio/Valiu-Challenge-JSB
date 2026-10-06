'use client';
import { useEffect } from 'react';
import { oscilarTdc } from '@/lib/dinero';
import type { TablaPares } from '@/lib/fx';
import { OSCILACION_MS, OSCILACION_TDC } from '@/data/escenario';

/** Un paso del indicativo en vivo: cada par se mueve ±0.002 % alrededor de su base (los dos lados juntos). */
export function pasoTdc(base: TablaPares): TablaPares {
  return Object.fromEntries(Object.entries(base).map(([par, v]) => {
    const r = (Math.random() * 2 - 1) * OSCILACION_TDC;
    return [par, { compra: oscilarTdc(v.compra, r), venta: oscilarTdc(v.venta, r) }];
  }));
}

/**
 * Tipo de cambio indicativo en vivo (demo): cada 3–5 s entrega una tabla nueva alrededor de `base` (D-32).
 * En producción este hook se cambia por polling o socket al precio indicativo; todos los montos "≈" se derivan del último valor entregado.
 * Quieto cuando `activo` es false (?congelar=1 o pausa con la tecla P).
 */
export function useTdcEnVivo({ base, activo, onPaso }: { base: TablaPares; activo: boolean; onPaso: (pares: TablaPares) => void }) {
  useEffect(() => {
    if (!activo) return;
    let id = 0;
    const paso = () => {
      onPaso(pasoTdc(base));
      id = window.setTimeout(paso, OSCILACION_MS[0] + Math.random() * (OSCILACION_MS[1] - OSCILACION_MS[0]));
    };
    id = window.setTimeout(paso, OSCILACION_MS[0]);
    return () => window.clearTimeout(id);
  }, [base, activo, onPaso]);
}
