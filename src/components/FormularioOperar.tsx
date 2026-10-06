'use client';
import type { FC } from 'react';
import type { Divisa } from '@/lib/fx';
import type { VistaOperar } from '@/state/vistas';
import type { Accion } from '@/state/estado';
import { Pestanas } from './ui/Pestanas';
import { Badge } from './ui/Badge';
import { Alerta } from './ui/Alerta';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';
import { ChipDivisa } from './ui/ChipDivisa';
import { CampoSelector, CampoTexto, Etiqueta, MensajeError, OpcionLista, TituloGrupo } from './ui/Campo';
import { CajaTdcValiu } from './CajaTdcValiu';
import { CampoToken } from './CampoToken';

export interface FormularioOperarProps {
  vista: VistaOperar;
  dispatch: (a: Accion) => void;
}

/** Split Compras / Pagas: lado activo con borde 1.5 px #0086FF, error 1 px #B40909 con mensaje inline. */
const CampoMontoDoble: FC<{ v: VistaOperar; dispatch: (a: Accion) => void }> = ({ v, dispatch }) => {
  const borde = v.error ? 'border border-app-danger' : v.ladoActivo ? 'border-(length:--app-border-split) border-app-accent' : 'hairline border-app-border-input focus-within:border-(length:--app-border-split) focus-within:border-app-accent';
  const lado = (cual: 'izq' | 'der', valor: string, divisa: Divisa, etiqueta: string) => (
    <label className={['flex min-w-0 flex-1 basis-0 items-center justify-between gap-2 px-3', cual === 'izq' ? 'border-r border-app-divider' : ''].join(' ')}>
      <span className="sr-only">{etiqueta}</span>
      <input
        inputMode="decimal"
        placeholder="0.00"
        value={valor}
        onChange={(e) => dispatch({ tipo: 'opMonto', lado: cual, valor: e.target.value })}
        onFocus={() => dispatch({ tipo: 'opMontoEditando', lado: cual })}
        onBlur={() => dispatch({ tipo: 'opMontoEditando', lado: null })}
        aria-invalid={v.error ? true : undefined}
        aria-describedby={v.error ? 'monto-error' : undefined}
        className="min-w-0 flex-1 bg-transparent text-body-lg font-semibold tabular-nums outline-none placeholder:text-app-ink-3"
      />
      <span className="text-overline font-semibold tracking-overline text-app-currency">{divisa}</span>
    </label>
  );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2">
        <Etiqueta>{v.labelIzq}</Etiqueta>
        <Etiqueta><span className="pl-3">{v.labelDer}</span></Etiqueta>
      </div>
      <div data-component="CampoMontoDoble" className={['flex min-h-(--app-input-h) overflow-hidden rounded-sm bg-app-surface tabular-nums', borde].join(' ')}>
        {lado('izq', v.montoIzq, v.divIzq, v.labelIzq)}
        {lado('der', v.montoDer, v.divDer, v.labelDer)}
      </div>
      {v.error ? <MensajeError id="monto-error">{v.error}</MensajeError> : null}
    </div>
  );
};

