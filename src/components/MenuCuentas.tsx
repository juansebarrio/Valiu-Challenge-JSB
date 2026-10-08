import type { FC } from 'react';
import type { Accion } from '@/state/estado';
import type { VistaMenuCuentas } from '@/state/vistas';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';

export interface MenuCuentasProps {
  vista: VistaMenuCuentas;
  dispatch: (a: Accion) => void;
}

/**
 * "Tus cuentas" en el menú lateral, bajo las entradas y arriba de "Cerrar sesión" (C-56): una fila por cuenta con el nombre y, debajo,
 * el saldo y la máscara. Cada fila abre el panel "Tus cuentas" con esa cuenta primero y el foco en ella; "Ver todas mis cuentas", el mismo
 * panel. Con el menú colapsado (64 px) el bloque no se muestra y queda un ítem de ícono que abre el panel.
 */
export const MenuCuentas: FC<MenuCuentasProps> = ({ vista, dispatch }) => (
  <div data-component="MenuCuentas" className="flex flex-col gap-1 @max-lg/shell:items-center">
    <hr className="my-2 self-stretch border-app-divider hairline-t" />
    <section aria-labelledby="menu-cuentas-titulo" className="flex flex-col gap-1 @max-lg/shell:hidden">
      <span id="menu-cuentas-titulo" className="px-2.5 pb-1 text-overline font-semibold uppercase tracking-overline text-app-ink-2">Tus cuentas</span>
      <ul className="flex flex-col gap-1">
        {vista.items.map((c) => (
          <li key={c.id}>
            <button type="button" aria-haspopup="dialog" onClick={() => dispatch({ tipo: 'abrirCuentas', cuentaId: c.id })} className="flex w-full cursor-pointer flex-col gap-0.5 rounded-sm bg-transparent px-2.5 py-1.5 text-left transition-colors hover:bg-app-accent-bg">
              <span className="truncate text-body font-medium text-app-ink">{c.nombre}</span>
              <span className="flex items-baseline justify-between gap-2 text-caption text-app-ink-2 tabular-nums">
                <span className="whitespace-nowrap">{c.saldo}</span>
                <span className="whitespace-nowrap">{c.mascara}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Boton variante="link-caption" aria-haspopup="dialog" className="self-start px-2.5!" onClick={() => dispatch({ tipo: 'abrirCuentas' })}>{vista.verTodas}</Boton>
    </section>
    <button type="button" aria-label="Tus cuentas" title="Tus cuentas" aria-haspopup="dialog" onClick={() => dispatch({ tipo: 'abrirCuentas' })} className="hidden h-(--app-nav-item-h) w-(--app-nav-item-w-min) cursor-pointer items-center justify-center rounded-sm bg-transparent text-app-ink transition-colors hover:bg-app-accent-bg @max-lg/shell:flex">
      <Icono nombre="wallet" tamano="md" />
    </button>
  </div>
);
