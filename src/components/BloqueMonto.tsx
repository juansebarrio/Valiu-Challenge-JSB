import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';

export interface BloqueMontoProps {
  pagas: { monto: number; divisa: Divisa; enVivo: boolean };
  recibe: { monto: number; divisa: Divisa; fijo: boolean; destinatario: string };
}

const Lado: FC<{ label: string; monto: number; divisa: Divisa; aprox?: boolean; derecha: React.ReactNode }> = ({ label, monto, divisa, aprox, derecha }) => (
  <div className="flex flex-col gap-1 px-4 py-3">
    <div className="flex items-center justify-between">
      <span className="text-caption font-bold text-app-ink-label">{label}</span>
      {derecha}
    </div>
    <div className="flex items-baseline gap-1.5 tabular-nums">
      <span className="text-amount font-semibold">{aprox ? '≈ ' : ''}{fmt.numero(monto)}</span>
      <span className="text-caption font-semibold text-app-ink-2">{divisa}</span>
    </div>
  </div>
);

/** Dos bloques separados por divisor; el lado fijo lleva candado + tag "Fijo", el otro la marca "se actualiza en vivo". */
export const BloqueMonto: FC<BloqueMontoProps> = ({ pagas, recibe }) => (
  <div data-component="BloqueMonto" className="flex flex-col rounded-sm border border-app-divider">
    <Lado
      label="Pagas"
      monto={pagas.monto}
      divisa={pagas.divisa}
      aprox={pagas.enVivo}
      derecha={pagas.enVivo ? (
        <span className="inline-flex items-center gap-1.5 text-caption text-app-ink-2"><span className="size-(--app-dot) rounded-full bg-app-info-dot" />se actualiza en vivo</span>
      ) : (
        <Badge tono="neutral" icono="lock">Fijo</Badge>
      )}
    />
    <div className="h-px bg-app-divider" />
    <Lado label={recibe.destinatario} monto={recibe.monto} divisa={recibe.divisa} derecha={recibe.fijo ? <Badge tono="neutral" icono="lock">Fijo</Badge> : null} />
  </div>
);
