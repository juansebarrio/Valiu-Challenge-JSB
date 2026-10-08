import type { FC } from 'react';
import { Alerta } from './ui/Alerta';

export interface AvisoResultadoProps {
  tipo: 'success' | 'info';
  texto: string;
  onCerrar: () => void;
}

/** Success para el pago enviado; info (borde indigo, calendario) para el pago pactado. */
export const AvisoResultado: FC<AvisoResultadoProps> = ({ tipo, texto, onCerrar }) => (
  <div data-component="AvisoResultado">
    <Alerta tono={tipo} compacta icono={tipo === 'info' ? 'calendar-alt' : 'check-circle'} titulo={texto} onCerrar={onCerrar} role="status" />
  </div>
);
