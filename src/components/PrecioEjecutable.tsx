import type { FC } from 'react';
import type { Centavos, TdcMicro } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';
import { Icono } from './ui/Icono';

export interface PrecioEjecutableProps {
  estado: 'fijo' | 'vencido' | 'sinTdc';
  tdc: TdcMicro | null;
  segundos: number;
  porVencer?: boolean;
  pagas: Centavos;
  pagasAprox?: boolean;
  pagasDivisa: Divisa;
  recibe: Centavos;
  recibeDivisa: Divisa;
  destinatario: string;
  desde: string;
  sale?: string | null;
}

/** Anuncios de la cuenta regresiva (aria-live polite): el texto cambia solo en 1:00, 0:30, 0:10 y al vencer, no cada segundo. */
function anuncioDe(estado: PrecioEjecutableProps['estado'], segundos: number): string {
  if (estado === 'vencido') return 'El precio venció. Pide uno nuevo.';
  if (estado !== 'fijo' || segundos > 60) return '';
  if (segundos > 30) return 'Queda 1:00 de precio fijo.';
  if (segundos > 10) return 'Quedan 0:30 de precio fijo.';
  return 'Quedan 0:10 de precio fijo.';
}

/** Badge Success "Precio fijo por m:ss" (Warning en los últimos 30 s). Al vencer, "Vencido" va sobre el precio que venció y los montos vuelven al indicativo. */
export const PrecioEjecutable: FC<PrecioEjecutableProps> = ({ estado, tdc, segundos, porVencer, pagas, pagasAprox, pagasDivisa, recibe, recibeDivisa, destinatario, desde, sale }) => {
  const anuncio = anuncioDe(estado, segundos);
  return (
    <div data-component="PrecioEjecutable" className="flex flex-col gap-3 rounded-sm border border-app-divider p-4">
      {estado !== 'sinTdc' ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-caption font-bold text-app-ink-label">Precio ejecutable</span>
            {estado === 'fijo' ? (
              <Badge tono={porVencer ? 'warning' : 'success'}>Precio fijo por {fmt.cuentaRegresiva(segundos)}</Badge>
            ) : (
              <Badge tono="neutral">Vencido</Badge>
            )}
          </div>
          <div className={['flex items-baseline gap-1.5 tabular-nums', estado === 'vencido' ? 'text-app-ink-2 line-through decoration-app-ink-3' : 'text-app-ink'].join(' ')}>
            <span className="text-amount font-semibold">{tdc != null ? fmt.tdc(tdc) : '—'}</span>
            <span className="text-caption font-semibold text-app-ink-2">MXN</span>
          </div>
          <span className="sr-only" aria-live="polite">{anuncio}</span>
          <div className="h-px bg-app-divider" />
        </>
      ) : (
        <span className="text-caption font-bold text-app-ink-label">Resumen</span>
      )}
      <dl className="flex flex-col gap-1.5 tabular-nums">
        <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">Pagas{pagasAprox ? ' (indicativo)' : ''}</dt><dd className="text-body font-semibold">{pagasAprox ? '≈ ' : ''}{fmt.monto(pagas, pagasDivisa)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">{destinatario}</dt><dd className="text-body font-semibold">{fmt.monto(recibe, recibeDivisa)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">Desde</dt><dd className="text-body font-semibold">{desde}</dd></div>
        {sale ? (
          <div className="flex items-center gap-2 pt-0.5 text-body font-semibold"><Icono nombre="calendar-alt" tamano="sm" className="text-app-ink-2" /><span>{sale}</span></div>
        ) : null}
      </dl>
    </div>
  );
};
