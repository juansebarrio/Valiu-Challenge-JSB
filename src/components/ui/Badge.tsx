import type { FC, ReactNode } from 'react';
import { Icono, type NombreIcono } from './Icono';

export type TonoBadge = 'success' | 'warning' | 'error' | 'neutral' | 'pactada' | 'info';

const TONOS: Record<TonoBadge, { bg: string; dot: string }> = {
  success: { bg: 'bg-app-tag-success-bg', dot: 'bg-app-tag-success-dot' },
  warning: { bg: 'bg-app-tag-warning-bg', dot: 'bg-app-tag-warning-dot' },
  error: { bg: 'bg-app-tag-error-bg', dot: 'bg-app-tag-error-dot' },
  neutral: { bg: 'bg-app-tag-neutral-bg', dot: 'bg-app-tag-neutral-dot' },
  pactada: { bg: 'bg-app-tag-pactada-bg', dot: 'bg-app-tag-pactada-dot' },
  info: { bg: 'bg-app-tag-info-bg', dot: 'bg-app-tag-info-dot' },
};

export interface BadgeProps {
  tono: TonoBadge;
  children: ReactNode;
  /** Ícono en lugar del punto (p. ej. candado en "Fijo"). */
  icono?: NombreIcono;
  /** Variante "Futuro": sin punto, borde punteado Grey2. */
  futuro?: boolean;
  className?: string;
}

/** Tag del DS: radio 16, padding 4 12 4 8, punto 8 px, texto 12/500 #151522. El punto nunca va solo. */
export const Badge: FC<BadgeProps> = ({ tono, children, icono, futuro, className }) => {
  const t = TONOS[tono];
  return (
    <span className={['inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg py-1 pl-2 pr-3 text-caption font-medium tabular-nums', futuro ? 'border border-dashed border-app-ink-3 text-app-ink-2' : `${t.bg} text-app-ink`, className].filter(Boolean).join(' ')}>
      {futuro ? null : icono ? <Icono nombre={icono} tamano="xs" /> : <span className={`size-(--app-dot) shrink-0 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
};
