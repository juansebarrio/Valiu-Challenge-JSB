'use client';
import type { FC, ReactNode } from 'react';
import { AVISO_FUERA_DEL_PROTOTIPO, type CuentaId } from '@/data/escenario';
import { arquetipoDe } from '@/data/arquetipos';
import type { Accion, EstadoApp } from '@/state/estado';
import type { VistaPanel } from '@/state/vistas';
import type { ModoShell } from './AppShell';
import { PanelOperar } from './PanelOperar';
import { ModalOperar } from './ModalOperar';
import { ResumenPago } from './ResumenPago';
import { FormularioDestinatario, ListaCuentas, ListaNotificaciones } from './PanelExtras';
import { GrupoOrigen, GrupoPago } from './OpcionOrigen';
import { BloqueMonto } from './BloqueMonto';
import { FechaLiquidacion } from './FechaLiquidacion';
import { CampoToken } from './CampoToken';
import { AvisoConfirmacion, Confirmacion, EncabezadoConfirmacion, MontosFinales } from './Confirmacion';
import { DetalleMovimiento } from './DetalleMovimiento';
import { AgendarPago } from './AgendarPago';
import { SelectorDestino } from './SelectorDestino';
import { Boton } from './ui/Boton';
import { Alerta } from './ui/Alerta';
import { CampoTexto, MensajeError } from './ui/Campo';
import { ListaDetalle } from './ui/ListaDetalle';
import { descargarComprobante, htmlComprobante } from './comprobante';

/** Dónde se muestra cada tipo (C-47): operar en la ventana de pago, consultar en el panel lateral. */
export type Contenedor = 'modal' | 'panel';
const CONTENEDOR: Record<Exclude<VistaPanel['tipo'], 'depositar'>, Contenedor> = {
  pago: 'modal',
  agendar: 'modal',
  destinatario: 'modal',
  detalle: 'panel',
  notificaciones: 'panel',
  cuentas: 'panel',
};
/** "Datos para depositar" se muestra en el contenedor desde el que se abrió (desde el inicio, en el panel lateral). */
export const contenedorDe = (tipo: VistaPanel['tipo'], deposito: Contenedor): Contenedor => (tipo === 'depositar' ? deposito : CONTENEDOR[tipo]);

/**
 * Origen, Revisión y Precio del pago van en dos columnas; también la Confirmación, que desde C-50 lleva el BloqueMonto y las filas
 * y en una columna no entra a 1024 × 700 sin scroll. El resto, en una (560 px).
 */
const enDosColumnas = (v: VistaPanel) => v.tipo === 'pago' && (((v.paso === 'origen' || v.paso === 'revision' || v.paso === 'precio') && !!v.resumen) || (v.paso === 'confirmacion' && !!v.confirmacion));

/** Izquierda: lo que el usuario decide. Derecha (368 px, fondo canvas): lo que eso significa. Mismo alto mínimo en los tres pasos. */
const DosColumnas: FC<{ izquierda: ReactNode; derecha: ReactNode }> = ({ izquierda, derecha }) => (
  <div className="grid min-h-(--app-modal-body-min-h) grid-cols-[minmax(0,1fr)_var(--app-modal-aside-w)] gap-6">
    <div className="flex min-w-0 flex-col gap-4">{izquierda}</div>
    {derecha}
  </div>
);

export interface CapaOperacionProps {
  vista: VistaPanel;
  estado: EstadoApp;
  dispatch: (a: Accion) => void;
  modo: ModoShell;
  /** Contenedor desde el que se abrió "Datos para depositar". */
  depositoEn: Contenedor;
  onDepositar: (desde: Contenedor) => void;
}

