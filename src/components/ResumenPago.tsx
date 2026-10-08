import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { VistaResumen } from '@/state/vistas';
import { Badge } from './ui/Badge';

/** Anuncios de la cuenta regresiva (aria-live polite): el texto cambia solo en 1:00, 0:30, 0:10 y al vencer, no cada segundo. */
function anuncioDe(tdc: VistaResumen['tdc']): string {
  if (!tdc) return '';
  if (tdc.estado === 'vencido') return 'Se acabó el tiempo para confirmar.';
  if (tdc.estado !== 'ejecutable' || tdc.segundos > 60) return '';
  if (tdc.segundos > 30) return 'Queda 1:00 para confirmar.';
  if (tdc.segundos > 10) return 'Quedan 0:30 para confirmar.';
  return 'Quedan 0:10 para confirmar.';
}

/** Filas clave/valor de la columna derecha: la clave puede ocupar dos líneas; el valor, nunca. */
export const FilasResumen: FC<{ filas: VistaResumen['filas'] }> = ({ filas }) => (
  <dl className="flex flex-col gap-3 tabular-nums">
    {filas.map((f) => (
      <div key={f.k} className="flex items-baseline justify-between gap-3">
        <dt className="min-w-0 text-pretty text-body text-app-ink-2">{f.k}</dt>
        <dd className="shrink-0 whitespace-nowrap text-right text-body font-semibold">{f.v}</dd>
      </div>
    ))}
  </dl>
);

/**
 * Columna derecha de la ventana de pago en Origen, Revisión y Precio (C-47): lo que significa lo que se decide a la izquierda.
 * El tipo de cambio va siempre arriba y en el mismo lugar: "Precio indicativo" en Origen y Revisión; en Precio, el ejecutable en vivo
 * con "Confirma en m:ss" (Warning en los últimos 30 s) y "Se mueve con el mercado hasta que confirmas." (C-48), o "Vencido" sobre el
 * precio que se mostraba al acabarse el tiempo. Sin tipo de cambio (misma divisa), "Sin tipo de cambio" en su lugar.
 * Debajo, la comisión y las filas (de dónde y cuándo sale el dinero, cómo queda la cuenta) y, al pie, la nota del token.
 * Sin precio ni "Sin tipo de cambio" (confirmación) solo lleva las filas.
 */
export const ResumenPago: FC<{ vista: VistaResumen }> = ({ vista: v }) => {
  const t = v.tdc;
  const anuncio = anuncioDe(t);
  const conEncabezado = !!t || !!v.sinPrecio;
  return (
    <div data-component="ResumenPago" className="flex min-w-0 flex-col gap-4 rounded-sm bg-app-canvas p-4">
      {conEncabezado ? (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption font-bold text-app-ink-label">Tipo de cambio</span>
              {t?.estado === 'indicativo' ? <Badge tono="info">Precio indicativo</Badge> : null}
              {t?.estado === 'ejecutable' ? <Badge tono={t.porVencer ? 'warning' : 'success'}>Confirma en {fmt.cuentaRegresiva(t.segundos)}{t.pausado ? ' · pausa' : ''}</Badge> : null}
              {t?.estado === 'vencido' ? <Badge tono="neutral">Vencido</Badge> : null}
            </div>
            {t ? (
              <div className={['flex items-baseline gap-1.5 tabular-nums', t.estado === 'vencido' ? 'text-app-ink-2 line-through decoration-app-ink-3' : 'text-app-ink'].join(' ')}>
                <span className="text-amount font-semibold">{fmt.tdc(t.valor)}</span>
                <span className="text-caption font-semibold text-app-ink-2">{t.unidad}</span>
              </div>
            ) : (
              <span className="text-body-lg font-semibold text-app-ink-2">{v.sinPrecio}</span>
            )}
            {v.linea ? <span className="text-pretty text-caption text-app-ink-2">{v.linea}</span> : null}
            <span className="sr-only" aria-live="polite">{anuncio}</span>
          </div>
          <div className="h-px bg-app-divider" />
        </>
      ) : null}
      <FilasResumen filas={v.filas} />
      {v.aviso ? <span className="text-pretty text-caption text-app-ink-2">{v.aviso}</span> : null}
      {v.nota ? <span className="mt-auto text-pretty text-caption text-app-ink-2">{v.nota}</span> : null}
    </div>
  );
};
