'use client';
import { useMemo, useState, type FC, type RefObject } from 'react';
import * as fmt from '@/lib/format';
import { AVISO_FUERA_DEL_PROTOTIPO, HOY, type CuentaId } from '@/data/escenario';
import { ONBOARDING_PASOS, type Accion, type EstadoApp } from '@/state/estado';
import { vistaControl, vistaDestinatarios, vistaHome, vistaMonitoreo, vistaOperar, vistaPanel, type VistaFila, type VistaPanel } from '@/state/vistas';
import { notificaciones } from '@/state/derivados';
import { SeccionControl, SeccionDestinatarios, SeccionMonitoreo } from './Secciones';
import { FormularioDestinatario, ListaCuentas, ListaNotificaciones } from './PanelExtras';
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
import { GrupoOrigen, GrupoPago } from './OpcionOrigen';
import { BloqueMonto } from './BloqueMonto';
import { FechaLiquidacion } from './FechaLiquidacion';
import { CajaTdcValiu } from './CajaTdcValiu';
import { PrecioEjecutable } from './PrecioEjecutable';
import { CampoToken } from './CampoToken';
import { Confirmacion } from './Confirmacion';
import { DetalleMovimiento } from './DetalleMovimiento';
import { AgendarPago } from './AgendarPago';
import { SelectorDestino } from './SelectorDestino';
import { PasoOnboarding, PASOS_ONBOARDING } from './PasoOnboarding';
import { Boton } from './ui/Boton';
import { Pestanas } from './ui/Pestanas';
import { Alerta } from './ui/Alerta';
import { Icono } from './ui/Icono';
import { Toast } from './ui/Toast';
import { CampoTexto, MensajeError } from './ui/Campo';
import { descargarComprobante, htmlComprobante } from './comprobante';
import { arquetipoDe } from '@/data/arquetipos';
import { ListaDetalle } from './ui/ListaDetalle';

export interface HomeVistaProps {
  estado: EstadoApp;
  dispatch: (a: Accion) => void;
  modo?: ModoShell;
  raizRef: RefObject<HTMLDivElement | null>;
}

