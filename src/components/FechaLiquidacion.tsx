'use client';
import { useRef, type FC } from 'react';

export interface OpcionFecha {
  fecha: Date;
  etiqueta: string;
  vence: boolean;
  deshabilitada?: boolean;
  motivo?: string;
}

export interface FechaLiquidacionProps {
  opciones: OpcionFecha[];
  valor: Date;
  onChange: (fecha: Date) => void;
  /** Texto bajo las opciones según lo elegido: el beneficio de elegir otro día (C-51, notaFechaLiquidacion en vistas.ts). */
  nota: string;
  /** false sin tipo de cambio (transferencias en la misma divisa). */
  visible?: boolean;
  /** Solo para la hoja de estados. */
  demoHover?: number;
  demoFoco?: number;
}

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Segmented del DS a todo el ancho; elegida con el color del Figma (D-28). role=radiogroup, ← → mueven la selección y saltan las deshabilitadas. */
export const FechaLiquidacion: FC<FechaLiquidacionProps> = ({ opciones, valor, onChange, nota, visible = true, demoHover, demoFoco }) => {
  const ref = useRef<HTMLDivElement>(null);
  if (!visible) return null;
  const idx = Math.max(0, opciones.findIndex((o) => mismoDia(o.fecha, valor)));
  const mover = (delta: number) => {
    let j = idx;
    for (let k = 0; k < opciones.length; k++) {
      j = (j + delta + opciones.length) % opciones.length;
      if (!opciones[j].deshabilitada) break;
    }
    onChange(opciones[j].fecha);
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[j]?.focus();
  };
  return (
    <div data-component="FechaLiquidacion" className="flex flex-col gap-2">
      <span id="fecha-liquidacion-label" className="text-caption font-bold text-app-ink-label">¿Cuándo sale el dinero?</span>
      <div ref={ref} role="radiogroup" aria-labelledby="fecha-liquidacion-label" className="flex flex-wrap items-center gap-1 rounded-full bg-app-canvas p-1 shadow-mid">
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
              aria-disabled={o.deshabilitada || undefined}
              title={o.deshabilitada ? o.motivo : undefined}
              tabIndex={sel ? 0 : -1}
              onClick={() => { if (!o.deshabilitada) onChange(o.fecha); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
              }}
              className={[
                'inline-flex flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-body transition-colors',
                o.deshabilitada ? 'cursor-not-allowed border-transparent bg-transparent text-app-ink-3 line-through decoration-app-ink-3' : 'cursor-pointer',
                sel ? 'border-app-primary bg-app-accent-bg font-semibold text-app-primary' : o.deshabilitada ? '' : 'border-transparent bg-transparent font-normal text-app-ink-2 hover:bg-app-surface hover:text-app-ink',
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
      <span className="text-pretty text-caption text-app-ink-2">{nota}</span>
    </div>
  );
};
