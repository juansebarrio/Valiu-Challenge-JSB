'use client';
import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Accion } from '@/state/estado';
import type { VistaControl, VistaDestinatario, VistaFila, VistaParMonitoreo } from '@/state/vistas';
import { FilaMovimiento, RotuloLista } from './FilaMovimiento';
import { TendenciaDia } from './Graficas';
import { Badge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { ChipDivisa } from './ui/ChipDivisa';

/** Control de operaciones: lo operado en la sesión por estado (pactadas, en proceso) y lo realizado antes; cada fila abre su detalle. */
export const SeccionControl: FC<{ vista: VistaControl; dispatch: (a: Accion) => void }> = ({ vista, dispatch }) => {
  const fila = (f: VistaFila) => ({ fecha: f.fecha, nombre: f.nombre, detalle: f.detalle, monto: f.monto, divisa: f.divisa, estado: f.badge, onAbrir: () => dispatch({ tipo: 'abrirDetalle', id: f.id }) });
  return (
    <section data-component="ControlOperaciones" aria-label="Control de operaciones" className="flex flex-col">
      <div className="border-b border-app-divider pb-2"><span className="text-body text-app-ink-2 tabular-nums">{vista.resumen}</span></div>
      {vista.grupos.map((g) => (
        <div key={g.titulo} className="flex flex-col">
          <RotuloLista className="pb-0.5 pt-3.5">{g.titulo}</RotuloLista>
          {g.filas.length ? g.filas.map((f, i) => <FilaMovimiento key={`${f.id}-${i}`} {...fila(f)} />) : <span className="py-2 text-body text-app-ink-2">{g.vacio}</span>}
        </div>
      ))}
    </section>
  );
};

/** Destinatarios: cuenta, divisa y pendientes; "Pagar" abre la ventana de pago sin monto (se escribe en la revisión). */
export const SeccionDestinatarios: FC<{ items: VistaDestinatario[]; dispatch: (a: Accion) => void }> = ({ items, dispatch }) => (
  <section data-component="Destinatarios" aria-label="Destinatarios" className="flex flex-col">
    {items.map((d) => (
      <div key={d.id} className="-mx-2 grid min-h-(--app-row-h) grid-cols-[minmax(0,1fr)_var(--app-col-monto)_var(--app-col-accion)] items-center gap-4 border-b border-app-divider px-2 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChipDivisa divisa={d.divisa} chico />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body font-medium">{d.nombre}</span>
            <span className="truncate text-caption text-app-ink-2 tabular-nums">{d.cuenta}</span>
          </div>
        </div>
        <span className="text-right text-caption text-app-ink-2 tabular-nums">{d.pendientes ?? 'Sin pagos pendientes'}</span>
        <div className="flex justify-end"><Boton variante="fila" onClick={() => dispatch({ tipo: 'pagarA', destinatarioId: d.id })} aria-label={`Pagar a ${d.nombre}`}>Pagar</Boton></div>
      </div>
    ))}
  </section>
);

const ESTADO_TDC = { vivo: { texto: 'En vivo', tono: 'success' as const }, congelado: { texto: 'Congelado', tono: 'neutral' as const }, pausa: { texto: 'En pausa', tono: 'neutral' as const } };

/** Monitoreo de divisas: cada par operable con sus dos lados indicativos, el ejecutable que saldría ahora y la tendencia del par de la decisión. */
export const SeccionMonitoreo: FC<{ estado: 'vivo' | 'congelado' | 'pausa'; hora: string; pares: VistaParMonitoreo[] }> = ({ estado, hora, pares }) => (
  <section data-component="MonitoreoDivisas" aria-label="Monitoreo de divisas" className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-body text-app-ink-2">Precio indicativo de cada par; el ejecutable aplica el spread al pedir precio y se mueve con el mercado hasta que confirmas.</span>
      <Badge tono={ESTADO_TDC[estado].tono}>{ESTADO_TDC[estado].texto}</Badge>
    </div>
    <div className="grid grid-cols-3 gap-6">
      {pares.map((p) => (
        <article key={p.par} aria-label={`Par ${p.par}`} className="flex min-w-0 flex-col gap-3 rounded-sm border border-app-divider bg-app-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold">{p.par}</span>
            {p.enPosiciones ? <Badge tono="info">Tus posiciones</Badge> : <Badge tono="neutral">Otro par</Badge>}
          </div>
          <dl className="flex flex-col gap-1.5 tabular-nums">
            <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para comprar {p.base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(p.compra)}</dd></div>
            <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para vender {p.base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(p.venta)}</dd></div>
            <div className="flex items-baseline justify-between gap-2 border-t border-app-divider pt-1.5"><dt className="text-caption text-app-ink-2">Ejecutable compra · venta</dt><dd className="text-caption font-semibold">{fmt.tdc(p.ejecutableCompra)} · {fmt.tdc(p.ejecutableVenta)}</dd></div>
          </dl>
          {p.tendencia ? (
            <>
              <TendenciaDia serie={p.tendencia} titulo={`Tendencia del día de ${p.par}`} />
              <div className="flex justify-between text-caption text-app-ink-2"><span>Tendencia del día</span><span>{hora}</span></div>
            </>
          ) : (
            <span className="text-caption text-app-ink-2">Sin tendencia intradía para este par.</span>
          )}
        </article>
      ))}
    </div>
  </section>
);
