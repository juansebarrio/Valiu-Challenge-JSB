import type { FC } from 'react';

export interface FilaDetalle { k: string; v: string }

/** Lista clave/valor en caja (radio 8, borde divisor): confirmación, detalle de movimiento y datos para depositar. */
export const ListaDetalle: FC<{ filas: FilaDetalle[]; className?: string }> = ({ filas, className }) => (
  <dl className={['flex flex-col rounded-sm border border-app-divider px-4 py-1 tabular-nums', className].filter(Boolean).join(' ')}>
    {filas.map((d) => (
      <div key={d.k} className="flex justify-between gap-4 border-b border-app-divider py-2.5 last:border-b-0">
        <dt className="shrink-0 text-body text-app-ink-2">{d.k}</dt>
        <dd className="text-right text-body font-semibold">{d.v}</dd>
      </div>
    ))}
  </dl>
);
