import type { ButtonHTMLAttributes, FC } from 'react';

export type VarianteBoton = 'primary' | 'secondary' | 'link' | 'link-caption';
/** mid 32 (14/24) · large 36 (14/20) · xl 40 (16/24) · xl-14: 40 px con texto 14 (secundario del footer del panel). */
export type TamanoBoton = 'mid' | 'large' | 'xl' | 'xl-14';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
}

const BASE = 'inline-flex items-center justify-center whitespace-nowrap rounded-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed';

const VARIANTES: Record<VarianteBoton, string> = {
  primary: 'bg-app-primary text-app-on-primary hover:bg-app-primary-hover active:bg-app-primary-press disabled:bg-app-canvas disabled:text-app-ink-disabled',
  secondary: 'bg-app-surface text-app-primary border border-app-primary hover:bg-app-accent-bg disabled:bg-app-canvas disabled:text-app-ink-disabled disabled:border-app-ink-disabled',
  link: 'bg-transparent text-app-primary px-0 py-1 hover:underline disabled:text-app-ink-disabled',
  'link-caption': 'bg-transparent text-app-ink text-caption font-semibold underline px-2 py-1 hover:text-app-primary',
};

const TAMANOS: Record<TamanoBoton, string> = {
  mid: 'min-h-(--app-button-h-mid) px-4 py-1 text-body-tall',
  large: 'min-h-(--app-button-h-large) px-4 py-2 text-body',
  xl: 'min-h-(--app-button-h-xl) px-4 py-2 text-cta-xl',
  'xl-14': 'min-h-(--app-button-h-xl) px-4 py-2 text-body-tall',
};

/** Botones del DS: Primary / Secondary (Mid 28 · Large 36 · ExtraLarge 40) y link de texto. Un solo primario por vista. */
export const Boton: FC<BotonProps> = ({ variante = 'primary', tamano = 'large', className, type = 'button', ...rest }) => {
  const esLink = variante === 'link' || variante === 'link-caption';
  return <button type={type} className={[BASE, VARIANTES[variante], esLink ? (variante === 'link' ? 'text-body' : '') : TAMANOS[tamano], className].filter(Boolean).join(' ')} {...rest} />;
};
