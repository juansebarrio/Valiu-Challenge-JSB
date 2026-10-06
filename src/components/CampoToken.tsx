'use client';
import { useEffect, useRef, type ClipboardEvent, type FC, type KeyboardEvent } from 'react';
import { Etiqueta } from './ui/Campo';

export interface CampoTokenProps {
  valor: string;
  habilitado: boolean;
  onChange: (valor: string) => void;
  /** panel: casillas 48×48 · formulario: 44×48. */
  ancho?: 'panel' | 'formulario';
  autoFoco?: boolean;
  etiqueta?: string;
}

const N = 6;

/** Seis casillas numéricas con autoavance; deshabilitada bg #F5F7FA borde #DCDCDE. */
export const CampoToken: FC<CampoTokenProps> = ({ valor, habilitado, onChange, ancho = 'panel', autoFoco, etiqueta = 'Ingresa el código de tu token' }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digitos = valor.replace(/\D/g, '').slice(0, N);
  const activa = Math.min(digitos.length, N - 1);

  useEffect(() => {
    if (autoFoco && habilitado) refs.current[activa]?.focus();
    // Solo al montar o al habilitar: no robar el foco en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFoco, habilitado]);

  const setDigito = (i: number, d: string) => {
    const arr = digitos.split('');
    arr[i] = d;
    const nuevo = arr.join('').slice(0, N);
    onChange(nuevo);
    if (d && i < N - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digitos[i]) setDigito(i, '');
      else if (i > 0) { onChange(digitos.slice(0, i - 1)); refs.current[i - 1]?.focus(); }
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < N - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const texto = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, N);
    if (texto) { e.preventDefault(); onChange(texto); refs.current[Math.min(texto.length, N - 1)]?.focus(); }
  };

  return (
    <div data-component="CampoToken" className="flex flex-col gap-2">
      <Etiqueta id="token-label" apagada={!habilitado}>{etiqueta}</Etiqueta>
      <div className="flex gap-2" role="group" aria-labelledby="token-label">
        {Array.from({ length: N }, (_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Dígito ${i + 1} de ${N}`}
            disabled={!habilitado}
            value={digitos[i] ?? ''}
            onChange={(e) => setDigito(i, e.target.value.replace(/\D/g, '').slice(-1))}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            className={[
              'h-(--app-token-box) rounded-sm text-center text-token font-semibold tabular-nums outline-none',
              ancho === 'panel' ? 'w-(--app-token-box)' : 'w-(--app-token-box-w-op)',
              habilitado ? 'hairline border-app-border-input bg-app-surface focus:border focus:border-app-accent' : 'hairline border-app-ink-disabled bg-app-canvas text-app-ink-3',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
};
