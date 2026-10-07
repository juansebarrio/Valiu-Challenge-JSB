'use client';
import { useRef, type FC, type ReactNode } from 'react';
import { useDialogo } from '@/hooks/useDialogo';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';

export interface ModalOperarProps {
  titulo: string;
  sub: string;
  primario: { label: string; habilitado: boolean; onClick: () => void };
  secundario?: { label: string; onClick: () => void } | null;
  onCerrar: () => void;
  /** amplio: pasos de dos columnas (Origen, Revisión, Precio) · angosto: el resto. */
  ancho: 'amplio' | 'angosto';
  children: ReactNode;
  /** app: centrada en el viewport · frame: absoluta dentro del frame de 1280 px. */
  modo?: 'app' | 'frame';
}

/**
 * Ventana de pago (C-47): centrada, radio 16, --shadow-lg y el mismo overlay que el panel lateral. 920 px en los pasos de dos columnas y
 * 560 px en los de una; el ancho cambia con una transición de 200 ms (sin animación con prefers-reduced-motion ni en los frames).
 * Encabezado y pie siempre visibles: si algo no entra en calc(100dvh − 48px), scrollea solo el cuerpo. Pie alineado a la derecha.
 * En los frames de /tablero/alta va absoluta dentro del frame, centrada en horizontal y con un top fijo, sin depender del alto del frame.
 */
export const ModalOperar: FC<ModalOperarProps> = ({ titulo, sub, primario, secundario, onCerrar, ancho, children, modo = 'app' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const esApp = modo === 'app';
  useDialogo(ref, onCerrar, esApp);
  return (
    <>
      <div onClick={onCerrar} aria-hidden className={`${esApp ? 'fixed' : 'absolute'} inset-0 z-20 bg-app-overlay`} />
      <div className={esApp ? 'pointer-events-none fixed inset-0 z-30 flex items-center justify-center' : 'pointer-events-none absolute inset-x-0 top-(--app-modal-top-frame) z-30 flex justify-center'}>
        <div
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          aria-describedby="modal-sub"
          data-component="ModalOperar"
          data-ancho={ancho}
          className={[
            'pointer-events-auto flex flex-col rounded-lg bg-app-surface shadow-lg outline-none',
            ancho === 'amplio' ? 'w-(--app-modal-w)' : 'w-(--app-modal-w-sm)',
            esApp ? 'max-h-(--app-modal-max-h) max-w-(--app-modal-max-w) transition-[width] duration-200 ease-out motion-reduce:transition-none' : '',
          ].join(' ')}
        >
          <div className="flex shrink-0 flex-col gap-1 border-b border-app-divider px-6 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="modal-titulo" className="text-h2 font-semibold">{titulo}</h2>
              <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-(--app-close-btn) cursor-pointer items-center justify-center rounded-sm bg-transparent text-app-ink hover:bg-app-canvas">
                <Icono nombre="times" tamano="lg" />
              </button>
            </div>
            <span id="modal-sub" className="text-body text-app-ink-2 tabular-nums">{sub}</span>
          </div>
          <div data-cuerpo className={['min-h-0 flex-1 px-6 py-5', esApp ? 'overflow-y-auto' : ''].join(' ')}>{children}</div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-app-divider px-6 pb-5 pt-4">
            {secundario ? <Boton variante="secondary" tamano="xl-14" onClick={secundario.onClick} className="min-w-(--app-modal-btn-w)">{secundario.label}</Boton> : null}
            <Boton variante="primary" tamano="xl" onClick={primario.onClick} disabled={!primario.habilitado} aria-busy={primario.label.endsWith('…') || undefined} className="min-w-(--app-modal-btn-w-primario)">{primario.label}</Boton>
          </div>
        </div>
      </div>
    </>
  );
};
