import type { FC } from 'react';
import type { TdcMicro } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';
import { TendenciaDia } from './Graficas';

export interface TarjetaTipoDeCambioProps {
  par: string;
  compra: TdcMicro;
  venta: TdcMicro;
  tendencia: number[];
  hora: string;
  enVivo: boolean;
  /** Otros pares de tus posiciones, en una línea con sus dos lados. */
  otros?: { par: string; base: Divisa; compra: TdcMicro; venta: TdcMicro }[];
  tour?: string;
}

/** Borde 1 px #E2E4E9, sin sombra. USD/MXN arriba con la gráfica y EUR/MXN debajo. Seis decimales siempre. */
export const TarjetaTipoDeCambio: FC<TarjetaTipoDeCambioProps> = ({ par, compra, venta, tendencia, hora, enVivo, otros = [], tour }) => {
  const base = par.split('/')[0];
  return (
    <section data-component="TarjetaTipoDeCambio" data-tour={tour} aria-labelledby="tdc-titulo" className="flex flex-col gap-3 rounded-sm border border-app-divider bg-app-surface p-4">
      <div className="flex items-center justify-between">
        <h2 id="tdc-titulo" className="text-h3 font-semibold">Tipo de cambio</h2>
        {enVivo ? <Badge tono="success">En vivo</Badge> : <Badge tono="neutral">Congelado</Badge>}
      </div>
      <span className="text-body font-semibold">{par}</span>
      <dl className="flex flex-col gap-1.5 tabular-nums">
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para comprar {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(compra)}</dd></div>
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para vender {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(venta)}</dd></div>
      </dl>
      <TendenciaDia serie={tendencia} titulo={`Tendencia del día de ${par}`} />
      <div className="flex justify-between text-caption text-app-ink-2"><span>Tendencia del día</span><span>{hora}</span></div>
      {otros.map((o) => (
        <dl key={o.par} className="flex items-baseline justify-between gap-3 border-t border-app-divider pt-2.5 tabular-nums">
          <dt className="text-body font-semibold">{o.par}</dt>
          <dd className="text-caption text-app-ink-2"><span className="sr-only">Para </span>comprar {o.base} <span className="font-semibold text-app-ink">{fmt.tdc(o.compra)}</span> · vender {o.base} <span className="font-semibold text-app-ink">{fmt.tdc(o.venta)}</span></dd>
        </dl>
      ))}
      <span className="border-t border-app-divider pt-2.5 text-caption text-app-ink-2">Solo los pares de tus posiciones</span>
    </section>
  );
};