/** Lo que se abre sobre el inicio: la ventana de pago (ModalOperar) o el panel lateral (PanelOperar), con el contenido de cada tipo y paso. */
export const CapaOperacion: FC<CapaOperacionProps> = ({ vista: v, estado, dispatch: despachar, modo, depositoEn, onDepositar }) => {
  const contenedor = contenedorDe(v.tipo, depositoEn);
  // Recuerda desde qué contenedor se pidieron los datos para depositar, para mostrarlos ahí mismo.
  const dispatch = (a: Accion) => { if (a.tipo === 'abrirDepositar') onDepositar(contenedor); despachar(a); };
  const noDisponible = () => dispatch({ tipo: 'toast', texto: AVISO_FUERA_DEL_PROTOTIPO });
  const empresa = arquetipoDe(estado.arquetipo).empresa;
  // "Descargar comprobante / confirmación": el archivo lleva las mismas filas que muestra la pantalla.
  const comprobante = () => {
    const c = v.confirmacion;
    const d = v.detalle;
    if (c) descargarComprobante(`comprobante-${estado.operaciones[0]?.id ?? 'operacion'}`, htmlComprobante({ titulo: c.titulo, sub: v.sub, empresa, filas: c.filasComprobante, nota: c.fondeo }));
    else if (d) descargarComprobante(`comprobante-${estado.panel.movimientoId ?? 'movimiento'}`, htmlComprobante({ titulo: d.titulo, sub: `${v.titulo} · ${v.sub}`, empresa, filas: d.filasComprobante ?? d.filas, nota: d.texto ?? d.fondeo }));
    else noDisponible();
  };
  const cerrar = () => dispatch(v.paso === 'confirmacion' ? { tipo: 'volverInicio' } : { tipo: 'cerrarPanel' });
  // Desde el detalle (panel lateral), "Pagar" cierra el panel y abre la ventana de pago: el tipo pasa a 'pago'.
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
          case 'pagar': pagar(); break;
        }
      },
    }
    : null;

  // ------------------------------------------------------------ Pasos de dos columnas (pago)
  let dosColumnas: ReactNode = null;
  if (enDosColumnas(v)) {
    let izquierda: ReactNode = null;
    if (v.paso === 'origen') {
      izquierda = (
        <>
          <h3 className="text-h3 font-semibold">¿Desde qué cuenta pagas?</h3>
          <GrupoOrigen opciones={v.origenes.map((o) => ({ id: o.id, cuenta: o.nombre, saldo: o.saldo, pagas: o.pagas, consecuencia: o.consecuencia, deshabilitada: o.deshabilitada }))} valor={estado.panel.origenId} onCambiar={(id) => dispatch({ tipo: 'elegirOrigen', origenId: id as CuentaId })} />
        </>
      );
    } else if (v.paso === 'revision' && v.revision) {
      const r = v.revision;
      izquierda = (
        <>
          {v.mercadoCerrado ? <Alerta tono="warning" titulo="Mercado cerrado.">No se puede pedir precio hasta que abra. Puedes dejar el pago listo.</Alerta> : null}
          <div className="flex flex-col gap-2">
            {/* Para no pagar dos veces lo mismo (C-49): una línea sobre el monto con el pago cargado del destinatario. */}
            {r.pagoCargado ? (
              <p data-component="AvisoPagoCargado" className="text-caption text-app-ink-2 tabular-nums">
                {r.pagoCargado.texto}{' '}
                <Boton variante="link-caption" className="px-0!" onClick={() => dispatch({ tipo: 'usarPagoCargado', pagoId: r.pagoCargado!.id })}>Usar este pago</Boton>
              </p>
            ) : null}
            <BloqueMonto pagas={{ monto: r.pagas, divisa: r.pagasDivisa }} recibe={{ monto: r.recibe, divisa: r.recibeDivisa, destinatario: r.destinatario }} ladoFijo={r.ladoFijo} conTdc={!v.sinTdc} unico={r.unico} editable={r.editable} onCambiar={(lado, valor) => dispatch({ tipo: 'monto', lado, valor })} />
            {r.error ? <MensajeError>{r.error}</MensajeError> : null}
          </div>
          <FechaLiquidacion visible={r.fechas.length > 0} opciones={r.fechas} valor={estado.panel.fechaValor} nota={r.notaFecha} onChange={(f) => dispatch({ tipo: 'fechaValor', fecha: f })} />
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto etiqueta="Concepto" opcional valor={r.concepto} onCambiar={(t) => dispatch({ tipo: 'motivo', motivo: t })} placeholder="Ej. Pago a proveedores" />
            <CampoTexto etiqueta="Referencia" opcional valor={r.referencia} onCambiar={(t) => dispatch({ tipo: 'referencia', referencia: t })} placeholder="Ej. Factura 0457" />
          </div>
        </>
      );
    } else if (v.paso === 'precio' && v.precio) {
      const p = v.precio;
      izquierda = (
        <>
          {p.estado === 'vencido' ? <Alerta tono="info" role="status" titulo="Se acabó el tiempo para confirmar.">Pide precio de nuevo. Los montos volvieron al indicativo.</Alerta> : null}
          {/* Solo lectura y en el mismo lugar que en la revisión: con la ventana para confirmar abierta el lado no fijo se actualiza en vivo
              y es exacto en cada instante (C-48); al acabarse el tiempo vuelve al indicativo (≈). */}
          <BloqueMonto pagas={{ monto: p.pagas, divisa: p.pagasDivisa }} recibe={{ monto: p.recibe, divisa: p.recibeDivisa, destinatario: p.destinatario }} ladoFijo={p.ladoFijo} conTdc={p.estado !== 'sinTdc'} exacto={p.estado === 'ejecutable'} unico={p.unico} />
          {p.estado !== 'vencido' ? (
            <CampoToken valor={p.token} habilitado={!p.confirmando} onChange={(t) => dispatch({ tipo: 'token', token: t })} autoFoco={modo === 'app'} error={p.tokenError} />
          ) : null}
        </>
      );
    }
    if (v.paso === 'confirmacion' && v.confirmacion) {
      // Confirmación (C-50): arriba a la izquierda el estado y los montos finales; a la derecha las filas de la operación.
      const c = v.confirmacion;
      dosColumnas = (
        <DosColumnas
          izquierda={<><EncabezadoConfirmacion vista={c} compacta /><MontosFinales montos={c.montos} /><AvisoConfirmacion vista={c} /></>}
          derecha={<ResumenPago vista={{ tdc: null, sinPrecio: null, filas: c.detalle, aviso: null, nota: null }} />}
        />
      );
    } else {
      dosColumnas = <DosColumnas izquierda={izquierda} derecha={<ResumenPago vista={v.resumen!} />} />;
    }
  }

  // ------------------------------------------------------------ Pasos de una columna y panel lateral
  const unaColumna = dosColumnas ? null : (
    <>
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
          <SelectorDestino modo="lista" grupos={v.destino.grupos} busqueda={v.destino.busqueda} onBusqueda={(t) => dispatch({ tipo: 'busquedaDestino', texto: t })} onElegir={(d) => dispatch(v.tipo === 'agendar' ? { tipo: 'agendaDestino', destino: d.destino } : { tipo: 'elegirDestino', destino: d.destino })} onAgregar={() => (v.tipo === 'agendar' ? noDisponible() : dispatch({ tipo: 'abrirDestinatarioNuevo' }))} />
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
      {v.tipo === 'agendar' && v.paso === 'confirmacion' && v.detalle ? <DetalleMovimiento vista={v.detalle} compacta /> : null}

      {v.paso === 'confirmacion' && v.confirmacion ? <Confirmacion vista={v.confirmacion} /> : null}
    </>
  );

  const acciones = { titulo: v.titulo, sub: v.sub, primario: { label: v.primario.label, habilitado: v.primario.habilitado, onClick: primario }, secundario, onCerrar: cerrar, modo };
  if (contenedor === 'panel') return <PanelOperar {...acciones}>{unaColumna}</PanelOperar>;
  return (
    <ModalOperar {...acciones} ancho={dosColumnas ? 'amplio' : 'angosto'}>
      {dosColumnas ?? <div className="flex flex-col gap-4">{unaColumna}</div>}
    </ModalOperar>
  );
};