/** El inicio completo como función del estado: lo usan la app (/) y el tablero (/tablero/alta). */
export const HomeVista: FC<HomeVistaProps> = ({ estado, dispatch, modo = 'app', raizRef }) => {
  const home = useMemo(() => vistaHome(estado), [estado]);
  const panel = useMemo(() => vistaPanel(estado), [estado]);
  const operar = useMemo(() => vistaOperar(estado), [estado]);
  const [verTotal, setVerTotal] = useState(false);
  const noDisponible = () => dispatch({ tipo: 'toast', texto: AVISO_FUERA_DEL_PROTOTIPO });
  const paso = estado.onboarding.activo ? PASOS_ONBOARDING[estado.onboarding.paso] : null;
  const enMovimientos = estado.seccion === 'movimientos';
  const SECCIONES = ['inicio', 'movimientos', 'control', 'destinatarios', 'monitoreo'] as const;
  const indiceSeccion = SECCIONES.indexOf(estado.seccion);
  const avisos = useMemo(() => notificaciones(estado).length, [estado]);
  // Una fila de Movimientos: "Pagar" abre el flujo con el pago cargado; el resto de la fila abre su detalle.
  const fila = (f: VistaFila) => ({ fecha: f.fecha, nombre: f.nombre, detalle: f.detalle, monto: f.monto, divisa: f.divisa, estado: f.badge, onPagar: f.orden ? () => dispatch({ tipo: 'abrirPanel', orden: f.orden! }) : undefined, onAbrir: () => dispatch({ tipo: 'abrirDetalle', id: f.id }) });

  return (
    <>
      <AppShell
        modo={modo}
        raizRef={raizRef}
        activo={indiceSeccion}
        onNoDisponible={noDisponible}
        onNavegar={(i) => dispatch({ tipo: 'seccion', seccion: SECCIONES[i] ?? 'inicio' })}
        campana={{ cantidad: avisos, onClick: () => dispatch({ tipo: 'abrirNotificaciones' }) }}
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
        {estado.aviso && (estado.seccion !== 'inicio' || estado.pestana === 'posicion') ? <AvisoResultado tipo={estado.aviso.tipo} texto={estado.aviso.texto} onCerrar={() => dispatch({ tipo: 'cerrarAviso' })} /> : null}

        {estado.seccion === 'control' || estado.seccion === 'destinatarios' || estado.seccion === 'monitoreo' ? (
          <SeccionGenerica estado={estado} dispatch={dispatch} home={home} noDisponible={noDisponible} />
        ) : enMovimientos ? (
          <>
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-h1 font-bold">Movimientos</h1>
                <span className="text-body text-app-ink-2">{home.empresa} · {fmt.fechaLarga(HOY)}</span>
              </div>
              <div className="flex gap-3">
                <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirAgendar' })}>Agendar un pago</Boton>
                <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirPanel', orden: null })}>Pagar</Boton>
              </div>
            </div>
            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 flex min-w-0 flex-col gap-5">
                <ListaMovimientos modo="completa" resumen={home.resumenProximos} totalProximos={home.totalProximos} verTodos proximos={home.proximosTodos.map(fila)} realizados={home.realizados.map(fila)} />
              </div>
              <div className="flex min-w-0 flex-col gap-5">
                <TarjetaTipoDeCambio {...home.tdc} />
                <ModuloCuentas cuentas={home.cuentas} onVerTodas={() => dispatch({ tipo: 'abrirCuentas' })} />
              </div>
            </div>
          </>
        ) : (
        <>
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-h1 font-bold">Inicio</h1>
            <span className="text-body text-app-ink-2">{home.empresa} · {fmt.fechaLarga(HOY)}</span>
          </div>
          <div className="flex gap-3">
            <Boton variante="secondary" tamano="large" onClick={noDisponible}>Subir documento</Boton>
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
              {verTotal ? <span className="text-body text-app-ink-2 tabular-nums">Total de tus posiciones ≈ <span className="font-semibold text-app-ink">{fmt.monto(home.totalMXN, 'MXN')}</span> a precio de venta</span> : null}
              <div className="grid grid-cols-3 gap-6">
                {home.posiciones.map((p) => (
                  <TarjetaPosicion
                    key={p.id}
                    divisa={p.divisa}
                    nombre={p.nombre}
                    saldo={p.saldo}
                    pactadasRecibir={p.pactadasRecibir}
                    pactadasLiquidar={p.pactadasLiquidar}
                    pagosFuturos={p.pagosFuturos}
                    resultado={p.resultado}
                    proyeccion={p.proyeccion}
                    linea={p.linea}
                    accion={p.accion ? { label: p.accion.label, onClick: () => dispatch({ tipo: 'abrirPanel', orden: p.accion!.orden }) } : null}
                    enlace={p.enlace ? { label: p.enlace.label, onClick: () => dispatch({ tipo: 'abrirDepositar' }) } : null}
                  />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 flex min-w-0 flex-col gap-5">
                {home.nuevo ? (
                  <section aria-labelledby="nuevo-titulo" className="flex flex-col gap-2">
                    <h2 id="nuevo-titulo" className="text-h3 font-semibold">Lo nuevo</h2>
                    <FranjaNuevo monto={home.nuevo.monto} divisa={home.nuevo.divisa} origen={home.nuevo.de} meta={home.nuevo.meta} onComprobante={() => dispatch({ tipo: 'abrirDetalle', id: home.nuevo!.id })} onUsar={() => dispatch({ tipo: 'abrirCobro', cobroId: home.nuevo!.id })} />
                  </section>
                ) : null}
                <ListaMovimientos
                  tour="movimientos"
                  totalProximos={home.totalProximos}
                  verTodos={home.verTodos}
                  onVerTodos={(valor) => dispatch({ tipo: 'verTodosLosPagos', valor })}
                  onAgendar={() => dispatch({ tipo: 'abrirAgendar' })}
                  onVerMas={() => dispatch({ tipo: 'seccion', seccion: 'movimientos' })}
                  proximos={home.proximos.map(fila)}
                  realizados={home.realizados.map(fila)}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-5">
                <TarjetaTipoDeCambio tour="tdc" {...home.tdc} />
                <ModuloCuentas cuentas={home.cuentas} onVerTodas={() => dispatch({ tipo: 'abrirCuentas' })} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AvisoVistaAnterior onProbar={() => dispatch({ tipo: 'abrirPanel', orden: null })} />
            <div className="flex items-center justify-between gap-4">
              <span className="text-body text-app-ink-2">¿Qué quieres hacer hoy?</span>
              <div className="flex gap-5">
                <Boton variante="link-caption" onClick={noDisponible}>Horarios de operación</Boton>
                <Boton variante="link-caption" onClick={() => dispatch({ tipo: 'seccion', seccion: 'control' })}>Operaciones recientes</Boton>
              </div>
            </div>
            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 min-w-0"><FormularioOperar vista={operar} dispatch={dispatch} onNoDisponible={noDisponible} onAgregarDestinatario={() => dispatch({ tipo: 'abrirDestinatarioNuevo' })} onComprobante={(c) => descargarComprobante(`comprobante-${estado.operar.ultima?.id ?? 'operacion'}`, htmlComprobante({ titulo: c.titulo, sub: `${c.destino} · ${c.referencia || '—'}`, empresa: home.empresa, filas: c.detalle, nota: c.texto ?? c.fondeo }))} /></div>
              <ModuloCuentas cuentas={home.cuentas} onVerTodas={() => dispatch({ tipo: 'abrirCuentas' })} className="self-start" />
            </div>
          </div>
        )}
        </>
        )}
      </AppShell>
      {modo === 'app' ? <Toast texto={estado.toast?.texto ?? null} /> : null}
    </>
  );
};

const PanelContenido: FC<{ vista: VistaPanel; estado: EstadoApp; dispatch: (a: Accion) => void; modo: ModoShell }> = ({ vista: v, estado, dispatch, modo }) => {
  const noDisponible = () => dispatch({ tipo: 'toast', texto: AVISO_FUERA_DEL_PROTOTIPO });
  const empresa = arquetipoDe(estado.arquetipo).empresa;
  // "Descargar comprobante / confirmación": el archivo lleva las mismas filas que muestra el panel.
  const comprobante = () => {
    const c = v.confirmacion;
    const d = v.detalle;
    if (c) descargarComprobante(`comprobante-${estado.operaciones[0]?.id ?? 'operacion'}`, htmlComprobante({ titulo: c.titulo, sub: v.sub, empresa, filas: c.detalle, nota: c.texto ?? c.fondeo }));
    else if (d) descargarComprobante(`comprobante-${estado.panel.movimientoId ?? 'movimiento'}`, htmlComprobante({ titulo: d.titulo, sub: `${v.titulo} · ${v.sub}`, empresa, filas: d.filas, nota: d.texto }));
    else noDisponible();
  };
  const cerrar = () => dispatch(v.paso === 'confirmacion' ? { tipo: 'volverInicio' } : { tipo: 'cerrarPanel' });
  const pagar = () => { if (v.detalle?.orden) dispatch({ tipo: 'abrirPanel', orden: v.detalle.orden }); };
  const primario = () => {
    if (!v.primario.habilitado) return;
    switch (v.primario.accion) {
      case 'continuar': dispatch({ tipo: 'irPaso', paso: 'revision' }); break;
      case 'continuarPago': dispatch({ tipo: 'continuarPago' }); break;
      case 'pedirPrecio': dispatch({ tipo: 'pedirPrecio' }); break;
      case 'confirmar': dispatch({ tipo: 'confirmar' }); break;
      case 'volverInicio': dispatch({ tipo: 'volverInicio' }); break;
      case 'cerrar': dispatch({ tipo: 'cerrarPanel' }); break;
      case 'pagar': pagar(); break;
      case 'agendar': dispatch({ tipo: 'agendar' }); break;
      case 'confirmarCancelacion': dispatch({ tipo: 'confirmarCancelacion' }); break;
      case 'guardarDestinatario': dispatch({ tipo: 'guardarDestinatario' }); break;
    }
  };
  const secundario = v.secundario
    ? {
      label: v.secundario.label,
      onClick: () => {
        switch (v.secundario?.accion) {
          case 'volver': dispatch({ tipo: 'irPaso', paso: 'revision' }); break;
          case 'volverOrigen': dispatch({ tipo: 'irPaso', paso: 'origen' }); break;
          case 'volverDestino': dispatch({ tipo: 'irPaso', paso: 'destino' }); break;
          case 'cancelar': dispatch({ tipo: 'cerrarPanel' }); break;
          case 'volverPago': dispatch({ tipo: 'irPaso', paso: 'pago' }); break;
          case 'comprobante': comprobante(); break;
          case 'cancelarPactada': dispatch({ tipo: 'cancelarPactada' }); break;
          case 'pagar': pagar(); break;
        }
      },
    }
    : null;

  return (
    <PanelOperar titulo={v.titulo} sub={v.sub} primario={{ label: v.primario.label, habilitado: v.primario.habilitado, onClick: primario }} secundario={secundario} onCerrar={cerrar} modo={modo}>
      {v.depositar ? (
        <>
          <p className="text-body text-app-ink-2">Transfiere desde cualquier banco a esta cuenta. El dinero se acredita el mismo día hábil.</p>
          <ListaDetalle filas={[{ k: 'Cuenta', v: v.depositar.cuenta }, { k: 'Banco', v: v.depositar.banco }, { k: 'CLABE', v: v.depositar.clabe.replace(/(\d{4})(?=\d)/g, '$1 ') }]} />
          <Boton variante="secondary" tamano="large" className="self-start" onClick={() => { navigator.clipboard?.writeText(v.depositar!.clabe).then(() => dispatch({ tipo: 'toast', texto: 'CLABE copiada.' })).catch(() => dispatch({ tipo: 'toast', texto: 'No se pudo copiar la CLABE.' })); }}>Copiar CLABE</Boton>
        </>
      ) : null}

      {v.paso === 'destino' && v.destino ? (
        <>
          <h3 className="text-h3 font-semibold">{v.destino.titulo}</h3>
          <SelectorDestino modo="lista" grupos={v.destino.grupos} busqueda={v.destino.busqueda} onBusqueda={(t) => dispatch({ tipo: 'busquedaDestino', texto: t })} onElegir={(d) => dispatch(v.tipo === 'agendar' ? { tipo: 'agendaDestino', destino: d.destino } : { tipo: 'elegirDestino', destino: d.destino, pago: d.pago })} onAgregar={() => (v.tipo === 'agendar' ? noDisponible() : dispatch({ tipo: 'abrirDestinatarioNuevo' }))} />
        </>
      ) : null}

      {v.tipo === 'pago' && v.paso === 'pago' && v.pago ? (
        <>
          <h3 className="text-h3 font-semibold">{v.pago.titulo}</h3>
          <GrupoPago opciones={v.pago.opciones.map((o) => ({ id: o.id, destinatario: o.destinatario, monto: o.monto, linea: o.linea, consecuencia: o.consecuencia }))} valor={estado.panel.pagoElegidoId} onCambiar={(id) => dispatch({ tipo: 'elegirPago', pagoId: id })} />
          {v.pago.resto ? <span className="text-body text-app-ink-2 tabular-nums">{v.pago.resto}</span> : null}
          <Boton variante="link" className="self-start" onClick={() => dispatch({ tipo: 'otroDestinatario' })}>{v.pago.otro.label}</Boton>
        </>
      ) : null}

      {v.tipo === 'notificaciones' && v.notificaciones ? <ListaNotificaciones items={v.notificaciones} dispatch={dispatch} /> : null}
      {v.tipo === 'cuentas' && v.cuentas ? <ListaCuentas items={v.cuentas} dispatch={dispatch} /> : null}
      {v.tipo === 'destinatario' && v.destinatario ? <FormularioDestinatario vista={v.destinatario} dispatch={dispatch} /> : null}

      {v.tipo === 'detalle' && v.detalle ? <DetalleMovimiento vista={v.detalle} /> : null}
      {v.tipo === 'agendar' && v.paso === 'revision' && v.agenda ? <AgendarPago vista={v.agenda} dispatch={dispatch} /> : null}
      {v.tipo === 'agendar' && v.paso === 'confirmacion' && v.detalle ? <DetalleMovimiento vista={v.detalle} /> : null}

      {v.tipo === 'pago' && v.paso === 'origen' ? (
        <>
          <h3 className="text-h3 font-semibold">¿Desde qué cuenta pagas?</h3>
          <GrupoOrigen opciones={v.origenes.map((o) => ({ id: o.id, cuenta: o.nombre, saldo: o.saldo, pagas: o.pagas, consecuencia: o.consecuencia, deshabilitada: o.deshabilitada }))} valor={estado.panel.origenId} onCambiar={(id) => dispatch({ tipo: 'elegirOrigen', origenId: id as CuentaId })} />
        </>
      ) : null}

      {v.paso === 'revision' && v.revision ? (
        <>
          {v.mercadoCerrado ? <Alerta tono="warning" titulo="Mercado cerrado.">No se puede pedir precio hasta que abra. Puedes dejar el pago listo.</Alerta> : null}
          <BloqueMonto pagas={{ monto: v.revision.pagas, divisa: v.revision.pagasDivisa }} recibe={{ monto: v.revision.recibe, divisa: v.revision.recibeDivisa, destinatario: v.revision.destinatario }} ladoFijo={v.revision.ladoFijo} conTdc={!v.sinTdc} editable={v.revision.editable} onCambiar={(lado, valor) => dispatch({ tipo: 'monto', lado, valor })} />
          <FechaLiquidacion visible={v.revision.fechas.length > 0} opciones={v.revision.fechas} valor={estado.panel.fechaValor} onChange={(f) => dispatch({ tipo: 'fechaValor', fecha: f })} />
          <div className="flex flex-col gap-1.5">
            <p className="text-pretty text-body font-medium tabular-nums">{v.revision.texto}</p>
            {v.revision.ayuda ? <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" /><span>{v.revision.ayuda}</span></span> : null}
            {v.revision.error ? <MensajeError>{v.revision.error}</MensajeError> : null}
          </div>
          {v.revision.tdc != null ? <CajaTdcValiu sinBorde tdc={v.revision.tdc} tipo="Precio indicativo" className="self-start" /> : null}
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto etiqueta="Concepto" opcional valor={v.revision.concepto} onCambiar={(t) => dispatch({ tipo: 'motivo', motivo: t })} placeholder="Ej. Pago a proveedores" />
            <CampoTexto etiqueta="Referencia" opcional valor={v.revision.referencia} onCambiar={(t) => dispatch({ tipo: 'referencia', referencia: t })} placeholder="Ej. Factura 0457" />
          </div>
          <span className="text-body text-app-ink-2 tabular-nums">{v.revision.efecto}{v.revision.posVencimiento ? ` ${v.revision.posVencimiento}` : ''}</span>
          {!v.sinTdc ? <span className="flex items-center gap-2 text-caption text-app-ink-2"><Icono nombre="info-circle" tamano="xs" />Ten tu token a mano: el precio dura 2 minutos.</span> : null}
        </>
      ) : null}

      {v.paso === 'precio' && v.precio ? (
        <>
          {v.precio.estado === 'vencido' ? <Alerta tono="info" role="status" titulo="El precio venció. Pide uno nuevo.">El precio fijo dura 2 minutos. Los montos volvieron al indicativo.</Alerta> : null}
          <PrecioEjecutable {...v.precio} />
          {v.precio.estado !== 'vencido' ? (
            <CampoToken valor={v.precio.token} habilitado={!v.precio.confirmando} onChange={(t) => dispatch({ tipo: 'token', token: t })} autoFoco={modo === 'app'} error={v.precio.tokenError} />
          ) : null}
        </>
      ) : null}

      {v.paso === 'confirmacion' && v.confirmacion ? <Confirmacion vista={v.confirmacion} /> : null}
    </PanelOperar>
  );
};

const TITULOS: Record<'control' | 'destinatarios' | 'monitoreo', string> = { control: 'Control de operaciones', destinatarios: 'Destinatarios', monitoreo: 'Monitoreo de divisas' };

/** Secciones del menú: encabezado como el inicio, contenido propio y la columna de tipo de cambio y cuentas (salvo en Monitoreo). */
const SeccionGenerica: FC<{ estado: EstadoApp; dispatch: (a: Accion) => void; home: ReturnType<typeof vistaHome>; noDisponible: () => void }> = ({ estado, dispatch, home, noDisponible }) => {
  const seccion = estado.seccion as 'control' | 'destinatarios' | 'monitoreo';
  const control = useMemo(() => (seccion === 'control' ? vistaControl(estado) : null), [estado, seccion]);
  const destinatarios = useMemo(() => (seccion === 'destinatarios' ? vistaDestinatarios(estado) : null), [estado, seccion]);
  const monitoreo = useMemo(() => (seccion === 'monitoreo' ? vistaMonitoreo(estado) : null), [estado, seccion]);
  void noDisponible;
  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-h1 font-bold">{TITULOS[seccion]}</h1>
          <span className="text-body text-app-ink-2">{home.empresa} · {fmt.fechaLarga(HOY)}{destinatarios ? ` · ${destinatarios.resumen}` : ''}</span>
        </div>
        <div className="flex gap-3">
          {seccion === 'destinatarios' ? <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirDestinatarioNuevo' })}>Agregar destinatario</Boton> : null}
          {seccion === 'control' ? <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'seccion', seccion: 'movimientos' })}>Ver movimientos</Boton> : null}
          <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirPanel', orden: null })}>Pagar</Boton>
        </div>
      </div>
      {monitoreo ? (
        <SeccionMonitoreo estado={monitoreo.estado} hora={monitoreo.hora} pares={monitoreo.pares} />
      ) : (
        <div className="grid grid-cols-3 items-start gap-6">
          <div className="col-span-2 flex min-w-0 flex-col gap-5">
            {control ? <SeccionControl vista={control} dispatch={dispatch} /> : null}
            {destinatarios ? <SeccionDestinatarios items={destinatarios.items} dispatch={dispatch} /> : null}
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <TarjetaTipoDeCambio {...home.tdc} />
            <ModuloCuentas cuentas={home.cuentas} onVerTodas={() => dispatch({ tipo: 'abrirCuentas' })} />
          </div>
        </div>
      )}
    </>
  );
};
