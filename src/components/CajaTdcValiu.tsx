import type { FC } from 'react';
import * as fmt from '@/lib/format';

export interface CajaTdcValiuProps {
  tdc: number;
  divisa?: string;
  /** "Indicativo" · "Ejecutable" · "Último cierre" · "Precio indicativo". */
  tipo: string;
  /** Vencido: borde Grey3 y valor en Grey1. */
  apagada?: boolean;
  /** Pegada a la barra de cotización (radio 0 8 8 0) o suelta (radio 8). */
  pegada?: boolean;
  className?: string;
}

/** Borde 2 px #0086FF; "TDC Valiu" 10/700 y valor 18/700. */
export const CajaTdcValiu: FC<CajaTdcValiuProps> = ({ tdc, divisa = 'MXN', tipo, apagada, pegada, className }) => (
  <div data-component="CajaTdcValiu" className={['flex min-w-(--app-tdc-box-w) flex-col justify-center gap-0.75 border-2 bg-app-surface px-4 py-2.5', pegada ? 'rounded-r-sm' : 'rounded-sm', apagada ? 'border-app-ink-disabled' : 'border-app-accent', className].filter(Boolean).join(' ')}>
    <div className="flex justify-between gap-3">
      <span className="text-micro font-bold">TDC Valiu</span>
      <span className="text-micro text-app-ink-2">{tipo}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={['text-tdc font-bold tabular-nums', apagada ? 'text-app-ink-2' : 'text-app-ink'].join(' ')}>{fmt.tdc(tdc)}</span>
      <span className="text-tiny text-app-ink-2">{divisa}</span>
    </div>
  </div>
);
