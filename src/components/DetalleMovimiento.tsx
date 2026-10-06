import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { VistaDetalle } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { ListaDetalle } from './ui/ListaDetalle';

/** Detalle de una fila de Movimientos dentro del panel: ícono + estado + monto, texto, filas y, si aplica, aviso de fondeo y la nota de la pactada. */
export const DetalleMovimiento: FC<{ vista: VistaDetalle }> = ({ vista: v }) => (
  <>
    <div className="flex flex-col items-center gap-2 pb-2 pt-4 text-center">
      <Icono nombre={v.icono} tamano="hero" className="text-app-primary" />
      <h3 className="text-h2 font-semibold">{v.titulo}</h3>
      <Badge tono={v.badge.tono}>{v.badge.texto}</Badge>
      <span className={['text-amount font-semibold tabular-nums', v.monto > 0 ? 'text-app-success' : 'text-app-ink'].join(' ')}>{fmt.montoSigno(v.monto, v.divisa)}</span>
    </div>
    {v.texto ? <p className="text-pretty text-center text-body tabular-nums">{v.texto}</p> : null}
    <ListaDetalle filas={v.filas} />
    {v.fondeo ? <Alerta tono="info"><span className="text-pretty text-body text-app-ink tabular-nums">{v.fondeo}</span></Alerta> : null}
    {v.nota ? <p data-component="NotaPactada" className="text-pretty text-caption text-app-ink-2">{v.nota}</p> : null}
  </>
);
