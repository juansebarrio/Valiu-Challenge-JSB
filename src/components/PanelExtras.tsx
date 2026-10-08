'use client';
import { useEffect, useRef, useState, type FC } from 'react';
import type { Divisa } from '@/lib/fx';
import type { Accion } from '@/state/estado';
import type { VistaPanel } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { ChipDivisa } from './ui/ChipDivisa';
import { Icono } from './ui/Icono';
import { CampoSelector, CampoTexto, OpcionLista } from './ui/Campo';

/** Campana: avisos derivados del estado; cada uno abre el movimiento relacionado. */
export const ListaNotificaciones: FC<{ items: NonNullable<VistaPanel['notificaciones']>; dispatch: (a: Accion) => void }> = ({ items, dispatch }) => (
  <ul data-component="Notificaciones" className="flex flex-col gap-2.5">
    {items.length ? items.map((n) => (
      <li key={n.id}>
        <button
          type="button"
          onClick={n.movimientoId ? () => dispatch({ tipo: 'abrirDetalle', id: n.movimientoId! }) : undefined}
          disabled={!n.movimientoId}
          className="flex w-full cursor-pointer items-start gap-3 rounded-sm border border-app-divider bg-app-surface px-4 py-3 text-left hover:bg-app-accent-bg disabled:cursor-default disabled:hover:bg-app-surface"
        >
          <span className={`mt-1.5 size-(--app-dot) shrink-0 rounded-full ${n.tono === 'warning' ? 'bg-app-tag-warning-dot' : n.tono === 'success' ? 'bg-app-tag-success-dot' : 'bg-app-tag-info-dot'}`} />
          <span className="text-pretty text-body tabular-nums">{n.texto}</span>
        </button>
      </li>
    )) : <li className="text-body text-app-ink-2">Nada nuevo por ahora.</li>}
  </ul>
);

/**
 * Todas las cuentas: saldo, banco y máscara; "Pasar dinero" abre la ventana de pago a esa cuenta y "Ver datos para depositar" la CLABE.
 * Abierto desde una fila del menú lateral, esa cuenta va primera y recibe el foco (C-56; en la app, no en los frames del tablero).
 */
export const ListaCuentas: FC<{ items: NonNullable<VistaPanel['cuentas']>; dispatch: (a: Accion) => void; enfocar?: boolean }> = ({ items, dispatch, enfocar = false }) => {
  const elegida = useRef<HTMLLIElement>(null);
  useEffect(() => { if (enfocar) elegida.current?.focus(); }, [enfocar]);
  return (
    <ul data-component="TodasLasCuentas" className="flex flex-col gap-2.5">
      {items.map((c) => (
        <li key={c.id} ref={c.elegida ? elegida : undefined} tabIndex={c.elegida ? -1 : undefined} className="flex flex-col gap-2 rounded-sm border border-app-divider bg-app-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ChipDivisa divisa={c.divisa} chico /><span className="text-body font-semibold">{c.nombre}</span></div>
            <span className="text-body font-semibold tabular-nums">{c.saldo}</span>
          </div>
          <span className="text-caption text-app-ink-2 tabular-nums">{c.banco} · **** {c.mascara}{c.clabe ? ` · CLABE ${c.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')}` : ''}</span>
          <div className="flex gap-4">
            <Boton variante="link-caption" className="px-0" onClick={() => dispatch({ tipo: 'abrirPanel', orden: { destino: { tipo: 'propia', id: c.id, nombre: c.nombre, divisa: c.divisa, banco: c.banco, mascara: c.mascara, cuentaId: c.id }, monto: 0, ladoFijo: 'recibe', conFactura: false, motivo: null, referencia: '' } })}>Pasar dinero a esta cuenta</Boton>
            {c.clabe ? <Boton variante="link-caption" className="px-0" onClick={() => dispatch({ tipo: 'abrirDepositar' })}>Ver datos para depositar</Boton> : null}
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Alta de destinatario: nombre, divisa, banco y cuenta; la máscara se guarda con los últimos 4 dígitos. */
export const FormularioDestinatario: FC<{ vista: NonNullable<VistaPanel['destinatario']>; dispatch: (a: Accion) => void }> = ({ vista: v, dispatch }) => {
  const [divisaAbierta, setDivisaAbierta] = useState(false);
  return (
    <div data-component="FormularioDestinatario" className="flex flex-col gap-4">
      <CampoTexto etiqueta="Nombre" valor={v.nombre} onCambiar={(t) => dispatch({ tipo: 'destinatarioCampo', campo: 'nombre', valor: t })} placeholder="Ej. Proveedor S.A. de C.V." error={v.errores.nombre} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelector etiqueta="Divisa de la cuenta" valor={v.divisa} placeholder="Elige la divisa" abierto={divisaAbierta} onAbrir={setDivisaAbierta}>
          {v.divisas.map((d: Divisa) => (
            <OpcionLista key={d} seleccionada={d === v.divisa} onElegir={() => { dispatch({ tipo: 'destinatarioCampo', campo: 'divisa', valor: d }); setDivisaAbierta(false); }}><ChipDivisa divisa={d} chico /><span className="text-body">{d}</span></OpcionLista>
          ))}
        </CampoSelector>
        <CampoTexto etiqueta="Banco" valor={v.banco} onCambiar={(t) => dispatch({ tipo: 'destinatarioCampo', campo: 'banco', valor: t })} placeholder="Ej. BBVA México" error={v.errores.banco} />
      </div>
      <CampoTexto etiqueta="Cuenta o CLABE" valor={v.cuenta} onCambiar={(t) => dispatch({ tipo: 'destinatarioCampo', campo: 'cuenta', valor: t })} placeholder="18 dígitos de CLABE o número de cuenta" inputMode="numeric" error={v.errores.cuenta} />
      <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" />En el prototipo no se valida contra el banco; queda guardado en memoria hasta recargar.</span>
      {v.valido ? <Badge tono="success">Listo para guardar</Badge> : null}
    </div>
  );
};
