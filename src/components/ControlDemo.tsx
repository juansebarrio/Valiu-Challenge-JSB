import type { FC } from 'react';
import { Boton } from './ui/Boton';

export interface ControlDemoProps {
  hayPrecio: boolean;
  onVencer: () => void;
  onRecorrido: () => void;
  onReiniciar: () => void;
}

/** Control flotante discreto para demos (?demo=1). */
export const ControlDemo: FC<ControlDemoProps> = ({ hayPrecio, onVencer, onRecorrido, onReiniciar }) => (
  <div role="group" aria-label="Controles de demo" className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-sm border border-app-divider bg-app-surface p-2 shadow-md">
    <span className="px-1 text-caption font-bold text-app-ink-2">Demo</span>
    <Boton variante="secondary" tamano="mid" onClick={onVencer} disabled={!hayPrecio}>Vencer precio</Boton>
    <Boton variante="secondary" tamano="mid" onClick={onRecorrido}>Ver recorrido</Boton>
    <Boton variante="secondary" tamano="mid" onClick={onReiniciar}>Reiniciar escenario</Boton>
  </div>
);
