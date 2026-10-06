import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { oracion } from '@/lib/cotizacion';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';

export interface ConfirmacionProps {
  tipo: 'enviado' | 'pactado';
  fechaDia: string;
  tdc: number | null;
  pagas: number;
  pagasDivisa: Divisa;
  recibe: number;
  recibeDivisa: Divisa;
  destinatario: string;
  desde: string;
  detalle: { k: string; v: string }[];
  esCompra?: boolean;
}

/** Frame 06: "Pago enviado" + En proceso + detalle · 06B: "Pago pactado" + Pactada + aviso de fondeo. */
export const Confirmacion: FC<ConfirmacionProps> = ({ tipo, fechaDia, tdc, pagas, pagasDivisa, recibe, recibeDivisa, destinatario, desde, detalle, esCompra }) => {
  if (tipo === 'pactado') {
    const envio = esCompra ? `entran ${fmt.monto(recibe, recibeDivisa)} a tu ${destinatario}` : `se envían ${fmt.monto(recibe, recibeDivisa)} a ${destinatario}`;
    return (
      <>
        <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-center">
          <Icono nombre="calendar-alt" tamano="hero" className="text-app-primary" />
          <h3 className="text-h2 font-semibold">{esCompra ? 'Compra pactada' : 'Pago pactado'}</h3>
          <Badge tono="pactada">Pactada</Badge>
        </div>
        <p className="text-pretty text-center text-body tabular-nums">
          {oracion(`Cerraste el precio en ${tdc != null ? fmt.tdc(tdc) : '—'}. El ${fechaDia} salen ${fmt.monto(pagas, pagasDivisa)} de tu ${desde} y ${envio}`)}
        </p>
        <Alerta tono="info">
          <span className="text-pretty text-body text-app-ink tabular-nums">Ten {fmt.monto(pagas, pagasDivisa)} en tu {desde} el {fechaDia} para que el pago salga.</span>
        </Alerta>
      </>
    );
  }
  return (
    <>
      <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-center">
        <Icono nombre="check-circle" tamano="hero" className="text-app-primary" />
        <h3 className="text-h2 font-semibold">{esCompra ? 'Compra enviada' : 'Pago enviado'}</h3>
        <Badge tono="warning">En proceso</Badge>
      </div>
      <dl className="flex flex-col rounded-sm border border-app-divider px-4 py-1 tabular-nums">
        {detalle.map((d) => (
          <div key={d.k} className="flex justify-between gap-4 border-b border-app-divider py-2.5 last:border-b-0">
            <dt className="text-body text-app-ink-2">{d.k}</dt>
            <dd className="text-right text-body font-semibold">{d.v}</dd>
          </div>
        ))}
      </dl>
      <span className="text-pretty text-center text-caption text-app-ink-2">Te avisamos cuando Banco BASE confirme el envío.</span>
    </>
  );
};
