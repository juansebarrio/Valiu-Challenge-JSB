import type { FC } from 'react';
import type { Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import { Badge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { ChipDivisa } from './ui/ChipDivisa';
import { ProyeccionSemana } from './Graficas';

export interface TarjetaPosicionProps {
  divisa: Divisa;
  nombre: string;
  saldo: Centavos;
  pactadasRecibir?: { cantidad: number; total: Centavos } | null;
  pactadasLiquidar?: { cantidad: number; total: Centavos } | null;
  pagosFuturos?: { cantidad: number; total: Centavos } | null;
  resultado: { tipo: 'faltan' | 'sobran' | 'nada'; monto: Centavos };
  proyeccion?: { serie: Centavos[]; etiquetas: string[]; etiquetaCruce?: string | null } | null;
  linea?: string;
  accion?: { label: string; onClick: () => void } | null;
  enlace?: { label: string; onClick?: () => void } | null;
  className?: string;
}

const Fila: FC<{ label: string; valor: string }> = ({ label, valor }) => (
  <div className="flex justify-between gap-2"><dt className="text-app-ink-2">{label}</dt><dd className="font-semibold">{valor}</dd></div>
);

/** Protagonista del inicio: blanca, radio 8, Shadow Mid, padding 20. Cada línea aparece solo si tiene movimientos. */
export const TarjetaPosicion: FC<TarjetaPosicionProps> = ({ divisa, nombre, saldo, pactadasRecibir, pactadasLiquidar, pagosFuturos, resultado, proyeccion, linea, accion, enlace, className }) => {
  const resLabel = resultado.tipo === 'faltan' ? 'Faltan' : resultado.tipo === 'sobran' ? 'Sobran' : `Nada pendiente en ${nombre.toLowerCase()}`;
  return (
    <article data-component="TarjetaPosicion" aria-label={`Posición en ${nombre.toLowerCase()}`} className={['flex min-w-0 flex-col gap-2.5 rounded-sm bg-app-surface p-5 shadow-mid', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-2">
        <ChipDivisa divisa={divisa} />
        <span className="text-body font-semibold text-app-ink-2">{nombre}</span>
      </div>
      <dl className="flex flex-col gap-1 text-body tabular-nums">
        <Fila label="Saldo" valor={fmt.numero(saldo)} />
        {pactadasRecibir ? <Fila label={`Pactadas por recibir (${pactadasRecibir.cantidad})`} valor={fmt.montoSigno(pactadasRecibir.total)} /> : null}
        {pactadasLiquidar ? <Fila label={`Pactadas por liquidar (${pactadasLiquidar.cantidad})`} valor={fmt.monto(-pactadasLiquidar.total)} /> : null}
        {pagosFuturos ? <Fila label={`Pagos futuros (${pagosFuturos.cantidad})`} valor={fmt.monto(-pagosFuturos.total)} /> : null}
      </dl>
      <div className="h-px bg-app-divider" />
      <div className="flex min-h-(--app-resultado-h) items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-body font-medium text-app-ink-2">{resLabel}</span>
          {resultado.tipo !== 'nada' ? (
            <span className={['text-amount font-semibold tabular-nums', resultado.tipo === 'faltan' ? 'text-app-danger' : 'text-app-ink'].join(' ')}>{fmt.numero(resultado.monto)}</span>
          ) : null}
        </div>
        {resultado.tipo === 'faltan' ? <Badge tono="error">Falta</Badge> : resultado.tipo === 'sobran' ? <Badge tono="success">Alcanza</Badge> : null}
      </div>
      {proyeccion ? <ProyeccionSemana serie={proyeccion.serie} etiquetas={proyeccion.etiquetas} etiquetaCruce={proyeccion.etiquetaCruce} titulo={`Proyección de la semana en ${nombre.toLowerCase()}`} /> : null}
      <span className="min-h-(--app-lh-caption) text-pretty text-caption text-app-ink-2 tabular-nums">{linea}</span>
      {enlace ? <Boton variante="link" onClick={enlace.onClick} className="self-start">{enlace.label}</Boton> : null}
      {accion ? <Boton variante="primary" tamano="large" onClick={accion.onClick} className="mt-1 self-start">{accion.label}</Boton> : null}
    </article>
  );
};
