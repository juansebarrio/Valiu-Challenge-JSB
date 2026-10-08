'use client';
import { useState, type FC, type ReactNode } from 'react';
import { leerCentavos, limpiarMonto, type Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';

export interface BloqueMontoProps {
  pagas: { monto: Centavos; divisa: Divisa };
  recibe: { monto: Centavos; divisa: Divisa; destinatario: string };
  ladoFijo: 'recibe' | 'pagas';
  /** Hay tipo de cambio: el lado no fijo "se actualiza en vivo". */
  conTdc: boolean;
  /** Con la ventana para confirmar abierta (C-48) el lado no fijo es exacto en cada instante: sin "≈". */
  exacto?: boolean;
  /** Transferencia en la misma divisa: un solo monto, "Envías" (lo que sale), sin "Recibe" (C-50). */
  unico?: boolean;
  /** false en la confirmación y el detalle: los montos son finales, sin "Fijo" ni "se actualiza en vivo". */
  marcas?: boolean;
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
              inputMode={fmt.decimales(divisa) === 0 ? 'numeric' : 'decimal'}
              value={texto ?? (monto > 0 ? fmt.numero(monto, divisa) : '')}
              placeholder={fmt.numero(0, divisa)}
              onFocus={() => setTexto(monto > 0 ? fmt.numero(monto, divisa) : '')}
              onChange={(e) => {
                // En una divisa sin decimales (JPY) el punto no se acepta (C-57).
                const t = limpiarMonto(e.target.value, divisa);
                if (t == null) return;
                setTexto(t);
                const c = leerCentavos(t, divisa);
                if (c != null) onCambiar?.(c);
              }}
              onBlur={() => setTexto(null)}
              className="min-w-0 flex-1 rounded-xs bg-transparent text-amount font-semibold outline-none placeholder:text-app-ink-3 focus:bg-app-accent-bg"
            />
          </label>
        ) : (
          <span className="text-amount font-semibold">{aprox ? '≈ ' : ''}{fmt.numero(monto, divisa)}</span>
        )}
        <span className="text-caption font-semibold text-app-ink-2">{divisa}</span>
      </div>
    </div>
  );
};

/**
 * Dos bloques separados por divisor; el lado fijo lleva candado + tag "Fijo", el otro la marca "se actualiza en vivo".
 * Siempre "Pagas" arriba y "{destinatario} recibe" abajo, con y sin factura (C-39). Sin factura (editable) los dos son campos;
 * el que el usuario escribe queda fijo y el otro se recalcula con el indicativo (sección 7 del brief) o, con la ventana para confirmar
 * abierta, con el precio ejecutable en vivo y sin "≈" (C-48). En una transferencia en la misma divisa, un solo monto: "Envías" (C-50).
 */
export const BloqueMonto: FC<BloqueMontoProps> = ({ pagas, recibe, ladoFijo, conTdc, exacto, unico, marcas = true, editable, onCambiar }) => {
  if (unico) {
    return (
      <div data-component="BloqueMonto" className="flex flex-col rounded-sm border border-app-divider">
        <Lado label="Envías" monto={pagas.monto} divisa={pagas.divisa} aprox={false} derecha={null} editable={!!editable} onCambiar={(c) => onCambiar?.('pagas', c)} />
      </div>
    );
  }
  const fijo = marcas ? <Badge tono="neutral" icono="lock">Fijo</Badge> : null;
  const enVivo = marcas && conTdc ? <EnVivo /> : null;
  const aprox = conTdc && !exacto;
  const ladoPagas = <Lado label="Pagas" monto={pagas.monto} divisa={pagas.divisa} aprox={aprox && ladoFijo !== 'pagas'} derecha={ladoFijo === 'pagas' ? fijo : enVivo} editable={!!editable} onCambiar={(c) => onCambiar?.('pagas', c)} />;
  const ladoRecibe = <Lado label={editable ? `Recibe · ${recibe.destinatario.replace(/ recibe$/, '')}` : recibe.destinatario} monto={recibe.monto} divisa={recibe.divisa} aprox={aprox && ladoFijo !== 'recibe'} derecha={ladoFijo === 'recibe' ? fijo : enVivo} editable={!!editable} onCambiar={(c) => onCambiar?.('recibe', c)} />;
  return (
    <div data-component="BloqueMonto" className="flex flex-col rounded-sm border border-app-divider">
      {ladoPagas}
      <div className="h-px bg-app-divider" />
      {ladoRecibe}
    </div>
  );
};
