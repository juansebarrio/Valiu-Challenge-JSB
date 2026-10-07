import type { FC } from 'react';
import type { VistaItemDesglose } from '@/state/vistas';
import { Boton } from './ui/Boton';

/**
 * Desglose de una fila de TarjetaPosicion (C-55), en la ventana de pago: lo que la compone, por fecha. Día, destinatario y referencia a la
 * izquierda; el monto a la derecha y, debajo, el equivalente o el precio cerrado. Un pago pendiente lleva "Pagar"; las pactadas, ninguna acción.
 */
export const DesglosePosicion: FC<{ items: VistaItemDesglose[]; onPagar: (pagoId: string) => void }> = ({ items, onPagar }) => (
  <ul data-component="DesglosePosicion" className="flex flex-col">
    {items.map((it) => (
      <li key={it.id} className="grid min-h-(--app-row-h) grid-cols-[var(--app-col-fecha)_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-app-divider py-2 last:border-b-0">
        <span className="text-caption font-medium text-app-ink-2">{it.dia}</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body font-medium">{it.nombre}</span>
          {it.referencia ? <span className="truncate text-caption text-app-ink-2">{it.referencia}</span> : null}
        </span>
        <span className="flex flex-col items-end tabular-nums">
          <span className="whitespace-nowrap text-body font-semibold">{it.monto}</span>
          {it.linea ? <span className="whitespace-nowrap text-caption text-app-ink-2">{it.linea}</span> : null}
        </span>
        {it.pagoId ? <Boton variante="fila" onClick={() => onPagar(it.pagoId!)} aria-label={`Pagar a ${it.nombre}`}>Pagar</Boton> : <span />}
      </li>
    ))}
  </ul>
);
