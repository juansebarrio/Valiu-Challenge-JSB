'use client';
import { useRef, type FC, type ReactNode } from 'react';
import { useDialogo } from '@/hooks/useDialogo';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';

export interface PanelOperarProps {
  titulo: string;
  sub: string;
  primario: { label: string; habilitado: boolean; onClick: () => void };
  secundario?: { label: string; onClick: () => void } | null;
  onCerrar: () => void;
  children: ReactNode;
  /** app: fijo al viewport · frame: absoluto dentro del frame de 1280 px. */
  modo?: 'app' | 'frame';
}

/**
 * Panel lateral de consulta (detalle de un movimiento, notificaciones, todas las cuentas; C-47): 480 px, radio 16 a la izquierda,
 * --shadow-lg, overlay rgba(21,21,34,.4). role=dialog, foco atrapado, Esc cierra y el foco vuelve al botón que lo abrió (useDialogo).
 * Operar va en la ventana de pago (ModalOperar).
 */
export const PanelOperar: FC<PanelOperarProps> = ({ titulo, sub, primario, secundario, onCerrar, children, modo = 'app' }) => {
  const ref = useRef<HTMLElement>(null);
  const esApp = modo === 'app';
  useDialogo(ref, onCerrar, esApp);

  const pos = esApp ? 'fixed' : 'absolute';
  return (
    <>
      <div onClick={onCerrar} aria-hidden className={`${pos} inset-0 z-20 bg-app-overlay`} />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-titulo"
        aria-describedby="panel-sub"
        data-component="PanelOperar"
        className={`${pos} inset-y-0 right-0 z-30 flex w-(--app-panel-w) max-w-full flex-col rounded-l-lg bg-app-surface shadow-lg outline-none`}
      >
        <div className="flex flex-col gap-1 border-b border-app-divider px-6 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="panel-titulo" className="text-h2 font-semibold">{titulo}</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-(--app-close-btn) cursor-pointer items-center justify-center rounded-sm bg-transparent text-app-ink hover:bg-app-canvas">
              <Icono nombre="times" tamano="lg" />
            </button>
          </div>
          <span id="panel-sub" className="text-body text-app-ink-2 tabular-nums">{sub}</span>
        </div>
        <div className={['flex min-h-0 flex-1 flex-col gap-4 px-6 py-5', esApp ? 'overflow-y-auto' : ''].join(' ')}>{children}</div>
        <div className="flex gap-3 border-t border-app-divider px-6 pb-5 pt-4">
          {secundario ? <Boton variante="secondary" tamano="xl-14" onClick={secundario.onClick} className="min-w-0 flex-1 px-3">{secundario.label}</Boton> : null}
          <Boton variante="primary" tamano="xl" onClick={primario.onClick} disabled={!primario.habilitado} aria-busy={primario.label.endsWith('…') || undefined} className="min-w-0 flex-1 px-3">{primario.label}</Boton>
        </div>
      </aside>
    </>
  );
};
