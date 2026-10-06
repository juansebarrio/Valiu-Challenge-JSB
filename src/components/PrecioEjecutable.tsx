import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';
import { Icono } from './ui/Icono';

export interface PrecioEjecutableProps {
  estado: 'fijo' | 'vencido' | 'sinTdc';
  tdc: number | null;
  segundos: number;
  porVencer?: boolean;
  pausado?: boolean;
  pagas: number;
  pagasAprox?: boolean;
  pagasDivisa: Divisa;
  recibe: number;
  recibeDivisa: Divisa;
  destinatario: string;
  desde: string;
  sale?: string | null;
}

/** Badge Success "Precio fijo por m:ss" (Warning en los últimos 30 s), Error "Vencido"; al vencer el precio se pinta en Grey1. */
export const PrecioEjecutable: FC<PrecioEjecutableProps> = ({ estado, tdc, segundos, porVencer, pausado, pagas, pagasAprox, pagasDivisa, recibe, recibeDivisa, destinatario, desde, sale }) => (
  <div data-component="PrecioEjecutable" className="flex flex-col gap-3 rounded-sm border border-app-divider p-4">
    {estado !== 'sinTdc' ? (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption font-bold text-app-ink-label">{estado === 'fijo' ? 'Precio ejecutable' : 'Precio indicativo'}</span>
          {estado === 'fijo' ? (
            <Badge tono={porVencer ? 'warning' : 'success'} aria-live="polite">Precio fijo por {fmt.cuentaRegresiva(segundos)}{pausado ? ' · pausa' : ''}</Badge>
          ) : (
            <Badge tono="error">Vencido</Badge>
          )}
        </div>
        <div className={['flex items-baseline gap-1.5 tabular-nums', estado === 'vencido' ? 'text-app-ink-2' : 'text-app-ink'].join(' ')}>
          <span className="text-amount font-semibold">{tdc != null ? fmt.tdc(tdc) : '—'}</span>
          <span className="text-caption font-semibold text-app-ink-2">MXN</span>
        </div>
        <div className="h-px bg-app-divider" />
      </>
    ) : (
      <span className="text-caption font-bold text-app-ink-label">Resumen</span>
    )}
    <dl className="flex flex-col gap-1.5 tabular-nums">
      <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">Pagas</dt><dd className="text-body font-semibold">{pagasAprox ? '≈ ' : ''}{fmt.monto(pagas, pagasDivisa)}</dd></div>
      <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">{destinatario}</dt><dd className="text-body font-semibold">{fmt.monto(recibe, recibeDivisa)}</dd></div>
      <div className="flex justify-between gap-3"><dt className="text-body text-app-ink-2">Desde</dt><dd className="text-body font-semibold">{desde}</dd></div>
      {sale ? (
        <div className="flex items-center gap-2 pt-0.5 text-body font-semibold"><Icono nombre="calendar-alt" tamano="sm" className="text-app-ink-2" /><span>{sale}</span></div>
      ) : null}
    </dl>
  </div>
);
