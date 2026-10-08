import type { FC, ReactNode } from 'react';
import type { Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge, type TonoBadge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';

export interface FilaMovimientoProps {
  fecha: string;
  nombre: string;
  detalle?: string;
  monto: Centavos;
  divisa: Divisa;
  estado?: { texto: string; tono: TonoBadge };
  onPagar?: () => void;
  /** Clic o Enter sobre la fila: abre el detalle del movimiento en el panel lateral. */
  onAbrir?: () => void;
}

/** Grid 56 / 1fr / 160 / 120, min-height 44, hover #F6FBFF; "Pagar" es acción de fila (índigo, sin subrayado). `+` en verde, `−` en tinta (D-19). */
export const FilaMovimiento: FC<FilaMovimientoProps> = ({ fecha, nombre, detalle, monto, divisa, estado, onPagar, onAbrir }) => (
  <div
    data-component="FilaMovimiento"
    onClick={onAbrir}
    className={['-mx-2 grid min-h-(--app-row-h) grid-cols-[var(--app-col-fecha)_minmax(0,1fr)_var(--app-col-monto)_var(--app-col-accion)] items-center gap-4 rounded-xs border-b border-app-divider px-2 py-1', onAbrir ? 'cursor-pointer hover:bg-app-accent-bg has-[button:focus-visible]:bg-app-accent-bg' : ''].join(' ')}
  >
    <span className="text-caption font-medium text-app-ink-2">{fecha}</span>
    <div className="flex min-w-0 flex-col items-start">
      {onAbrir ? (
        // El nombre es el control accesible de la fila (la fila entera responde al clic; el teclado llega acá).
        <button type="button" onClick={(e) => { e.stopPropagation(); onAbrir(); }} aria-haspopup="dialog" aria-label={`Detalle de ${nombre}`} className="max-w-full cursor-pointer truncate rounded-xs bg-transparent text-left text-body font-medium outline-none">{nombre}</button>
      ) : (
        <span className="truncate text-body font-medium">{nombre}</span>
      )}
      {detalle ? <span className="text-caption text-app-ink-2 tabular-nums">{detalle}</span> : null}
    </div>
    <span className={['text-right text-body font-semibold tabular-nums', monto > 0 ? 'text-app-success' : 'text-app-ink'].join(' ')}>{fmt.montoSigno(monto, divisa)}</span>
    <div className="flex justify-end">
      {onPagar ? (
        <Boton variante="fila" onClick={(e) => { e.stopPropagation(); onPagar(); }} aria-label={`Pagar a ${nombre}`}>Pagar</Boton>
      ) : estado ? (
        <Badge tono={estado.tono}>{estado.texto}</Badge>
      ) : null}
    </div>
  </div>
);

export const RotuloLista: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <span className={['text-caption font-bold text-app-ink-2', className].filter(Boolean).join(' ')}>{children}</span>
);

export interface ListaMovimientosProps {
  proximos: FilaMovimientoProps[];
  realizados: FilaMovimientoProps[];
  /** "+" junto al título: carga un pago nuevo en Próximos. */
  onAgendar?: () => void;
  tour?: string;
  /** resumen: el bloque del inicio (la semana y "Ver todos los movimientos") · completa: la sección Movimientos con todos los pagos. */
  modo?: 'resumen' | 'completa';
  /** "Ver todos los movimientos" (Secondary), único control al pie del bloque: abre la lista completa, una vista de Inicio (C-52). */
  onVerTodos?: () => void;
  /** Línea bajo el encabezado en modo completa: cuántos pagos próximos y cuánto suman por divisa. */
  resumen?: string;
}

/** Próximos de la semana y Realizados, separados por "Hoy". Cada fila abre su detalle; "Ver todos los movimientos" abre la sección completa. */
export const ListaMovimientos: FC<ListaMovimientosProps> = ({ proximos, realizados, onVerTodos, onAgendar, tour, modo = 'resumen', resumen }) => {
  const completa = modo === 'completa';
  return (
    <section data-tour={tour} aria-labelledby={completa ? undefined : 'movimientos-titulo'} aria-label={completa ? 'Todos los movimientos' : undefined} className="flex flex-col">
      <div className="flex items-center justify-between border-b border-app-divider pb-2">
        {completa ? (
          <span className="text-body text-app-ink-2 tabular-nums">{resumen}</span>
        ) : (
          <div className="flex items-center gap-2">
            <h2 id="movimientos-titulo" className="text-h3 font-semibold">Movimientos</h2>
            {onAgendar ? (
              <button type="button" onClick={onAgendar} aria-label="Cargar un pago" title="Cargar un pago" aria-haspopup="dialog" className="flex size-(--app-close-btn) cursor-pointer items-center justify-center rounded-sm border border-app-primary bg-app-surface text-app-primary hover:bg-app-accent-bg">
                <Icono nombre="plus" tamano="sm" />
              </button>
            ) : null}
          </div>
        )}
      </div>
      <RotuloLista className="pb-0.5 pt-2.5">{completa ? `Próximos (${proximos.length})` : 'Próximos'}</RotuloLista>
      {proximos.length ? proximos.map((p, i) => <FilaMovimiento key={`${p.nombre}-${p.fecha}-${i}`} {...p} />) : <span className="py-3 text-body text-app-ink-2">{completa ? 'Sin pagos próximos.' : 'Sin pagos cargados esta semana.'}</span>}
      <div className="flex items-center gap-3 pb-0.5 pt-3.5">
        <span className="text-caption font-bold uppercase tracking-wide-caps text-app-ink-2">Hoy</span>
        <span className="h-px flex-1 bg-app-divider" />
      </div>
      <RotuloLista className="pb-0.5 pt-1">{completa ? `Realizados (${realizados.length})` : 'Realizados'}</RotuloLista>
      {realizados.map((r, i) => <FilaMovimiento key={`${r.nombre}-${i}`} {...r} />)}
      {!completa && onVerTodos ? <Boton variante="secondary" tamano="mid" className="mt-4 w-full" onClick={onVerTodos}>Ver todos los movimientos</Boton> : null}
    </section>
  );
};
