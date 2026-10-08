'use client';
import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Accion } from '@/state/estado';
import { fechaDeIso, type VistaAgenda } from '@/state/vistas';
import { ChipDivisa } from './ui/ChipDivisa';
import { Icono } from './ui/Icono';
import { CampoTexto } from './ui/Campo';

/** Paso de datos de "Cargar un pago": destinatario elegido, monto en su divisa, vencimiento, concepto y referencia (opcionales). */
export const AgendarPago: FC<{ vista: VistaAgenda; dispatch: (a: Accion) => void }> = ({ vista: v, dispatch }) => {
  return (
    <>
      <div className="flex items-center gap-2.5 rounded-sm border border-app-divider px-3 py-2.5">
        <ChipDivisa divisa={v.divisa} chico />
        <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body font-semibold">{v.destinatario}</span><span className="truncate text-caption text-app-ink-2 tabular-nums">{v.destinoSub}</span></span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto etiqueta="Monto" monto inputMode={fmt.decimales(v.divisa) === 0 ? 'numeric' : 'decimal'} placeholder={fmt.numero(0, v.divisa)} sufijo={v.divisa} valor={v.montoTexto} onCambiar={(t) => dispatch({ tipo: 'agendaMonto', texto: t })} error={v.montoError} autoFocus />
        <CampoTexto etiqueta="Vence el" type="date" min={v.fechaMin} max={v.fechaMax} valor={v.fecha} onCambiar={(t) => dispatch({ tipo: 'agendaFecha', fecha: fechaDeIso(t) })} error={v.fechaError} className="tabular-nums" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto etiqueta="Concepto" opcional valor={v.concepto} onCambiar={(t) => dispatch({ tipo: 'agendaMotivo', motivo: t })} placeholder="Ej. Pago a proveedores" />
        <CampoTexto etiqueta="Referencia" opcional valor={v.referencia} onCambiar={(t) => dispatch({ tipo: 'agendaReferencia', referencia: t })} placeholder="Ej. Factura 0457" />
      </div>
      {v.resumen ? (
        <span className="text-body text-app-ink-2 tabular-nums">{v.resumen}</span>
      ) : (
        <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" />El pago queda en Próximos como pendiente; lo pagas cuando quieras con el flujo de siempre.</span>
      )}
    </>
  );
};
