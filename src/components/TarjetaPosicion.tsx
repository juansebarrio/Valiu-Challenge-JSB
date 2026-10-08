import type { FC } from 'react';
import type { Centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { Divisa } from '@/lib/fx';
import type { FilaPosicion } from '@/state/estado';
import { Badge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { ChipDivisa } from './ui/ChipDivisa';
import { Icono } from './ui/Icono';
import { ProyeccionSemana } from './Graficas';

export interface TarjetaPosicionProps {
  divisa: Divisa;
  nombre: string;
  saldo: Centavos;
  pactadasRecibir?: { cantidad: number; total: Centavos } | null;
  pactadasLiquidar?: { cantidad: number; total: Centavos } | null;
  pagosFuturos?: { cantidad: number; total: Centavos } | null;
  /** Pagos cargados en divisas sin cuenta que paga esta cuenta, al indicativo de compra: "≈" (C-54). */
  pagosOtrasDivisas?: { cantidad: number; total: Centavos } | null;
  resultado: { tipo: 'faltan' | 'sobran' | 'nada'; monto: Centavos };
  /** El resultado se mueve con el precio (hay pagos en otras divisas): lleva "≈". */
  aprox?: boolean;
  proyeccion?: { serie: Centavos[]; etiquetas: string[]; etiquetaCruce?: string | null } | null;
  linea?: string;
  accion?: { label: string; onClick: () => void } | null;
  enlace?: { label: string; onClick?: () => void } | null;
  /** Las filas con cantidad abren su desglose (C-55). */
  onDesglose?: (fila: FilaPosicion) => void;
  className?: string;
}

/**
 * Fila con cantidad: toda la fila es un botón (clic y Enter) con un chevron a la derecha del monto; abre el desglose (C-55).
 * La cantidad va pegada a la última palabra: si la etiqueta no entra en una línea, corta como "Pactadas por / liquidar (1)".
 */
const FilaConDesglose: FC<{ nombre: string; cantidad: number; valor: string; onClick?: () => void }> = ({ nombre, cantidad, valor, onClick }) => {
  const label = `${nombre}\u00a0(${cantidad})`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-haspopup="dialog" className="-mx-1.5 flex cursor-pointer items-start justify-between gap-2 rounded-xs bg-transparent px-1.5 text-left hover:bg-app-accent-bg">
      <span className="min-w-0 text-app-ink-2">{label}</span>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold">{valor}<Icono nombre="angle-right-b" tamano="xs" className="text-app-ink-2" /></span>
    </button>
  ) : (
    <div className="flex justify-between gap-2"><span className="text-app-ink-2">{label}</span><span className="font-semibold">{valor}</span></div>
  );
};

/** Protagonista del inicio: blanca, radio 8, Shadow Mid, padding 20. Cada línea aparece solo si tiene movimientos; "Saldo" no abre nada. */
export const TarjetaPosicion: FC<TarjetaPosicionProps> = ({ divisa, nombre, saldo, pactadasRecibir, pactadasLiquidar, pagosFuturos, pagosOtrasDivisas, resultado, aprox, proyeccion, linea, accion, enlace, onDesglose, className }) => {
  const resLabel = resultado.tipo === 'faltan' ? 'Faltan' : resultado.tipo === 'sobran' ? 'Sobran' : `Nada pendiente en ${nombre.toLowerCase()}`;
  const abrir = (fila: FilaPosicion) => (onDesglose ? () => onDesglose(fila) : undefined);
  return (
    <article data-component="TarjetaPosicion" aria-label={`Posición en ${nombre.toLowerCase()}`} className={['flex min-w-0 flex-col gap-2.5 rounded-sm bg-app-surface p-5 shadow-mid', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-2">
        <ChipDivisa divisa={divisa} />
        <span className="text-body font-semibold text-app-ink-2">{nombre}</span>
      </div>
      <div className="flex flex-col gap-1 text-body tabular-nums">
        <div className="flex justify-between gap-2"><span className="text-app-ink-2">Saldo</span><span className="font-semibold">{fmt.numero(saldo)}</span></div>
        {pactadasRecibir ? <FilaConDesglose nombre="Pactadas por recibir" cantidad={pactadasRecibir.cantidad} valor={fmt.montoSigno(pactadasRecibir.total)} onClick={abrir('pactadasRecibir')} /> : null}
        {pactadasLiquidar ? <FilaConDesglose nombre="Pactadas por liquidar" cantidad={pactadasLiquidar.cantidad} valor={fmt.monto(-pactadasLiquidar.total)} onClick={abrir('pactadasLiquidar')} /> : null}
        {pagosFuturos ? <FilaConDesglose nombre="Pagos futuros" cantidad={pagosFuturos.cantidad} valor={fmt.monto(-pagosFuturos.total)} onClick={abrir('pagosFuturos')} /> : null}
        {pagosOtrasDivisas ? <FilaConDesglose nombre="Pagos en otras divisas" cantidad={pagosOtrasDivisas.cantidad} valor={`≈ ${fmt.monto(-pagosOtrasDivisas.total)}`} onClick={abrir('pagosOtrasDivisas')} /> : null}
      </div>
      <div className="h-px bg-app-divider" />
      {/* El badge va en la línea de la etiqueta y el resultado usa todo el ancho de la tarjeta (a 1024 px no choca con el badge); se lee etiqueta, monto, badge. */}
      <div className="grid min-h-(--app-resultado-h) grid-cols-[minmax(0,1fr)_auto] content-start gap-x-2">
        <span className="col-start-1 row-start-1 text-body font-medium text-app-ink-2">{resLabel}</span>
        {resultado.tipo !== 'nada' ? (
          <span className={['col-span-2 row-start-2 whitespace-nowrap text-amount font-semibold tabular-nums', resultado.tipo === 'faltan' ? 'text-app-danger' : 'text-app-ink'].join(' ')}>{aprox ? '≈ ' : ''}{fmt.numero(resultado.monto)}</span>
        ) : null}
        {resultado.tipo === 'faltan' ? <Badge tono="error" className="col-start-2 row-start-1 -mb-1 self-start">Falta</Badge> : resultado.tipo === 'sobran' ? <Badge tono="success" className="col-start-2 row-start-1 -mb-1 self-start">Alcanza</Badge> : null}
      </div>
      {proyeccion ? <ProyeccionSemana serie={proyeccion.serie} etiquetas={proyeccion.etiquetas} etiquetaCruce={proyeccion.etiquetaCruce} titulo={`Proyección de la semana en ${nombre.toLowerCase()}`} /> : null}
      <span className="min-h-(--app-lh-caption) text-pretty text-caption text-app-ink-2 tabular-nums">{linea}</span>
      {enlace ? <Boton variante="link" onClick={enlace.onClick} className="self-start">{enlace.label}</Boton> : null}
      {accion ? <Boton variante="primary" tamano="large" onClick={accion.onClick} className="mt-1 self-start">{accion.label}</Boton> : null}
    </article>
  );
};
