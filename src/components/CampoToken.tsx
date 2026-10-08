'use client';
import { useId, useState, type FC } from 'react';
import { Etiqueta, MensajeError } from './ui/Campo';

export interface CampoTokenProps {
  valor: string;
  habilitado: boolean;
  onChange: (valor: string) => void;
  autoFoco?: boolean;
  etiqueta?: string;
  error?: string | null;
}

const N = 6;

/** Un solo input (inputmode numeric, autocomplete one-time-code, admite pegar) con seis casillas visuales. */
export const CampoToken: FC<CampoTokenProps> = ({ valor, habilitado, onChange, autoFoco, etiqueta = 'Ingresa el código de tu token', error }) => {
  const id = useId();
  const [conFoco, setConFoco] = useState(false);
  const digitos = valor.replace(/\D/g, '').slice(0, N);
  const activa = Math.min(digitos.length, N - 1);
  return (
    <div data-component="CampoToken" className="flex flex-col gap-2">
      <Etiqueta htmlFor={id} apagada={!habilitado}>{etiqueta}</Etiqueta>
      <div className="relative inline-flex">
        <div aria-hidden className="flex gap-2">
          {Array.from({ length: N }, (_, i) => {
            const enfocada = habilitado && conFoco && i === activa;
            return (
              <span
                key={i}
                className={[
                  'flex size-(--app-token-box) items-center justify-center rounded-sm text-token font-semibold tabular-nums',
                  !habilitado ? 'hairline border-app-ink-disabled bg-app-canvas text-app-ink-3' : enfocada ? 'border border-app-accent bg-app-surface' : error ? 'border border-app-danger bg-app-surface' : 'hairline border-app-border-input bg-app-surface',
                ].join(' ')}
              >
                {digitos[i] ?? ''}
                {enfocada && !digitos[i] ? <span className="h-5 w-px animate-pulse bg-app-ink" /> : null}
              </span>
            );
          })}
        </div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={N}
          autoFocus={autoFoco && habilitado}
          disabled={!habilitado}
          value={digitos}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, N))}
          onFocus={() => setConFoco(true)}
          onBlur={() => setConFoco(false)}
          aria-label={`${etiqueta}, ${N} dígitos`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
        />
      </div>
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : null}
    </div>
  );
};
