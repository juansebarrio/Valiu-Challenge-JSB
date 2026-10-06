import type { FC, ReactNode, Ref } from 'react';
import Link from 'next/link';
import { Logo } from './ui/Logo';
import { Icono, type NombreIcono } from './ui/Icono';
import { PieApp } from './ui/PieApp';

export type ModoShell = 'app' | 'frame';

const NAV: { label: string; icono: NombreIcono }[] = [
  { label: 'Inicio', icono: 'estate' },
  { label: 'Movimientos', icono: 'credit-card' },
  { label: 'Control de operaciones', icono: 'chart' },
  { label: 'Destinatarios', icono: 'sign-alt' },
  { label: 'Monitoreo de divisas', icono: 'chart-line' },
];

export interface AppShellProps {
  children: ReactNode;
  /** Panel lateral, onboarding: se posicionan sobre el shell. */
  capas?: ReactNode;
  /** app: ocupa la ventana y el sidebar se colapsa a 64 px bajo 1100 px · frame: 1280 px fijos (tablero). */
  modo?: ModoShell;
  raizRef?: Ref<HTMLDivElement>;
  activo?: number;
  /** Secciones fuera del prototipo: muestran un aviso breve en lugar de navegar. */
  onNoDisponible?: () => void;
  /** Las cinco entradas del menú son secciones reales: cambian la vista dentro de la app. */
  onNavegar?: (indice: number) => void;
  /** Campana: cantidad de avisos y qué abre. */
  campana?: { cantidad: number; onClick: () => void };
}

const ITEM = 'flex h-(--app-nav-item-h) cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-body whitespace-nowrap transition-colors hover:bg-app-accent-bg @max-lg/shell:w-(--app-nav-item-w-min) @max-lg/shell:justify-center @max-lg/shell:px-0';

/** Sidebar 240 · header 48 · main 24 32 32 · footer 40 (README · Layout del AppShell). */
export const AppShell: FC<AppShellProps> = ({ children, capas, modo = 'app', raizRef, activo = 0, onNoDisponible, onNavegar, campana }) => {
  const esApp = modo === 'app';
  const noDisponible = (e: React.MouseEvent) => { e.preventDefault(); onNoDisponible?.(); };
  return (
    // En la app, por debajo del ancho mínimo el shell se oculta y solo queda el aviso de pantalla (AvisoPantalla): así nada desborda ni en el teléfono.
    <div ref={raizRef} data-shell={modo} className={['relative flex bg-app-canvas text-app-ink @container/shell', esApp ? 'min-h-dvh w-full max-min:hidden' : 'w-(--app-frame-w) overflow-hidden'].join(' ')}>
      <aside className={['flex shrink-0 flex-col gap-1 border-app-divider bg-app-surface px-2 py-4 hairline-r', 'w-(--app-sidebar-w) @max-lg/shell:w-(--app-sidebar-w-min) @max-lg/shell:items-center', esApp ? 'sticky top-0 h-dvh' : ''].join(' ')}>
        <div className="mb-4 flex h-(--app-logo-row-h) items-center px-3 @max-lg/shell:px-0">
          <Logo className="@max-lg/shell:hidden" />
          <Logo variante="glyph" className="hidden @max-lg/shell:block" />
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1 @max-lg/shell:items-center">
          {NAV.map((it, i) => (
            <a key={it.label} href="#" onClick={onNavegar ? (e) => { e.preventDefault(); onNavegar(i); } : i === activo ? (e) => e.preventDefault() : noDisponible} aria-current={i === activo ? 'page' : undefined} title={it.label} className={[ITEM, i === activo ? 'bg-app-accent-bg font-semibold text-app-accent' : 'font-medium text-app-ink'].join(' ')}>
              <Icono nombre={it.icono} tamano="md" />
              <span className="@max-lg/shell:sr-only">{it.label}</span>
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        {esApp ? (
          // Cerrar sesión vuelve a la pantalla inicial de arquetipos.
          <Link href="/" title="Cerrar sesión" className={[ITEM, 'font-medium text-app-ink-2'].join(' ')}>
            <Icono nombre="signout" tamano="md" />
            <span className="@max-lg/shell:sr-only">Cerrar sesión</span>
          </Link>
        ) : (
          <a href="#" onClick={noDisponible} title="Cerrar sesión" className={[ITEM, 'font-medium text-app-ink-2'].join(' ')}>
            <Icono nombre="signout" tamano="md" />
            <span className="@max-lg/shell:sr-only">Cerrar sesión</span>
          </a>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-(--app-header-h) shrink-0 items-center justify-end gap-6 border-app-divider bg-app-surface px-8 hairline-b">
          <a href="#" onClick={noDisponible} className="inline-flex cursor-pointer items-center gap-1 rounded-2xl border border-app-primary bg-app-surface px-3 py-1.5 text-caption font-semibold text-app-primary shadow-high hover:bg-app-accent-bg">
            <Icono nombre="whatsapp" tamano="sm" />
            Contáctanos
          </a>
          <button type="button" onClick={campana ? campana.onClick : onNoDisponible} aria-label={campana?.cantidad ? `Notificaciones (${campana.cantidad})` : 'Notificaciones'} aria-haspopup={campana ? 'dialog' : undefined} className="relative flex cursor-pointer items-center rounded-xs bg-transparent text-app-ink">
            <Icono nombre="bell" tamano="xl" />
            {campana?.cantidad ? <span aria-hidden className="absolute -right-0.5 -top-0.5 size-(--app-dot) rounded-full bg-app-danger" /> : null}
          </button>
        </header>

        <main className="flex flex-1 flex-col gap-5 px-8 pb-8 pt-6">{children}</main>

        <PieApp onNoDisponible={onNoDisponible} />
      </div>
      {capas}
    </div>
  );
};
