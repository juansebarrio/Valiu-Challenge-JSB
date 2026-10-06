import type { ButtonHTMLAttributes, FC } from 'react';

/**
 * primary / secondary: botones del DS (Mid 32 · Large 36 · ExtraLarge 40; xl-14 = 40 px con texto 14).
 * link: Link Button del DS (tinta #151522, peso 600, subrayado) · link-caption: igual en 12 px.
 * fila: acción de fila ("Pagar" en Próximos): índigo, sin subrayado.
 */
export type VarianteBoton = 'primary' | 'secondary' | 'link' | 'link-caption' | 'fila';
export type TamanoBoton = 'mid' | 'large' | 'xl' | 'xl-14';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
}

const BASE = 'inline-flex items-center justify-center whitespace-nowrap rounded-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed';

const VARIANTES: Record<VarianteBoton, string> = {
  primary: 'bg-app-primary text-app-on-primary hover:bg-app-primary-hover active:bg-app-primary-press disabled:bg-app-canvas disabled:text-app-ink-disabled',
  secondary: 'bg-app-surface text-app-primary border border-app-primary hover:bg-app-accent-bg disabled:bg-app-canvas disabled:text-app-ink-disabled disabled:border-app-ink-disabled',
  link: 'bg-transparent text-app-ink text-body font-semibold underline px-0 py-1 hover:text-app-primary disabled:text-app-ink-disabled',
  'link-caption': 'bg-transparent text-app-ink text-caption font-semibold underline px-2 py-1 hover:text-app-primary disabled:text-app-ink-disabled',
  fila: 'bg-transparent text-app-primary text-body font-bold px-0 py-1 hover:text-app-primary-hover disabled:text-app-ink-disabled',
};

const TAMANOS: Record<TamanoBoton, string> = {
  mid: 'min-h-(--app-button-h-mid) px-4 py-1 text-body-tall',
  large: 'min-h-(--app-button-h-large) px-4 py-2 text-body',
  xl: 'min-h-(--app-button-h-xl) px-4 py-2 text-cta-xl',
  'xl-14': 'min-h-(--app-button-h-xl) px-4 py-2 text-body-tall',
};

/** Clases de un botón del DS, para aplicarlas a un enlace que navega (next/link) sin duplicar el componente. */
export const clasesBoton = (variante: VarianteBoton = 'primary', tamano: TamanoBoton = 'large', className?: string) => {
  const esTexto = variante === 'link' || variante === 'link-caption' || variante === 'fila';
  return [BASE, VARIANTES[variante], esTexto ? '' : TAMANOS[tamano], className].filter(Boolean).join(' ');
};

export const Boton: FC<BotonProps> = ({ variante = 'primary', tamano = 'large', className, type = 'button', ...rest }) => (
  <button type={type} className={clasesBoton(variante, tamano, className)} {...rest} />
);
