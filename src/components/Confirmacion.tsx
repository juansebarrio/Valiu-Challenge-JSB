import type { FC } from 'react';
import type { VistaConfirmacion } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { ListaDetalle } from './ui/ListaDetalle';

/** "Pago en proceso" + badge En proceso + detalle · pactada: "Pago pactado" + badge Pactada + texto del pacto + aviso de fondeo. */
export const Confirmacion: FC<{ vista: VistaConfirmacion }> = ({ vista: v }) => (
  <>
    <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-center">
      <Icono nombre={v.estado === 'pactada' ? 'calendar-alt' : 'check-circle'} tamano="hero" className="text-app-primary" />
      <h3 className="text-h2 font-semibold">{v.titulo}</h3>
      {v.estado === 'pactada' ? <Badge tono="pactada">Pactada</Badge> : <Badge tono="warning">En proceso</Badge>}
    </div>
    {v.texto ? <p className="text-pretty text-center text-body tabular-nums">{v.texto}</p> : null}
    <ListaDetalle filas={v.detalle} />
    {v.fondeo ? (
      <Alerta tono="info"><span className="text-pretty text-body text-app-ink tabular-nums">{v.fondeo}</span></Alerta>
    ) : (
      <span className="text-pretty text-center text-caption text-app-ink-2">Te avisamos cuando Banco BASE confirme el envío.</span>
    )}
  </>
);
