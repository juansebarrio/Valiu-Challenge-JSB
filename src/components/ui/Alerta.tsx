import type { FC, ReactNode } from 'react';
import { Icono, type NombreIcono } from './Icono';

export type TonoAlerta = 'success' | 'warning' | 'error' | 'info';

const TONOS: Record<TonoAlerta, { caja: string; icono: string; nombre: NombreIcono }> = {
  success: { caja: 'bg-app-alert-success-bg border-app-alert-success-border', icono: 'text-app-alert-success-border', nombre: 'check-circle' },
  warning: { caja: 'bg-app-alert-warning-bg border-app-alert-warning-border', icono: 'text-app-ink', nombre: 'clock-ten' },
  error: { caja: 'bg-app-alert-error-bg border-app-alert-error-border', icono: 'text-app-alert-error-border', nombre: 'info-circle' },
  info: { caja: 'bg-app-alert-info-bg border-app-alert-info-border', icono: 'text-app-primary', nombre: 'info-circle' },
};

export interface AlertaProps {
  tono: TonoAlerta;
  titulo?: ReactNode;
  children?: ReactNode;
  icono?: NombreIcono;
  /** Contenido a la derecha (chip, link, botón de cierre). */
  extra?: ReactNode;
  onCerrar?: () => void;
  /** Alerta de una línea (AvisoResultado): padding 12 16 y texto 14/500. */
  compacta?: boolean;
  className?: string;
  role?: 'status' | 'alert';
}

/** Alert del DS: radio 8, borde 1 px del color fuerte, ícono 20, gap 16. */
export const Alerta: FC<AlertaProps> = ({ tono, titulo, children, icono, extra, onCerrar, compacta, className, role = 'status' }) => {
  const t = TONOS[tono];
  return (
    <div role={role} className={['flex gap-4 rounded-sm border', compacta ? 'items-center px-4 py-3' : 'items-start p-4', t.caja, className].filter(Boolean).join(' ')}>
      <Icono nombre={icono ?? t.nombre} tamano="lg" className={t.icono} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {titulo ? <span className={compacta ? 'text-body font-medium' : 'text-body font-semibold'}>{titulo}</span> : null}
        {children ? <div className={compacta ? 'text-body' : 'text-caption text-app-ink-2'}>{children}</div> : null}
      </div>
      {extra}
      {onCerrar ? (
        <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="flex size-(--app-icon-md) shrink-0 cursor-pointer items-center justify-center rounded-xs bg-transparent text-app-ink-2 hover:text-app-ink">
          <Icono nombre="times" tamano="md" />
        </button>
      ) : null}
    </div>
  );
};
