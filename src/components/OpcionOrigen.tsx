'use client';
import type { FC, KeyboardEvent, ReactNode } from 'react';
import { Badge, type TonoBadge } from './ui/Badge';

export interface OpcionRadioProps {
  /** Nombre del handoff para data-component (OpcionOrigen · OpcionPago). */
  componente: 'OpcionOrigen' | 'OpcionPago';
  nombre: string;
  /** Monto a la derecha del nombre (Pagas ≈ X · monto del pago). */
  derecha: string;
  /** Línea de 12 px: saldo de la cuenta · vencimiento, referencia y cuánto del cobro usa. */
  linea: string;
  consecuencia: { texto: string; tono: TonoBadge; ayuda?: string };
  seleccionada: boolean;
  /** No se puede elegir (p. ej. cuenta sin saldo en la divisa del pago, D-31): fuera del tab order, cursor not-allowed. */
  deshabilitada?: boolean;
  onElegir: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
}

/** Opción de radio del panel: radio de 20 px; seleccionada = borde indigo + bg #F0F1FD; la consecuencia siempre va en badge (D-20). */
export const OpcionRadio: FC<OpcionRadioProps> = ({ componente, nombre, derecha, linea, consecuencia, seleccionada, deshabilitada, onElegir, onKeyDown, tabIndex }) => (
  <div
    data-component={componente}
    role="radio"
    aria-checked={seleccionada}
    aria-disabled={deshabilitada || undefined}
    tabIndex={deshabilitada ? -1 : tabIndex ?? (seleccionada ? 0 : -1)}
    onClick={deshabilitada ? undefined : onElegir}
    onKeyDown={deshabilitada ? undefined : (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onElegir(); }
      onKeyDown?.(e);
    }}
    className={[
      'flex gap-3 rounded-sm border px-4 py-3',
      deshabilitada ? 'cursor-not-allowed border-app-divider bg-app-canvas text-app-ink-2' : seleccionada ? 'cursor-pointer border-app-primary bg-app-selected' : 'cursor-pointer border-app-divider bg-app-surface hover:bg-app-accent-bg',
    ].join(' ')}
  >
    <span aria-hidden className={['mt-px size-(--app-radio) shrink-0 rounded-full border-(length:--app-border-split)', deshabilitada ? 'border-app-ink-disabled bg-app-canvas' : seleccionada ? 'border-app-primary bg-app-primary shadow-[inset_0_0_0_4px_var(--app-surface)]' : 'border-app-ink-3 bg-app-surface'].join(' ')} />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 whitespace-nowrap text-body font-semibold">{nombre}</span>
        <span className="text-balance text-right text-body font-semibold tabular-nums">{derecha}</span>
      </div>
      <span className="text-caption text-app-ink-2 tabular-nums">{linea}</span>
      <Badge tono={consecuencia.tono} className="self-start">{consecuencia.texto}</Badge>
      {consecuencia.ayuda ? <span className="text-pretty text-caption text-app-ink-2">{consecuencia.ayuda}</span> : null}
    </div>
  </div>
);

export interface OpcionOrigenProps extends Omit<OpcionRadioProps, 'componente' | 'nombre' | 'derecha' | 'linea'> {
  cuenta: string;
  saldo: string;
  pagas: string;
}

/** Cuenta de origen: nombre, "Pagas ≈ X", saldo y consecuencia. */
export const OpcionOrigen: FC<OpcionOrigenProps> = ({ cuenta, saldo, pagas, ...rest }) => (
  <OpcionRadio componente="OpcionOrigen" nombre={cuenta} derecha={pagas} linea={saldo} {...rest} />
);

export interface OpcionPagoProps extends Omit<OpcionRadioProps, 'componente' | 'nombre' | 'derecha'> {
  destinatario: string;
  monto: string;
}

/** Pago pendiente que se cubre con el cobro de hoy (paso "¿Qué pagas con este cobro?", D-30): misma anatomía que OpcionOrigen. */
export const OpcionPago: FC<OpcionPagoProps> = ({ destinatario, monto, ...rest }) => (
  <OpcionRadio componente="OpcionPago" nombre={destinatario} derecha={monto} {...rest} />
);

type ItemRadio = { id: string; deshabilitada?: boolean };

/** Radiogroup: ↑ ↓ mueven la selección saltando las deshabilitadas; Tab entra una sola vez (a la seleccionada o a la primera elegible). */
export function GrupoRadio<T extends ItemRadio>({ etiqueta, opciones, valor, onCambiar, render }: {
  etiqueta: string;
  opciones: T[];
  valor: string | null;
  onCambiar: (id: string) => void;
  render: (o: T, props: Pick<OpcionRadioProps, 'seleccionada' | 'tabIndex' | 'onElegir' | 'onKeyDown'>) => ReactNode;
}) {
  const elegibles = opciones.filter((o) => !o.deshabilitada);
  // Mueve la selección entre las elegibles y lleva el foco al radio correspondiente (hermanos dentro del radiogroup).
  const mover = (e: KeyboardEvent<HTMLDivElement>, delta: number) => {
    if (!elegibles.length) return;
    const i = elegibles.findIndex((o) => o.id === valor);
    const j = (i + delta + elegibles.length) % elegibles.length;
    onCambiar(elegibles[j].id);
    const nodos = e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])');
    nodos?.[j]?.focus();
  };
  const primeraElegible = elegibles[0]?.id ?? null;
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex flex-col gap-2.5">
      {opciones.map((o) =>
        render(o, {
          seleccionada: o.id === valor,
          tabIndex: valor ? (o.id === valor ? 0 : -1) : o.id === primeraElegible ? 0 : -1,
          onElegir: () => onCambiar(o.id),
          onKeyDown: (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); mover(e, 1); }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); mover(e, -1); }
          },
        }),
      )}
    </div>
  );
}

export const GrupoOrigen: FC<{ opciones: (Omit<OpcionOrigenProps, 'onElegir' | 'onKeyDown' | 'tabIndex' | 'seleccionada'> & { id: string })[]; valor: string | null; onCambiar: (id: string) => void }> = ({ opciones, valor, onCambiar }) => (
  <GrupoRadio etiqueta="¿Desde qué cuenta pagas?" opciones={opciones} valor={valor} onCambiar={onCambiar} render={(o, p) => <OpcionOrigen key={o.id} {...o} {...p} />} />
);

export const GrupoPago: FC<{ opciones: (Omit<OpcionPagoProps, 'onElegir' | 'onKeyDown' | 'tabIndex' | 'seleccionada'> & { id: string })[]; valor: string | null; onCambiar: (id: string) => void }> = ({ opciones, valor, onCambiar }) => (
  <GrupoRadio etiqueta="¿Qué pagas con este cobro?" opciones={opciones} valor={valor} onCambiar={onCambiar} render={(o, p) => <OpcionPago key={o.id} {...o} {...p} />} />
);
