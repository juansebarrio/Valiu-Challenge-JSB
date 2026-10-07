import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { VistaDetalle } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { ListaDetalle } from './ui/ListaDetalle';
import { MontosFinales } from './Confirmacion';

/**
 * Detalle de una fila de Movimientos dentro del panel lateral: ícono + estado + monto, texto, filas y, si aplica, aviso de fondeo y la nota de la pactada.
 * Una operación hecha (en proceso o pactada) lleva, como la confirmación, los montos finales en el BloqueMonto y las mismas filas (C-50).
 * compacta (confirmación de "Cargar un pago" en la ventana de pago): el ícono al lado del título y del badge, como en Confirmacion.
 */
export const DetalleMovimiento: FC<{ vista: VistaDetalle; compacta?: boolean }> = ({ vista: v, compacta }) => (
  <>
    <div className={compacta ? 'flex flex-col items-center gap-2' : 'flex flex-col items-center gap-2 pb-2 pt-4 text-center'}>
      <div className={compacta ? 'flex items-center justify-center gap-3' : 'contents'}>
        <Icono nombre={v.icono} tamano="hero" className="shrink-0 text-app-primary" />
        <div className={compacta ? 'flex flex-col items-start gap-1' : 'contents'}>
          <h3 className="text-h2 font-semibold">{v.titulo}</h3>
          <Badge tono={v.badge.tono}>{v.badge.texto}</Badge>
        </div>
      </div>
      {v.montos ? null : <span className={['text-amount font-semibold tabular-nums', v.monto > 0 ? 'text-app-success' : 'text-app-ink'].join(' ')}>{fmt.montoSigno(v.monto, v.divisa)}</span>}
    </div>
    {v.montos ? <MontosFinales montos={v.montos} /> : null}
    {v.texto ? <p className="text-pretty text-center text-body tabular-nums">{v.texto}</p> : null}
    <ListaDetalle filas={v.filas} />
    {v.fondeo ? <Alerta tono="info"><span className="text-pretty text-body text-app-ink tabular-nums">{v.fondeo}</span></Alerta> : null}
    {v.nota ? <p data-component="NotaPactada" className="text-pretty text-caption text-app-ink-2">{v.nota}</p> : null}
  </>
);
