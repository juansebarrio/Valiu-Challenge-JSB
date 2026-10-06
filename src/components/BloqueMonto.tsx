'use client';
import { useState, type FC, type ReactNode } from 'react';
import { leerCentavos, type Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';

export interface BloqueMontoProps {
  pagas: { monto: Centavos; divisa: Divisa };
  recibe: { monto: Centavos; divisa: Divisa; destinatario: string };
  ladoFijo: 'recibe' | 'pagas';
  /** Hay tipo de cambio: el lado no fijo "se actualiza en vivo". */
  conTdc: boolean;
  /** Sin factura, los dos montos se editan; el que escribes queda fijo. */
  editable?: boolean;
  onCambiar?: (lado: 'recibe' | 'pagas', valor: Centavos) => void;
}

const EnVivo: FC = () => (
  <span className="inline-flex items-center gap-1.5 text-caption text-app-ink-2"><span className="size-(--app-dot) rounded-full bg-app-info-dot" />se actualiza en vivo</span>
);

const Lado: FC<{ label: string; monto: Centavos; divisa: Divisa; aprox: boolean; derecha: ReactNode; editable: boolean; onCambiar?: (c: Centavos) => void }> = ({ label, monto, divisa, aprox, derecha, editable, onCambiar }) => {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-caption font-bold text-app-ink-label">{label}</span>
        {derecha}
      </div>
      <div className="flex items-baseline gap-1.5 tabular-nums">
        {editable ? (
          <label className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="sr-only">{label}</span>
            {aprox ? <span className="text-amount font-semibold">≈</span> : null}
            <input
              inputMode="decimal"
              value={texto ?? (monto > 0 ? fmt.numero(monto) : '')}
              placeholder="0.00"
              onFocus={() => setTexto(monto > 0 ? fmt.numero(monto) : '')}
              onChange={(e) => { const t = e.target.value.replace(/[^\d.,]/g, ''); setTexto(t); const c = leerCentavos(t); if (c != null) onCambiar?.(c); }}
              onBlur={() => setTexto(null)}
              className="min-w-0 flex-1 rounded-xs bg-transparent text-amount font-semibold outline-none placeholder:text-app-ink-3 focus:bg-app-accent-bg"
            />
          </label>
        ) : (
          <span className="text-amount font-semibold">{aprox ? '≈ ' : ''}{fmt.numero(monto)}</span>
        )}
        <span className="text-caption font-semibold text-app-ink-2">{divisa}</span>
      </div>
    </div>
  );
};

/** Dos bloques separados por divisor; el lado fijo lleva candado + tag "Fijo", el otro la marca "se actualiza en vivo". */
export const BloqueMonto: FC<BloqueMontoProps> = ({ pagas, recibe, ladoFijo, conTdc, editable, onCambiar }) => {
  const fijo = <Badge tono="neutral" icono="lock">Fijo</Badge>;
  return (
    <div data-component="BloqueMonto" className="flex flex-col rounded-sm border border-app-divider">
      <Lado label="Pagas" monto={pagas.monto} divisa={pagas.divisa} aprox={conTdc && ladoFijo !== 'pagas'} derecha={ladoFijo === 'pagas' ? fijo : conTdc ? <EnVivo /> : null} editable={!!editable} onCambiar={(c) => onCambiar?.('pagas', c)} />
      <div className="h-px bg-app-divider" />
      <Lado label={recibe.destinatario} monto={recibe.monto} divisa={recibe.divisa} aprox={conTdc && ladoFijo !== 'recibe'} derecha={ladoFijo === 'recibe' ? fijo : conTdc ? <EnVivo /> : null} editable={!!editable} onCambiar={(c) => onCambiar?.('recibe', c)} />
    </div>
  );
};
