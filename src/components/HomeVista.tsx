'use client';
import { useMemo, useState, type FC, type RefObject } from 'react';
import * as fmt from '@/lib/format';
import { cotizar } from '@/lib/fx';
import { HOY, MOTIVOS, empresa } from '@/data/escenario-importadora';
import { ONBOARDING_PASOS, type Accion, type EstadoApp } from '@/state/estado';
import { vistaHome, vistaOperar, vistaPanel, type VistaPanel } from '@/state/vistas';
import { AppShell, type ModoShell } from './AppShell';
import { AvisoResultado } from './AvisoResultado';
import { TarjetaPosicion } from './TarjetaPosicion';
import { FranjaNuevo } from './FranjaNuevo';
import { ListaMovimientos } from './FilaMovimiento';
import { TarjetaTipoDeCambio } from './TarjetaTipoDeCambio';
import { ModuloCuentas } from './ModuloCuentas';
import { AvisoVistaAnterior } from './AvisoVistaAnterior';
import { FormularioOperar } from './FormularioOperar';
import { PanelOperar } from './PanelOperar';
import { GrupoOrigen } from './OpcionOrigen';
import { BloqueMonto } from './BloqueMonto';
import { FechaLiquidacion } from './FechaLiquidacion';
import { CajaTdcValiu } from './CajaTdcValiu';
import { PrecioEjecutable } from './PrecioEjecutable';
import { CampoToken } from './CampoToken';
import { Confirmacion } from './Confirmacion';
import { PasoOnboarding, PASOS_ONBOARDING } from './PasoOnboarding';
import { Boton } from './ui/Boton';
import { Pestanas } from './ui/Pestanas';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { CampoSelector, CampoTexto, OpcionLista } from './ui/Campo';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (d: Date) => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;

export interface HomeVistaProps {
  estado: EstadoApp;
  dispatch: (a: Accion) => void;
  modo?: ModoShell;
  raizRef: RefObject<HTMLDivElement | null>;
}

