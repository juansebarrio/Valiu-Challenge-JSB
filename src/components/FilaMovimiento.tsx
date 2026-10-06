import type { FC, ReactNode } from 'react';
import type { Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge, type TonoBadge } from './ui/Badge';
import { Boton } from './ui/Boton';

export interface FilaMovimientoProps {
  fecha: string;
  nombre: string;
  detalle?: string;
  monto: Centavos;
  divisa: Divisa;
  estado?: { texto: string; tono: TonoBadge };
  onPagar?: () => void;
}

/** Grid 56 / 1fr / 160 / 120, min-height 44, hover #F6FBFF; "Pagar" es acción de fila (índigo, sin subrayado). `+` en verde, `−` en tinta (D-19). */
export const FilaMovimiento: FC<FilaMovimientoProps> = ({ fecha, nombre, detalle, monto, divisa, estado, onPagar }) => (
  <div
    data-component="FilaMovimiento"
    onClick={onPagar}
    className={['-mx-2 grid min-h-(--app-row-h) grid-cols-[var(--app-col-fecha)_minmax(0,1fr)_var(--app-col-monto)_var(--app-col-accion)] items-center gap-4 rounded-xs border-b border-app-divider px-2 py-1', onPagar ? 'cursor-pointer hover:bg-app-accent-bg' : ''].join(' ')}
  >
    <span className="text-caption font-medium text-app-ink-2">{fecha}</span>
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-body font-medium">{nombre}</span>
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
  totalProximos: number;
  verTodos: boolean;
  onVerTodos?: (valor: boolean) => void;
  tour?: string;
}

/** Próximos de la semana (con "Ver los N pagos futuros") y Realizados, separados por "Hoy". */
export const ListaMovimientos: FC<ListaMovimientosProps> = ({ proximos, realizados, totalProximos, verTodos, onVerTodos, tour }) => (
  <section data-tour={tour} aria-labelledby="movimientos-titulo" className="flex flex-col">
    <div className="flex items-baseline justify-between border-b border-app-divider pb-2">
      <h2 id="movimientos-titulo" className="text-h3 font-semibold">Movimientos</h2>
    </div>
    <RotuloLista className="pb-0.5 pt-2.5">Próximos</RotuloLista>
    {proximos.length ? proximos.map((p, i) => <FilaMovimiento key={`${p.nombre}-${p.fecha}-${i}`} {...p} />) : <span className="py-3 text-body text-app-ink-2">Sin pagos cargados esta semana.</span>}
    {totalProximos > proximos.length || verTodos ? (
      <div className="pt-2">
        <Boton variante="link" aria-expanded={verTodos} onClick={() => onVerTodos?.(!verTodos)}>{verTodos ? 'Ver solo esta semana' : `Ver los ${totalProximos} pagos futuros`}</Boton>
      </div>
    ) : null}
    <div className="flex items-center gap-3 pb-0.5 pt-3.5">
      <span className="text-caption font-bold uppercase tracking-wide-caps text-app-ink-2">Hoy</span>
      <span className="h-px flex-1 bg-app-divider" />
    </div>
    <RotuloLista className="pb-0.5 pt-1">Realizados</RotuloLista>
    {realizados.map((r, i) => <FilaMovimiento key={`${r.nombre}-${i}`} {...r} />)}
  </section>
);
