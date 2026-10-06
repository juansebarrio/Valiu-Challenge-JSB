import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Boton } from './ui/Boton';

export interface FranjaNuevoProps {
  monto: number;
  divisa: Divisa;
  origen: string;
  meta: string;
  onComprobante?: () => void;
  onUsar?: () => void;
}

/** Fondo #F6FBFF, borde #DCDCDE, radio 8. "Usar para pagar" es Secondary Mid. */
export const FranjaNuevo: FC<FranjaNuevoProps> = ({ monto, divisa, origen, meta, onComprobante, onUsar }) => (
  <div data-component="FranjaNuevo" className="flex items-center gap-4 rounded-sm border border-app-ink-disabled bg-app-accent-bg px-4 py-3">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-body">
        <span className="font-semibold text-app-success tabular-nums">{fmt.montoSigno(monto, divisa)}</span> de {origen}
      </span>
      <span className="text-caption text-app-ink-2">{meta}</span>
    </div>
    <Boton variante="link-caption" onClick={onComprobante}>Comprobante</Boton>
    <Boton variante="secondary" tamano="mid" onClick={onUsar} disabled={!onUsar}>Usar para pagar</Boton>
  </div>
);
