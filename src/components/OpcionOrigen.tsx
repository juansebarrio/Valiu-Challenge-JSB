'use client';
import { useRef, type FC, type KeyboardEvent } from 'react';
import { Badge, type TonoBadge } from './ui/Badge';

export interface OpcionOrigenProps {
  cuenta: string;
  saldo: string;
  pagas: string;
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string };
  seleccionada: boolean;
  onElegir: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
}

/** Radio de 20 px; seleccionada = borde indigo + bg #F0F1FD. La consecuencia siempre va en badge (D-20). */
export const OpcionOrigen: FC<OpcionOrigenProps> = ({ cuenta, saldo, pagas, consecuencia, seleccionada, onElegir, onKeyDown, tabIndex }) => (
  <div
    data-component="OpcionOrigen"
    role="radio"
    aria-checked={seleccionada}
    tabIndex={tabIndex ?? (seleccionada ? 0 : -1)}
    onClick={onElegir}
    onKeyDown={(e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onElegir(); }
      onKeyDown?.(e);
    }}
    className={['flex cursor-pointer gap-3 rounded-sm border px-4 py-3', seleccionada ? 'border-app-primary bg-app-selected' : 'border-app-divider bg-app-surface hover:bg-app-accent-bg'].join(' ')}
  >
    <span aria-hidden className={['mt-px size-(--app-radio) shrink-0 rounded-full border-(length:--app-border-split)', seleccionada ? 'border-app-primary bg-app-primary shadow-[inset_0_0_0_4px_var(--app-surface)]' : 'border-app-ink-3 bg-app-surface'].join(' ')} />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 whitespace-nowrap text-body font-semibold">{cuenta}</span>
        <span className="text-balance text-right text-body font-semibold tabular-nums">{pagas}</span>
      </div>
      <span className="text-caption text-app-ink-2 tabular-nums">{saldo}</span>
      <Badge tono={consecuencia.tono} className="self-start">{consecuencia.texto}</Badge>
      {consecuencia.ayuda ? <span className="text-pretty text-caption text-app-ink-2">{consecuencia.ayuda}</span> : null}
    </div>
  </div>
);

/** Radiogroup: ↑ ↓ mueven la selección; Tab entra una sola vez. */
export const GrupoOrigen: FC<{ opciones: (Omit<OpcionOrigenProps, 'onElegir' | 'onKeyDown' | 'tabIndex'> & { id: string })[]; valor: string | null; onCambiar: (id: string) => void }> = ({ opciones, valor, onCambiar }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (delta: number) => {
    const i = opciones.findIndex((o) => o.id === valor);
    const j = (i + delta + opciones.length) % opciones.length;
    onCambiar(opciones[j].id);
    const nodos = ref.current?.querySelectorAll<HTMLElement>('[role="radio"]');
    nodos?.[j]?.focus();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label="¿Desde qué cuenta pagas?" className="flex flex-col gap-2.5">
      {opciones.map((o, i) => (
        <OpcionOrigen
          key={o.id}
          {...o}
          seleccionada={o.id === valor}
          tabIndex={valor ? (o.id === valor ? 0 : -1) : i === 0 ? 0 : -1}
          onElegir={() => onCambiar(o.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
          }}
        />
      ))}
    </div>
  );
};
