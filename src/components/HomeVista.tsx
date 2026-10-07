'use client';
import { useEffect, useMemo, useState, type FC, type RefObject } from 'react';
import * as fmt from '@/lib/format';
import { AVISO_FUERA_DEL_PROTOTIPO, HOY } from '@/data/escenario';
import { ONBOARDING_PASOS, type Accion, type EstadoApp } from '@/state/estado';
import { vistaControl, vistaDestinatarios, vistaHome, vistaMonitoreo, vistaOperar, vistaPanel, type VistaFila } from '@/state/vistas';
import { notificaciones } from '@/state/derivados';
import { SeccionControl, SeccionDestinatarios, SeccionMonitoreo } from './Secciones';
import { AppShell, type ModoShell } from './AppShell';
import { AvisoResultado } from './AvisoResultado';
import { TarjetaPosicion } from './TarjetaPosicion';
import { FranjaNuevo } from './FranjaNuevo';
import { ListaMovimientos } from './FilaMovimiento';
import { TarjetaTipoDeCambio } from './TarjetaTipoDeCambio';
import { ModuloCuentas } from './ModuloCuentas';
import { AvisoVistaAnterior } from './AvisoVistaAnterior';
import { FormularioOperar } from './FormularioOperar';
import { CapaOperacion, type Contenedor } from './CapaOperacion';
import { PasoOnboarding, PASOS_ONBOARDING } from './PasoOnboarding';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';
import { Pestanas } from './ui/Pestanas';
import { Toast } from './ui/Toast';
import { descargarComprobante, htmlComprobante } from './comprobante';

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
  // Contenedor desde el que se pidieron los datos para depositar (C-47): desde el inicio, el panel lateral.
  const [depositoEn, setDepositoEn] = useState<Contenedor>('panel');
  const noDisponible = () => dispatch({ tipo: 'toast', texto: AVISO_FUERA_DEL_PROTOTIPO });
  const paso = estado.onboarding.activo ? PASOS_ONBOARDING[estado.onboarding.paso] : null;
  // Solo Inicio navega (C-52): la lista completa de movimientos es una vista de Inicio, que queda activo en el menú.
  const enMovimientos = estado.seccion === 'movimientos';
  // "Ver todos los movimientos" queda al pie del inicio: la lista completa (y la vuelta al inicio) arrancan arriba, con su título a la vista.
  useEffect(() => {
    if (modo === 'app') window.scrollTo(0, 0);
  }, [estado.seccion, modo]);
  const avisos = useMemo(() => notificaciones(estado).length, [estado]);
  // Una fila de Movimientos: "Pagar" abre el flujo con el pago cargado; el resto de la fila abre su detalle.
  const fila = (f: VistaFila) => ({ fecha: f.fecha, nombre: f.nombre, detalle: f.detalle, monto: f.monto, divisa: f.divisa, estado: f.badge, onPagar: f.orden ? () => dispatch({ tipo: 'abrirPanel', orden: f.orden! }) : undefined, onAbrir: () => dispatch({ tipo: 'abrirDetalle', id: f.id }) });

  return (
    <>
      <AppShell
        modo={modo}
        raizRef={raizRef}
        activo={0}
        onNoDisponible={noDisponible}
        onNavegar={() => dispatch({ tipo: 'seccion', seccion: 'inicio' })}
        campana={{ cantidad: avisos, onClick: () => dispatch({ tipo: 'abrirNotificaciones' }) }}
        capas={
          <>
            {panel ? <CapaOperacion vista={panel} estado={estado} dispatch={dispatch} modo={modo} depositoEn={depositoEn} onDepositar={setDepositoEn} /> : null}
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
            <Boton variante="link-caption" className="self-start px-0!" onClick={() => dispatch({ tipo: 'seccion', seccion: 'inicio' })}><Icono nombre="angle-left-b" tamano="sm" className="mr-1" />Volver al inicio</Boton>
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-h1 font-bold">Movimientos</h1>
                <span className="text-body text-app-ink-2">{home.empresa} · {fmt.fechaLarga(HOY)}</span>
              </div>
              <div className="flex gap-3">
                <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirAgendar' })}>Cargar un pago</Boton>
                <Boton variante="secondary" tamano="large" onClick={() => dispatch({ tipo: 'abrirPanel', orden: null })}>Pagar</Boton>
              </div>
            </div>
            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 flex min-w-0 flex-col gap-5">
                <ListaMovimientos modo="completa" resumen={home.resumenProximos} proximos={home.proximosTodos.map(fila)} realizados={home.realizados.map(fila)} />
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
                    enlace={p.enlace ? { label: p.enlace.label, onClick: () => { setDepositoEn('panel'); dispatch({ tipo: 'abrirDepositar' }); } } : null}
                  />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 flex min-w-0 flex-col gap-5">
                {home.nuevo ? (
                  <section aria-labelledby="nuevo-titulo" className="flex flex-col gap-2">
                    <h2 id="nuevo-titulo" className="text-h3 font-semibold">Cobraste hoy</h2>
                    <FranjaNuevo monto={home.nuevo.monto} divisa={home.nuevo.divisa} origen={home.nuevo.de} meta={home.nuevo.meta} onComprobante={() => dispatch({ tipo: 'abrirDetalle', id: home.nuevo!.id })} onUsar={() => dispatch({ tipo: 'abrirCobro', cobroId: home.nuevo!.id })} />
                  </section>
                ) : null}
                <ListaMovimientos
                  tour="movimientos"
                  onAgendar={() => dispatch({ tipo: 'abrirAgendar' })}
                  onVerTodos={() => dispatch({ tipo: 'seccion', seccion: 'movimientos' })}
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
              </div>
            </div>
            <div className="grid grid-cols-3 items-start gap-6">
              <div className="col-span-2 min-w-0"><FormularioOperar vista={operar} dispatch={dispatch} onNoDisponible={noDisponible} onAgregarDestinatario={() => dispatch({ tipo: 'abrirDestinatarioNuevo' })} onComprobante={(c) => descargarComprobante(`comprobante-${estado.operar.ultima?.id ?? 'operacion'}`, htmlComprobante({ titulo: c.titulo, sub: `${c.destino} · ${c.referencia || '—'}`, empresa: home.empresa, filas: c.filasComprobante, nota: c.fondeo }))} /></div>
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
