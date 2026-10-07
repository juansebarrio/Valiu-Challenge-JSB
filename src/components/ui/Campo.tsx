'use client';
import { useEffect, useId, useRef, type FC, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icono } from './Icono';

export type EstadoCampo = 'reposo' | 'activo' | 'error' | 'deshabilitado';

const BORDES: Record<EstadoCampo, string> = {
  reposo: 'hairline border-app-border-input',
  activo: 'border border-app-accent',
  error: 'border border-app-danger',
  deshabilitado: 'hairline border-app-ink-disabled bg-app-canvas',
};

export const Etiqueta: FC<{ htmlFor?: string; children: ReactNode; opcional?: boolean; apagada?: boolean; id?: string }> = ({ htmlFor, children, opcional, apagada, id }) => (
  <label id={id} htmlFor={htmlFor} className={['text-caption font-bold', apagada ? 'text-app-ink-3' : 'text-app-ink-label'].join(' ')}>
    {children}
    {opcional ? <span className="font-normal text-app-ink-2"> (opcional)</span> : null}
  </label>
);

export const MensajeError: FC<{ children: ReactNode; id?: string }> = ({ children, id }) => (
  <span id={id} role="alert" className="flex items-center gap-1.5 text-caption font-medium text-app-danger">
    <Icono nombre="info-circle" tamano="xs" />
    {children}
  </span>
);

export interface CampoTextoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  etiqueta: ReactNode;
  opcional?: boolean;
  valor: string;
  onCambiar: (valor: string) => void;
  error?: string | null;
  /** Texto fijo a la derecha (código de divisa). */
  sufijo?: ReactNode;
  monto?: boolean;
}

/** Input del DS: min-height 48, padding 12, radio 8, borde 0.5 px #021734; activo 1 px #0086FF; error 1 px #B40909. */
export const CampoTexto: FC<CampoTextoProps> = ({ etiqueta, opcional, valor, onCambiar, error, sufijo, monto, className, id, disabled, ...rest }) => {
  const auto = useId();
  const idCampo = id ?? auto;
  const estado: EstadoCampo = disabled ? 'deshabilitado' : error ? 'error' : 'reposo';
  return (
    <div className={['flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      <Etiqueta htmlFor={idCampo} opcional={opcional}>{etiqueta}</Etiqueta>
      <div className={['flex min-h-(--app-input-h) items-center gap-2 rounded-sm bg-app-surface px-3 focus-within:border focus-within:border-app-accent', BORDES[estado]].join(' ')}>
        <input
          id={idCampo}
          value={valor}
          disabled={disabled}
          onChange={(e) => onCambiar(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : undefined}
          className={['min-w-0 flex-1 bg-transparent outline-none placeholder:text-app-ink-3', monto ? 'text-body-lg font-semibold tabular-nums' : 'text-body'].join(' ')}
          {...rest}
        />
        {sufijo ? <span className="text-overline font-semibold tracking-overline text-app-currency">{sufijo}</span> : null}
      </div>
      {error ? <MensajeError id={`${idCampo}-error`}>{error}</MensajeError> : null}
    </div>
  );
};

export interface CampoSelectorProps {
  etiqueta: ReactNode;
  valor: string | null;
  placeholder: string;
  abierto: boolean;
  onAbrir: (abierto: boolean) => void;
  children?: ReactNode;
  /** El valor seleccionado va en 600 (selector de par). */
  fuerte?: boolean;
  className?: string;
  /** La etiqueta solo para lectores de pantalla (el selector de par de la tarjeta de tipo de cambio). */
  etiquetaOculta?: boolean;
}

/** Dropdown del DS: campo con chevron; la lista flota debajo (radio 8, borde divisor, --shadow-md). Se cierra con Escape o con un clic afuera. */
export const CampoSelector: FC<CampoSelectorProps> = ({ etiqueta, valor, placeholder, abierto, onAbrir, children, fuerte, className, etiquetaOculta }) => {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onAbrir);
  useEffect(() => { cerrarRef.current = onAbrir; }, [onAbrir]);
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cerrarRef.current(false); };
    document.addEventListener('pointerdown', afuera);
    return () => document.removeEventListener('pointerdown', afuera);
  }, [abierto]);
  return (
    <div ref={ref} className={['relative flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      {etiquetaOculta ? <span className="sr-only"><Etiqueta htmlFor={id}>{etiqueta}</Etiqueta></span> : <Etiqueta htmlFor={id}>{etiqueta}</Etiqueta>}
      <div className={['flex min-h-(--app-input-h) items-center justify-between gap-2 rounded-sm bg-app-surface px-3', abierto ? BORDES.activo : BORDES.reposo].join(' ')}>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-controls={abierto ? `${id}-lista` : undefined}
          onClick={() => onAbrir(!abierto)}
          onKeyDown={(e) => { if (e.key === 'Escape' && abierto) { e.stopPropagation(); onAbrir(false); } }}
          className={['flex min-w-0 flex-1 cursor-pointer items-center truncate bg-transparent text-left', fuerte ? 'text-body font-semibold' : 'text-body', valor ? 'text-app-ink' : 'text-app-ink-3'].join(' ')}
        >
          <span className="truncate">{valor ?? placeholder}</span>
        </button>
        <button type="button" tabIndex={-1} aria-hidden onClick={() => onAbrir(!abierto)} className="flex cursor-pointer items-center bg-transparent text-app-ink-2">
          <Icono nombre={abierto ? 'angle-up-b' : 'angle-down-b'} tamano="sm" />
        </button>
      </div>
      {abierto ? (
        <div
          id={`${id}-lista`}
          role="listbox"
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onAbrir(false); document.getElementById(id)?.focus(); } }}
          className="absolute inset-x-0 top-full z-10 mt-1.5 flex flex-col gap-0.5 rounded-sm border border-app-divider bg-app-surface p-2 shadow-md"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export const TituloGrupo: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="px-2 pb-1 pt-2 text-caption font-bold text-app-ink-2">{children}</span>
);

export interface OpcionListaProps {
  seleccionada?: boolean;
  onElegir: () => void;
  children: ReactNode;
  alta?: boolean;
  /** No se puede elegir (p. ej. cuenta sin saldo para la transferencia): fuera del tab order, cursor not-allowed. */
  deshabilitada?: boolean;
}

export const OpcionLista: FC<OpcionListaProps> = ({ seleccionada, onElegir, children, alta, deshabilitada }) => (
  <button
    type="button"
    role="option"
    aria-selected={!!seleccionada}
    aria-disabled={deshabilitada || undefined}
    disabled={deshabilitada}
    onClick={deshabilitada ? undefined : onElegir}
    className={['flex w-full items-center gap-2.5 rounded-sm px-2 text-left', deshabilitada ? 'cursor-not-allowed text-app-ink-2' : 'cursor-pointer hover:bg-app-accent-bg', alta ? 'min-h-(--app-row-h) py-1' : 'h-(--app-nav-item-h)', seleccionada ? 'bg-app-selected' : 'bg-transparent'].join(' ')}
  >
    {children}
  </button>
);
