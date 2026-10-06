import type { FC } from 'react';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Boton } from './ui/Boton';

export interface ModuloCuentasProps {
  cuentas: { id: string; nombre: string; mascara: string; saldo: number; divisa: Divisa }[];
  onVerTodas?: () => void;
  className?: string;
}

/** Mismo contenedor que TarjetaTipoDeCambio; un solo componente de cuentas para las dos pestañas del home. */
export const ModuloCuentas: FC<ModuloCuentasProps> = ({ cuentas, onVerTodas, className }) => (
  <section data-component="ModuloCuentas" aria-labelledby="cuentas-titulo" className={['flex flex-col rounded-sm border border-app-divider bg-app-surface p-4', className].filter(Boolean).join(' ')}>
    <div className="flex items-baseline justify-between border-b border-app-divider pb-2">
      <h2 id="cuentas-titulo" className="text-h3 font-semibold">Cuentas</h2>
    </div>
    <ul className="flex flex-col">
      {cuentas.map((c) => (
        <li key={c.id} className="flex flex-col gap-0.5 border-b border-app-divider py-2.5">
          <span className="text-body font-medium">{c.nombre}</span>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-caption text-app-ink-2 tabular-nums">****{c.mascara}</span>
            <span className="whitespace-nowrap text-body font-semibold tabular-nums">{fmt.monto(c.saldo, c.divisa)}</span>
          </div>
        </li>
      ))}
    </ul>
    <Boton variante="secondary" tamano="mid" onClick={onVerTodas} className="mt-4 w-full">Ver todas mis cuentas</Boton>
  </section>
);
