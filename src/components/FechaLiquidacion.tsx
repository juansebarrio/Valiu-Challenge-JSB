'use client';
import { useRef, type FC } from 'react';

export interface OpcionFecha {
  fecha: Date;
  etiqueta: string;
  vence: boolean;
}

export interface FechaLiquidacionProps {
  opciones: OpcionFecha[];
  valor: Date;
  onChange: (fecha: Date) => void;
  /** false sin tipo de cambio (transferencias en la misma divisa). */
  visible?: boolean;
  /** Solo para la hoja de estados de /sistema. */
  demoHover?: number;
  demoFoco?: number;
}

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Segmented del DS a todo el ancho; elegida con el color del Figma (D-28). role=radiogroup, ← → mueven la selección. */
export const FechaLiquidacion: FC<FechaLiquidacionProps> = ({ opciones, valor, onChange, visible = true, demoHover, demoFoco }) => {
  const ref = useRef<HTMLDivElement>(null);
  if (!visible) return null;
  const idx = Math.max(0, opciones.findIndex((o) => mismoDia(o.fecha, valor)));
  const mover = (delta: number) => {
    const j = (idx + delta + opciones.length) % opciones.length;
    onChange(opciones[j].fecha);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
  };
  return (
    <div data-component="FechaLiquidacion" className="flex flex-col gap-2">
      <span id="fecha-liquidacion-label" className="text-caption font-bold text-app-ink-label">¿Cuándo sale el dinero?</span>
      <div ref={ref} role="radiogroup" aria-labelledby="fecha-liquidacion-label" className="flex items-center gap-1 rounded-full bg-app-canvas p-1 shadow-mid">
        {opciones.map((o, i) => {
          const sel = i === idx;
          const hover = demoHover === i;
          const foco = demoFoco === i;
          return (
            <button
              key={o.etiqueta}
              type="button"
              role="radio"
              aria-checked={sel}
              tabIndex={sel ? 0 : -1}
              onClick={() => onChange(o.fecha)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
              }}
              className={[
                'inline-flex flex-auto cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-body transition-colors',
                sel ? 'border-app-primary bg-app-accent-bg font-semibold text-app-primary' : 'border-transparent bg-transparent font-normal text-app-ink-2 hover:bg-app-surface hover:text-app-ink',
                hover ? 'bg-app-surface text-app-ink' : '',
                foco ? 'focus-ring' : '',
              ].join(' ')}
            >
              {o.etiqueta}
              {o.vence ? <span className="font-normal">· vence</span> : null}
            </button>
          );
        })}
      </div>
      <span className="text-caption text-app-ink-2">El precio queda cerrado hoy, elijas el día que elijas.</span>
    </div>
  );
};