/** El formulario Operar del producto actual llevado al DS: tabs, par, montos, origen/destino, motivo, cotización, un solo CTA. */
export const FormularioOperar: FC<FormularioOperarProps> = ({ vista: v, dispatch }) => {
  const onCta = () => {
    if (!v.cta.habilitado) return;
    if (v.cta.accion === 'pedirPrecio') dispatch({ tipo: 'opPedirPrecio' });
    else if (v.cta.accion === 'continuar') dispatch({ tipo: 'opContinuar' });
    else if (v.cta.accion === 'confirmar') dispatch({ tipo: 'opConfirmar' });
  };
  return (
    <section data-component="FormularioOperar" aria-label="Operar" className="flex flex-col rounded-sm bg-app-surface shadow-mid">
      <Pestanas etiqueta="Tipo de operación" llenas pestanas={v.tabs.map((t) => ({ id: t.id, label: t.label }))} activa={v.tipo} onCambiar={(id) => dispatch({ tipo: 'opTipo', valor: id })} />
      <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
        {v.cerrado ? (
          <Alerta tono="warning" titulo="Mercado cerrado. Abre mañana a las 6:30." extra={<Badge tono="neutral" futuro className="self-center">Programar · Futuro</Badge>} className="items-center">
            Operas de lunes a viernes de 6:30 a 16:30, hora de CDMX. Puedes dejar el formulario listo.
          </Alerta>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-body font-semibold text-app-ink-2">{v.subtitulo}</span>
          <Badge tono={v.mercado.tono}>{v.mercado.texto}</Badge>
        </div>

        {v.esCambio ? (
          <div className="grid grid-cols-[var(--app-par-col-w)_minmax(0,1fr)] gap-4">
            <CampoSelector etiqueta="Elige un par" valor={v.par.valor} placeholder="Elige un par" fuerte abierto={v.par.abierto} onAbrir={(ab) => dispatch({ tipo: 'opParAbierto', abierto: ab })} anchoLista="ancho">
              <div data-component="SelectorPar" className="contents">
                {v.par.grupos.map((g) => (
                  <div key={g.titulo} className="contents">
                    <TituloGrupo>{g.titulo}</TituloGrupo>
                    {g.items.map((it) => (
                      <OpcionLista key={it.par} seleccionada={it.seleccionado} onElegir={() => dispatch({ tipo: 'opPar', par: it.par })}>
                        <span className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-body font-semibold">{it.par}</span>
                          <span className="text-caption text-app-ink-2">{it.nombre}</span>
                        </span>
                      </OpcionLista>
                    ))}
                  </div>
                ))}
              </div>
            </CampoSelector>
            <CampoMontoDoble v={v} dispatch={dispatch} />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <CampoSelector etiqueta="Origen" valor={v.origen.valor} placeholder="Elige una cuenta" abierto={v.origen.abierto} onAbrir={(ab) => dispatch({ tipo: 'opOrigenAbierto', abierto: ab })}>
            {v.origen.opciones.length ? v.origen.opciones.map((o) => (
              <OpcionLista key={o.id} alta seleccionada={o.seleccionado} onElegir={() => dispatch({ tipo: 'opOrigen', origenId: o.id })}>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body font-semibold">{o.nombre}</span><span className="text-caption text-app-ink-2 tabular-nums">{o.sub}</span></span>
              </OpcionLista>
            )) : <span className="px-2 py-2 text-caption text-app-ink-2">No tienes cuentas en esta divisa.</span>}
          </CampoSelector>
          <CampoSelector
            etiqueta="Destino"
            valor={v.destino.valor}
            placeholder="Elige una cuenta"
            abierto={v.destino.abierto}
            onAbrir={(ab) => dispatch({ tipo: 'opDestinoAbierto', abierto: ab })}
            busqueda={{ texto: v.destino.busqueda, onCambiar: (t) => dispatch({ tipo: 'opDestinoBusqueda', texto: t }), placeholder: 'Busca una cuenta o destinatario' }}
          >
            <div data-component="SelectorDestino" className="contents">
              {v.destino.grupos.length ? v.destino.grupos.map((g) => (
                <div key={g.titulo} className="contents">
                  <TituloGrupo>{g.titulo}</TituloGrupo>
                  {g.items.map((d) => (
                    <OpcionLista key={d.id} alta seleccionada={d.seleccionado} onElegir={() => dispatch({ tipo: 'opDestino', destinoId: d.id })}>
                      <ChipDivisa divisa={d.divisa} chico />
                      <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body font-semibold">{d.nombre}</span><span className="text-caption text-app-ink-2 tabular-nums">{d.sub}</span></span>
                    </OpcionLista>
                  ))}
                </div>
              )) : <span className="px-2 py-2 text-caption text-app-ink-2">{v.tipo === 'transferir' && !v.origen.valor ? 'Primero elige la cuenta de origen.' : 'Sin resultados.'}</span>}
              <button type="button" className="mt-1 flex cursor-pointer items-center gap-2 border-t border-app-divider bg-transparent px-2 pb-1 pt-2.5 text-caption font-semibold text-app-primary">
                <Icono nombre="plus" tamano="sm" />Agregar destinatario
              </button>
            </div>
          </CampoSelector>
        </div>

        {!v.esCambio ? (
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto etiqueta="Monto" monto valor={v.montoIzq} onCambiar={(t) => dispatch({ tipo: 'opMonto', lado: 'izq', valor: t })} onFocus={() => dispatch({ tipo: 'opMontoEditando', lado: 'izq' })} onBlur={() => dispatch({ tipo: 'opMontoEditando', lado: null })} placeholder="0.00" inputMode="decimal" sufijo={v.divIzq} error={v.error} />
            <div className="flex flex-col gap-1.5">
              <Etiqueta>Disponible en origen</Etiqueta>
              <span className="flex min-h-(--app-input-h) items-center text-body text-app-ink-2 tabular-nums">{v.disponible}</span>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <CampoSelector etiqueta="Motivo de pago" valor={v.motivo.valor} placeholder="Elige un motivo" abierto={v.motivo.abierto} onAbrir={(ab) => dispatch({ tipo: 'opMotivoAbierto', abierto: ab })}>
            {v.motivo.opciones.map((m) => (
              <OpcionLista key={m} seleccionada={m === v.motivo.valor} onElegir={() => dispatch({ tipo: 'opMotivo', motivo: m })}><span className="text-body">{m}</span></OpcionLista>
            ))}
          </CampoSelector>
          <CampoTexto etiqueta="Referencia" opcional valor={v.referencia} onCambiar={(t) => dispatch({ tipo: 'opReferencia', referencia: t })} placeholder="Ej. Factura 0457" />
        </div>

        {v.vencido ? (
          <Alerta tono="error" titulo="El precio venció. Pide uno nuevo." role="alert">El precio fijo dura 2 minutos. Los montos volvieron al indicativo.</Alerta>
        ) : null}

        <div data-component="Cotizacion" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-caption font-bold text-app-ink-label">{v.cotizacion.titulo}</span>
            <Badge tono={v.cotizacion.badge.tono} aria-live="polite">{v.cotizacion.badge.texto}</Badge>
          </div>
          <div className="flex items-stretch">
            <div className={['flex flex-1 items-center justify-between gap-4 bg-app-canvas px-4 py-2.5 tabular-nums', v.cotizacion.tdc ? 'rounded-l-sm' : 'rounded-sm'].join(' ')}>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption text-app-ink-2">{v.cotizacion.izqLabel}</span>
                <span className={['text-body-lg font-semibold', v.cotizacion.vacio ? 'text-app-ink-3' : v.vencido ? 'text-app-ink-2' : 'text-app-ink'].join(' ')}>{v.cotizacion.izq}</span>
              </div>
              <Icono nombre="arrow-right" tamano="md" className="text-app-ink-2" />
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-caption text-app-ink-2">{v.cotizacion.derLabel}</span>
                <span className={['text-body-lg font-semibold', v.cotizacion.vacio ? 'text-app-ink-3' : v.vencido ? 'text-app-ink-2' : 'text-app-ink'].join(' ')}>{v.cotizacion.der}</span>
              </div>
            </div>
            {v.cotizacion.tdc ? <CajaTdcValiu pegada tdc={v.cotizacion.tdc.valor} tipo={v.cotizacion.tdc.tipo} apagada={v.cotizacion.tdc.apagado} /> : null}
          </div>
          {v.cotizacion.notaTransfer ? <span className="text-caption text-app-ink-2">Misma divisa en origen y destino: no hay tipo de cambio ni precio que fijar.</span> : null}
        </div>

        {v.token.visible ? (
          <div className="flex items-end justify-between gap-4 border-t border-app-divider pt-4">
            <CampoToken ancho="formulario" valor={v.token.valor} habilitado onChange={(t) => dispatch({ tipo: 'opToken', token: t })} autoFoco />
            <div className="flex items-center gap-4">
              <Boton variante="link" className="font-bold" onClick={() => dispatch({ tipo: 'opCancelar' })}>Cancelar</Boton>
              <Boton variante="primary" tamano="mid" onClick={onCta} disabled={!v.cta.habilitado}>{v.cta.label}</Boton>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" />{v.nota}</span>
            <Boton variante="primary" tamano="mid" onClick={onCta} disabled={!v.cta.habilitado}>{v.cta.label}</Boton>
          </div>
        )}
      </div>
    </section>
  );
};
