import type { FC } from 'react';
import * as fmt from '@/lib/format';
import { Badge } from './ui/Badge';
import { TendenciaDia } from './Graficas';

export interface TarjetaTipoDeCambioProps {
  par: string;
  compra: number;
  venta: number;
  tendencia: number[];
  hora: string;
  enVivo: boolean;
  tour?: string;
}

/** Borde 1 px #E2E4E9, sin sombra: no compite con la posición. Seis decimales siempre. */
export const TarjetaTipoDeCambio: FC<TarjetaTipoDeCambioProps> = ({ par, compra, venta, tendencia, hora, enVivo, tour }) => {
  const base = par.split('/')[0];
  return (
    <section data-component="TarjetaTipoDeCambio" data-tour={tour} aria-labelledby="tdc-titulo" className="flex flex-col gap-3 rounded-sm border border-app-divider bg-app-surface p-4">
      <div className="flex items-center justify-between">
        <h2 id="tdc-titulo" className="text-h3 font-semibold">Tipo de cambio</h2>
        {enVivo ? <Badge tono="success">En vivo</Badge> : <Badge tono="neutral">Último cierre</Badge>}
      </div>
      <span className="text-body font-semibold">{par}</span>
      <dl className="flex flex-col gap-1.5 tabular-nums">
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para comprar {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(compra)}</dd></div>
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para vender {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(venta)}</dd></div>
      </dl>
      <TendenciaDia serie={tendencia} titulo={`Tendencia del día de ${par}`} />
      <div className="flex justify-between text-caption text-app-ink-2"><span>Tendencia del día</span><span>{hora}</span></div>
      <span className="border-t border-app-divider pt-2.5 text-caption text-app-ink-2">Solo los pares de tus posiciones</span>
    </section>
  );
};
