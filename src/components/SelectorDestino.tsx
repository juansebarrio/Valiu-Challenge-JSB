'use client';
import type { FC } from 'react';
import type { GrupoDestino } from '@/state/vistas';
import { CampoSelector, OpcionLista, TituloGrupo } from './ui/Campo';
import { ChipDivisa } from './ui/ChipDivisa';
import { Icono } from './ui/Icono';
import { Boton } from './ui/Boton';

export interface SelectorDestinoProps {
  grupos: GrupoDestino[];
  busqueda: string;
  onBusqueda: (texto: string) => void;
  onElegir: (item: GrupoDestino['items'][number]) => void;
  onAgregar?: () => void;
  /** campo: dropdown dentro de un formulario · lista: siempre abierto (paso Destino de la ventana de pago). */
  modo: 'campo' | 'lista';
  valor?: string | null;
  abierto?: boolean;
  onAbrir?: (abierto: boolean) => void;
  etiqueta?: string;
  placeholder?: string;
  vacio?: string;
}

const Items: FC<Pick<SelectorDestinoProps, 'grupos' | 'onElegir' | 'onAgregar' | 'vacio'>> = ({ grupos, onElegir, onAgregar, vacio }) => (
  <>
    {grupos.length ? grupos.map((g) => (
      <div key={g.titulo} className="contents">
        <TituloGrupo>{g.titulo}</TituloGrupo>
        {g.items.map((d) => (
          <OpcionLista key={d.id} alta seleccionada={d.seleccionado} onElegir={() => onElegir(d)}>
            <ChipDivisa divisa={d.divisa} chico />
            <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body font-semibold">{d.nombre}</span><span className="truncate text-caption text-app-ink-2 tabular-nums">{d.sub}</span></span>
          </OpcionLista>
        ))}
      </div>
    )) : <span className="px-2 py-2 text-caption text-app-ink-2">{vacio ?? 'Sin resultados.'}</span>}
    <div className="mt-1 border-t border-app-divider px-2 pb-1 pt-2.5">
      <Boton variante="link-caption" className="px-0" onClick={onAgregar}><Icono nombre="plus" tamano="sm" className="mr-1" />Agregar destinatario</Boton>
    </div>
  </>
);

/** Buscador y grupos ("Pagos próximos", "Tus cuentas", "Destinatarios"): el mismo componente en la ventana de pago y en Transferir del clásico. */
export const SelectorDestino: FC<SelectorDestinoProps> = ({ modo, grupos, busqueda, onBusqueda, onElegir, onAgregar, valor = null, abierto = false, onAbrir, etiqueta = 'Destino', placeholder = 'Elige una cuenta', vacio }) => {
  if (modo === 'campo') {
    return (
      <CampoSelector etiqueta={etiqueta} valor={valor} placeholder={placeholder} abierto={abierto} onAbrir={(ab) => onAbrir?.(ab)} busqueda={{ texto: busqueda, onCambiar: onBusqueda, placeholder: 'Busca una cuenta o destinatario' }}>
        <div data-component="SelectorDestino" className="contents"><Items grupos={grupos} onElegir={onElegir} onAgregar={onAgregar} vacio={vacio} /></div>
      </CampoSelector>
    );
  }
  return (
    <div data-component="SelectorDestino" className="flex flex-col gap-3">
      <label className="flex min-h-(--app-input-h) items-center gap-2 rounded-sm border border-app-accent bg-app-surface px-3">
        <Icono nombre="search" tamano="sm" className="text-app-ink-2" />
        <span className="sr-only">Buscar destino</span>
        <input autoFocus value={busqueda} placeholder="Busca un pago, una cuenta o un destinatario" onChange={(e) => onBusqueda(e.target.value)} role="combobox" aria-expanded aria-autocomplete="list" aria-controls="destino-lista" className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-app-ink-3" />
      </label>
      <div id="destino-lista" role="listbox" aria-label="Destinos" className="flex flex-col gap-0.5 rounded-sm border border-app-divider p-2">
        <Items grupos={grupos} onElegir={onElegir} onAgregar={onAgregar} vacio={vacio} />
      </div>
    </div>
  );
};