/** El home completo como función del estado: lo usan la app (/) y el tablero (/tablero). */
export const HomeVista: FC<HomeVistaProps> = ({ estado, dispatch, modo = 'app', raizRef }) => {
  const home = useMemo(() => vistaHome(estado), [estado]);
  const panel = useMemo(() => vistaPanel(estado), [estado]);
  const operar = useMemo(() => vistaOperar(estado), [estado]);
  const [verTotal, setVerTotal] = useState(false);

  const abrirPrimerPago = () => { if (home.nuevo.orden) dispatch({ tipo: 'abrirPanel', orden: home.nuevo.orden }); };
  const totalMXN = home.posiciones.reduce((acc, p) => acc + (p.divisa === 'MXN' ? p.saldo : (cotizar(p.divisa, 'MXN', p.saldo, 'origen')?.recibe ?? 0)), 0);

  const paso = estado.onboarding.activo ? PASOS_ONBOARDING[estado.onboarding.paso] : null;

  return (
    <AppShell
      modo={modo}
      raizRef={raizRef}
      capas={
        <>
          {panel ? <PanelContenido vista={panel} estado={estado} dispatch={dispatch} modo={modo} /> : null}
          {paso ? (
            <PasoOnboarding
              paso={estado.onboarding.paso}
              total={ONBOARDING_PASOS}
              objetivo={paso.objetivo}
              lado={paso.lado}
              titulo={paso.titulo}
              texto={paso.texto}
              onSiguiente={() => dispatch({ tipo: 'onboardingSiguiente' })}
              onAtras={() => dispatch({ tipo: 'onboardingAtras' })}
              onCerrar={() => dispatch({ tipo: 'onboardingCerrar' })}
              contenedorRef={raizRef}
              modo={modo}
            />
          ) : null}
        </>
      }
    >
      {estado.aviso && estado.pestana === 'posicion' ? <AvisoResultado tipo={estado.aviso.tipo} texto={estado.aviso.texto} onCerrar={() => dispatch({ tipo: 'cerrarAviso' })} /> : null}

      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-h1 font-bold">Inicio</h1>
          <span className="text-body text-app-ink-2">{empresa} · {fechaLarga(HOY)}</span>
        </div>
        <div className="flex gap-3">
          <Boton variante="secondary" tamano="large">Subir documento</Boton>
          <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirPanel', orden: null })}>Pagar</Boton>
        </div>
      </div>

      <Pestanas
        etiqueta="Vistas del inicio"
        pestanas={[{ id: 'posicion', label: 'Posición consolidada' }, { id: 'operar', label: 'Operar clásico' }]}
        activa={estado.pestana}
        onCambiar={(id) => dispatch({ tipo: 'pestana', pestana: id })}
        tour={{ operar: 'clasico' }}
      />

      {estado.pestana === 'posicion' ? (
        <div className="flex flex-col gap-5">
          <section data-tour="posicion" aria-labelledby="posicion-titulo" className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <h2 id="posicion-titulo" className="text-h3 font-semibold">Posición por divisa</h2>
              <Boton variante="link-caption" aria-pressed={verTotal} onClick={() => setVerTotal((v) => !v)}>{verTotal ? 'Ocultar total en MXN' : 'Ver total en MXN'}</Boton>
            </div>
            {verTotal ? <span className="text-body text-app-ink-2 tabular-nums">Total de tus posiciones ≈ <span className="font-semibold text-app-ink">{fmt.monto(totalMXN, 'MXN')}</span> a precio de venta</span> : null}
            <div className="grid grid-cols-3 gap-6 @max-md/shell:grid-cols-1">
              {home.posiciones.map((p) => (
                <TarjetaPosicion
                  key={p.id}
                  divisa={p.divisa}
                  nombre={p.nombre}
                  saldo={p.saldo}
                  pactadas={p.pactadas}
                  pagosFuturos={p.pagosFuturos}
                  resultado={p.resultado}
                  proyeccion={p.proyeccion}
                  linea={p.linea}
                  accion={p.accion ? { label: p.accion.label, onClick: () => dispatch({ tipo: 'abrirPanel', orden: p.accion!.orden }) } : null}
                />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-3 items-start gap-6 @max-md/shell:grid-cols-1">
            <div className="col-span-2 flex min-w-0 flex-col gap-5 @max-md/shell:col-span-1">
              <section aria-labelledby="nuevo-titulo" className="flex flex-col gap-2">
                <h2 id="nuevo-titulo" className="text-h3 font-semibold">Lo nuevo</h2>
                <FranjaNuevo monto={home.nuevo.monto} divisa={home.nuevo.divisa} origen={home.nuevo.de} meta={home.nuevo.meta} onUsar={home.nuevo.orden ? abrirPrimerPago : undefined} />
              </section>
              <ListaMovimientos
                tour="movimientos"
                proximos={home.proximos.map((p) => ({ fecha: p.fecha, nombre: p.nombre, detalle: p.detalle, monto: p.monto, divisa: p.divisa, estado: p.badge, onPagar: p.orden ? () => dispatch({ tipo: 'abrirPanel', orden: p.orden! }) : undefined }))}
                realizados={home.realizados.map((r) => ({ fecha: r.fecha, nombre: r.nombre, detalle: r.detalle, monto: r.monto, divisa: r.divisa, estado: r.badge }))}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <TarjetaTipoDeCambio tour="tdc" {...home.tdc} />
              <ModuloCuentas cuentas={home.cuentas} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {estado.avisoOperar ? <AvisoResultado tipo={estado.avisoOperar.tipo} texto={estado.avisoOperar.texto} onCerrar={() => dispatch({ tipo: 'cerrarAvisoOperar' })} /> : null}
          <AvisoVistaAnterior onProbar={abrirPrimerPago} />
          <div className="flex items-center justify-between gap-4">
            <span className="text-body text-app-ink-2">¿Qué quieres hacer hoy?</span>
            <div className="flex gap-5">
              <Boton variante="link-caption">Horarios de operación</Boton>
              <Boton variante="link-caption">Operaciones recientes</Boton>
            </div>
          </div>
          <div className="grid grid-cols-3 items-start gap-6 @max-md/shell:grid-cols-1">
            <div className="col-span-2 min-w-0 @max-md/shell:col-span-1"><FormularioOperar vista={operar} dispatch={dispatch} /></div>
            <ModuloCuentas cuentas={home.cuentas} className="self-start" />
          </div>
        </div>
      )}
    </AppShell>
  );
};

const PanelContenido: FC<{ vista: VistaPanel; estado: EstadoApp; dispatch: (a: Accion) => void; modo: ModoShell }> = ({ vista: v, estado, dispatch, modo }) => {
  const [conceptoAbierto, setConceptoAbierto] = useState(false);
  const cerrar = () => dispatch(v.paso === 'confirmacion' ? { tipo: 'volverInicio' } : { tipo: 'cerrarPanel' });
  const primario = () => {
    if (!v.primario.habilitado) return;
    switch (v.primario.accion) {
      case 'continuar': dispatch({ tipo: 'irPaso', paso: 'revision' }); break;
      case 'pedirPrecio': dispatch({ tipo: 'pedirPrecio' }); break;
      case 'confirmar': dispatch({ tipo: 'confirmar' }); break;
      case 'volverInicio': dispatch({ tipo: 'volverInicio' }); break;
    }
  };
  const secundario = v.secundario
    ? { label: v.secundario.label, onClick: () => { if (v.secundario?.accion === 'volver') dispatch({ tipo: 'irPaso', paso: 'origen' }); else if (v.secundario?.accion === 'cancelar') dispatch({ tipo: 'cerrarPanel' }); } }
    : null;
  const esCompra = estado.panel.orden?.tipo === 'compra';

  return (
    <PanelOperar titulo={v.titulo} sub={v.sub} primario={{ label: v.primario.label, habilitado: v.primario.habilitado, onClick: primario }} secundario={secundario} onCerrar={cerrar} modo={modo}>
      {v.paso === 'destinatario' ? (
        <>
          <h3 className="text-h3 font-semibold">¿A quién le pagas?</h3>
          <span className="text-caption text-app-ink-2">Elige un pago cargado. Pagar a un destinatario nuevo desde aquí está en diseño.</span>
          <div role="listbox" aria-label="Pagos cargados" className="flex flex-col gap-0.5">
            {v.ordenes.map((o) => (
              <OpcionLista key={o.orden.id} alta onElegir={() => dispatch({ tipo: 'elegirOrden', orden: o.orden })}>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col"><span className="truncate text-body font-semibold">{o.orden.destinatario}</span><span className="text-caption text-app-ink-2">vence {o.fecha} · {o.orden.referencia}</span></span>
                  <span className="text-body font-semibold tabular-nums">{o.monto}</span>
                </span>
              </OpcionLista>
            ))}
          </div>
        </>
      ) : null}

      {v.paso === 'origen' ? (
        <>
          <h3 className="text-h3 font-semibold">¿Desde qué cuenta pagas?</h3>
          <GrupoOrigen opciones={v.origenes.map((o) => ({ id: o.id, cuenta: o.nombre, saldo: o.saldo, pagas: o.pagas, consecuencia: o.consecuencia, seleccionada: o.seleccionada }))} valor={estado.panel.origenId} onCambiar={(id) => dispatch({ tipo: 'elegirOrigen', origenId: id as 'mxn' | 'usd' | 'eur' })} />
        </>
      ) : null}

      {v.paso === 'revision' && v.revision ? (
        <>
          <BloqueMonto pagas={{ monto: v.revision.pagas, divisa: v.revision.pagasDivisa, enVivo: !v.sinTdc }} recibe={{ monto: v.revision.recibe, divisa: v.revision.recibeDivisa, fijo: true, destinatario: v.revision.destinatario }} />
          <FechaLiquidacion visible={v.revision.fechas.length > 0} opciones={v.revision.fechas} valor={estado.panel.fechaValor} onChange={(f) => dispatch({ tipo: 'fechaValor', fecha: f })} />
          <div className="flex flex-col gap-1.5">
            <p className="text-pretty text-body font-medium tabular-nums">{v.revision.texto}</p>
            {v.revision.ayuda ? <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" /><span>{v.revision.ayuda}</span></span> : null}
          </div>
          {v.revision.tdc != null ? <CajaTdcValiu tdc={v.revision.tdc} tipo="Precio indicativo" className="self-start" /> : null}
          <div className="grid grid-cols-2 gap-3">
            <CampoSelector etiqueta="Concepto" valor={v.revision.concepto} placeholder="Elige un concepto" abierto={conceptoAbierto} onAbrir={setConceptoAbierto}>
              {MOTIVOS.map((m) => (
                <OpcionLista key={m} seleccionada={m === v.revision!.concepto} onElegir={() => { dispatch({ tipo: 'concepto', concepto: m }); setConceptoAbierto(false); }}><span className="text-body">{m}</span></OpcionLista>
              ))}
            </CampoSelector>
            <CampoTexto etiqueta="Referencia" valor={v.revision.referencia} onCambiar={(t) => dispatch({ tipo: 'referencia', referencia: t })} />
          </div>
          <span className="text-body text-app-ink-2 tabular-nums">{v.revision.saldoDespues}</span>
          {!v.sinTdc ? <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" />Ten tu token a mano: el precio dura 2 minutos.</span> : null}
        </>
      ) : null}

      {v.paso === 'precio' && v.precio ? (
        <>
          {v.precio.estado === 'vencido' ? <Alerta tono="error" role="alert" titulo="El precio venció. Pide uno nuevo.">El precio fijo dura 2 minutos. Los montos volvieron al indicativo.</Alerta> : null}
          <PrecioEjecutable {...v.precio} />
          <CampoToken valor={v.precio.token} habilitado={v.precio.tokenHabilitado} onChange={(t) => dispatch({ tipo: 'token', token: t })} autoFoco={modo === 'app'} />
        </>
      ) : null}

      {v.paso === 'confirmacion' && v.confirmacion ? <Confirmacion {...v.confirmacion} esCompra={esCompra} /> : null}
    </PanelOperar>
  );
};
