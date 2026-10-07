'use client';
import { useId, type FC } from 'react';
import * as fmt from '@/lib/format';
import type { Accion } from '@/state/estado';
import type { VistaTipoDeCambio } from '@/state/vistas';
import { Badge } from './ui/Badge';
import { Boton } from './ui/Boton';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { CampoSelector, CampoTexto, OpcionLista, TituloGrupo } from './ui/Campo';
import { TendenciaDia } from './Graficas';

export interface TarjetaTipoDeCambioProps extends VistaTipoDeCambio {
  tour?: string;
  onPar?: (par: string) => void;
  onAbrirSelector?: (abierto: boolean) => void;
  /** Despliega o pliega "Operar con este par". */
  onPlegar?: (abierto: boolean) => void;
  onMonto?: (lado: 'recibe' | 'pagas', valor: string) => void;
  onEditando?: (lado: 'recibe' | 'pagas' | null) => void;
  onInvertir?: () => void;
  onContinuar?: () => void;
}

/** Acciones del cotizador sobre el reducer (C-53). */
export const accionesCotizador = (dispatch: (a: Accion) => void): Pick<TarjetaTipoDeCambioProps, 'onPar' | 'onAbrirSelector' | 'onPlegar' | 'onMonto' | 'onEditando' | 'onInvertir' | 'onContinuar'> => ({
  onPar: (par) => dispatch({ tipo: 'cotPar', par }),
  onAbrirSelector: (abierto) => dispatch({ tipo: 'cotParAbierto', abierto }),
  onPlegar: (abierto) => dispatch({ tipo: 'cotAbierto', abierto }),
  onMonto: (lado, valor) => dispatch({ tipo: 'cotMonto', lado, valor }),
  onEditando: (lado) => dispatch({ tipo: 'cotEditando', lado }),
  onInvertir: () => dispatch({ tipo: 'cotInvertir' }),
  onContinuar: () => dispatch({ tipo: 'cotContinuar' }),
});

/**
 * Borde 1 px #E2E4E9, sin sombra. Lo primero que miran: el par elegido con sus dos lados y la tendencia del día; debajo, los demás pares de
 * "Tus pares" en una línea. Al pie, el cotizador (C-53): el flujo de pago empezando por el precio, abierto al entrar y plegable.
 */
export const TarjetaTipoDeCambio: FC<TarjetaTipoDeCambioProps> = ({ par, compra, venta, tendencia, hora, enVivo, pausado, selector, otros, cotizador: c, tour, onPar, onAbrirSelector, onPlegar, onMonto, onEditando, onInvertir, onContinuar }) => {
  const base = par.split('/')[0];
  const idCotizador = useId();
  const campo = (lado: 'recibe' | 'pagas') => {
    const v = lado === 'recibe' ? c.recibe : c.pagas;
    return (
      <CampoTexto
        etiqueta={lado === 'recibe' ? 'Recibes' : 'Pagas'}
        monto
        inputMode="decimal"
        placeholder="0.00"
        valor={v.valor}
        sufijo={v.divisa}
        onCambiar={(t) => onMonto?.(lado, t)}
        onFocus={() => onEditando?.(lado)}
        onBlur={() => onEditando?.(null)}
        error={lado === 'pagas' ? c.error : null}
      />
    );
  };
  return (
    <section data-component="TarjetaTipoDeCambio" data-tour={tour} aria-labelledby="tdc-titulo" className="flex flex-col gap-3 rounded-sm border border-app-divider bg-app-surface p-4">
      <div className="flex items-center justify-between">
        <h2 id="tdc-titulo" className="text-h3 font-semibold">Tipo de cambio</h2>
        {pausado ? <Badge tono="neutral">En pausa</Badge> : enVivo ? <Badge tono="success">En vivo</Badge> : <Badge tono="neutral">Congelado</Badge>}
      </div>
      <CampoSelector etiqueta="Par" etiquetaOculta valor={par} placeholder="Elige un par" fuerte abierto={selector.abierto} onAbrir={(ab) => onAbrirSelector?.(ab)}>
        {selector.grupos.map((g) => (
          <div key={g.titulo} className="contents">
            <TituloGrupo>{g.titulo}</TituloGrupo>
            {g.items.map((i) => (
              <OpcionLista key={i.par} seleccionada={i.seleccionado} onElegir={() => onPar?.(i.par)}>
                <span className="text-body font-semibold">{i.par}</span>
              </OpcionLista>
            ))}
          </div>
        ))}
      </CampoSelector>
      <dl className="flex flex-col gap-1.5 tabular-nums">
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para comprar {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(compra)}</dd></div>
        <div className="flex items-baseline justify-between gap-2"><dt className="text-body text-app-ink-2">Para vender {base}</dt><dd className="text-body-lg font-semibold">{fmt.tdc(venta)}</dd></div>
      </dl>
      {tendencia.length ? (
        <>
          <TendenciaDia serie={tendencia} titulo={`Tendencia del día de ${par}`} />
          <div className="flex justify-between text-caption text-app-ink-2"><span>Tendencia del día</span><span>{hora}</span></div>
        </>
      ) : null}
      {otros.map((o) => (
        <dl key={o.par} className="flex items-baseline justify-between gap-3 border-t border-app-divider pt-2.5 tabular-nums">
          <dt className="text-body font-semibold">{o.par}</dt>
          <dd className="text-caption text-app-ink-2"><span className="sr-only">Para </span>comprar {o.base} <span className="font-semibold text-app-ink">{fmt.tdc(o.compra)}</span> · vender {o.base} <span className="font-semibold text-app-ink">{fmt.tdc(o.venta)}</span></dd>
        </dl>
      ))}
      <div data-component="Cotizador" className="flex flex-col border-t border-app-divider pt-2.5">
        <button type="button" aria-expanded={c.abierto} aria-controls={idCotizador} onClick={() => onPlegar?.(!c.abierto)} className="flex cursor-pointer items-center justify-between gap-2 rounded-xs bg-transparent py-1 text-left text-body font-semibold">
          Operar con este par
          <Icono nombre={c.abierto ? 'angle-up-b' : 'angle-down-b'} tamano="sm" className="text-app-ink-2" />
        </button>
        {c.abierto ? (
          <div id={idCotizador} className="flex flex-col gap-3 pt-2">
            {campo('recibe')}
            <div className="-my-1.5 flex justify-center">
              <button type="button" onClick={onInvertir} disabled={!c.invertir} aria-label="Invertir el sentido" className="flex size-(--app-close-btn) cursor-pointer items-center justify-center rounded-full border border-app-divider bg-app-surface text-app-primary hover:bg-app-accent-bg disabled:cursor-not-allowed disabled:text-app-ink-disabled disabled:hover:bg-app-surface">
                <Icono nombre="arrows-v-alt" tamano="sm" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {campo('pagas')}
              {c.desde ? <span className="text-caption text-app-ink-2 tabular-nums">{c.desde}</span> : null}
            </div>
            {c.mercadoCerrado ? <Alerta tono="warning" titulo={c.mercadoCerrado.titulo}>{c.mercadoCerrado.texto}</Alerta> : null}
            <Boton variante="primary" tamano="large" className="w-full" disabled={!c.continuar} onClick={onContinuar}>Continuar</Boton>
          </div>
        ) : null}
      </div>
    </section>
  );
};
