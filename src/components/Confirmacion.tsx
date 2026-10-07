import type { FC } from 'react';
import type { VistaConfirmacion, VistaMontos } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { BloqueMonto } from './BloqueMonto';

/** Ícono, título y badge: el ícono a la izquierda del título y del badge (ventana de pago, C-47). */
export const EncabezadoConfirmacion: FC<{ vista: Pick<VistaConfirmacion, 'estado' | 'titulo'> }> = ({ vista: v }) => (
  <div className="flex items-center gap-3">
    <Icono nombre={v.estado === 'pactada' ? 'calendar-alt' : 'check-circle'} tamano="hero" className="shrink-0 text-app-primary" />
    <div className="flex flex-col items-start gap-1">
      <h3 className="text-h2 font-semibold">{v.titulo}</h3>
      {v.estado === 'pactada' ? <Badge tono="pactada">Pactada</Badge> : <Badge tono="warning">En proceso</Badge>}
    </div>
  </div>
);

/** Los montos finales en el mismo BloqueMonto de los pasos anteriores, de solo lectura y sin marcas (C-50). */
export const MontosFinales: FC<{ montos: VistaMontos }> = ({ montos: m }) => (
  <BloqueMonto pagas={m.pagas} recibe={m.recibe} ladoFijo="recibe" conTdc={false} exacto unico={m.unico} marcas={false} />
);

/** Pactada: aviso de fondeo (C-51) · en proceso: cuándo avisamos. */
export const AvisoConfirmacion: FC<{ vista: Pick<VistaConfirmacion, 'fondeo'> }> = ({ vista: v }) =>
  v.fondeo ? (
    <Alerta tono="info"><span className="text-pretty text-body text-app-ink tabular-nums">{v.fondeo}</span></Alerta>
  ) : (
    <span className="text-pretty text-caption text-app-ink-2">Te avisamos cuando Banco BASE confirme el envío.</span>
  );
