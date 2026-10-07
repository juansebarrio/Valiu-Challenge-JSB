// src/state/escenarios.ts — estados iniciales por escenario (?escenario=) y los frames de /tablero/alta.
import { estadoInicial, aplicar, pagoPorId, type Accion, type EstadoApp, type OpcionesInicio } from './estado';
import { destinoDeDestinatario, ordenDePago } from './derivados';
import type { ArquetipoId, EscenarioNombre } from '@/data/escenario';
import { arquetipoDe } from '@/data/arquetipos';

const JUE8 = new Date(2026, 9, 8);
const VIE9 = new Date(2026, 9, 9);
const HORA = '10:43';

const abrirShenzhen = (e: EstadoApp): Accion[] => [{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(e, 'p1')!) }];
const revision: Accion[] = [{ tipo: 'irPaso', paso: 'revision' }];
const precio: Accion[] = [{ tipo: 'pedirPrecio' }];
const TOKEN: Accion[] = [{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }, { tipo: 'confirmado', hora: HORA }];
const vencer = (): Accion[] => Array.from({ length: 120 }, () => ({ tipo: 'tick' as const }));

/** Estado inicial de cada escenario. "resuelta" y "pactada" parten del base y pagan el pago principal del arquetipo desde la cuenta en pesos (hoy o en su vencimiento). */
export function estadoDeEscenario(nombre: EscenarioNombre, opciones: OpcionesInicio = {}, arquetipo: ArquetipoId = 'importadora'): EstadoApp {
  const base = estadoInicial(nombre, { ...opciones, recorrido: nombre === 'faltante' && opciones.recorrido }, arquetipo);
  const pago = pagoPorId(base, arquetipoDe(arquetipo).pagoPrincipal);
  if (!pago) return base;
  const abrir: Accion[] = [{ tipo: 'abrirPanel', orden: ordenDePago(pago), origenId: 'mxn' }];
  if (nombre === 'resuelta') return aplicar([...abrir, ...revision, ...precio, ...TOKEN, { tipo: 'volverInicio' }], base);
  if (nombre === 'pactada') return aplicar([...abrir, ...revision, { tipo: 'fechaValor', fecha: pago.fecha }, ...precio, ...TOKEN, { tipo: 'volverInicio' }], base);
  return base;
}

export interface Frame {
  n: string;
  titulo: string;
  nota: string;
  estado: EstadoApp;
}

export interface FilaTablero {
  titulo: string;
  nota: string;
  /** La hoja de estados va delante de los frames de esta fila. */
  conHojaDeEstados?: boolean;
  frames: Frame[];
}

/** Frames del handoff como secuencias de acciones sobre el estado inicial. Las notas son hechos del prototipo, no del producto actual. */
export function filasTablero(): FilaTablero[] {
  const base = estadoInicial('faltante');
  const e02 = aplicar(abrirShenzhen(base), base);
  const e03 = aplicar(revision, e02);
  const e04 = aplicar(precio, e03);
  const e05 = aplicar(vencer(), e04);
  const e06 = aplicar(TOKEN, e04);
  const e07 = aplicar([{ tipo: 'volverInicio' }], e06);
  const e03B = aplicar([{ tipo: 'fechaValor', fecha: JUE8 }], e03);
  const e04B = aplicar(precio, e03B);
  const e06B = aplicar(TOKEN, e04B);
  const e07B = aplicar([{ tipo: 'volverInicio' }], e06B);

  const pactadaInicio = estadoDeEscenario('pactada');
  const agendaLlena = aplicar([{ tipo: 'abrirAgendar' }, { tipo: 'agendaDestino', destino: destinoDeDestinatario(base.datos.destinatarios.find((d) => d.id === 'ap')!) }, { tipo: 'agendaMonto', texto: '250' }, { tipo: 'agendaFecha', fecha: VIE9 }, { tipo: 'agendaReferencia', referencia: 'Pedido AP-121' }], base);

  // Flujo secundario (turismo): del cobro en pesos al pago en euros, pactado para el vie 9; S07H/S08H con Hoy.
  const tur = estadoInicial('faltante', {}, 'turismo');
  const s02 = aplicar([{ tipo: 'abrirCobro', cobroId: tur.datos.loNuevo!.id }], tur);
  const s03 = aplicar([{ tipo: 'continuarPago' }], s02);
  const s04 = aplicar([...revision, { tipo: 'fechaValor', fecha: VIE9 }], s03);
  const s05 = aplicar(precio, s04);
  const s06 = aplicar(vencer(), s05);
  const s07 = aplicar(TOKEN, s05);
  const s08 = aplicar([{ tipo: 'volverInicio' }], s07);
  const s07h = aplicar([...revision, ...precio, ...TOKEN], s03);
  const s08h = aplicar([{ tipo: 'volverInicio' }], s07h);

  const operar = aplicar([{ tipo: 'pestana', pestana: 'operar' }], base);
  const compraLlena = aplicar([{ tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opOrigen', origenId: 'mxn' }, { tipo: 'opDestino', destinoId: 'usd' }, { tipo: 'opMotivo', motivo: 'Compra de divisas' }, { tipo: 'opReferencia', referencia: 'Cobertura pagos USD' }], operar);
  const precioOp = aplicar([{ tipo: 'opPedirPrecio' }, { tipo: 'opToken', token: '47' }], compraLlena);
  const transfer = aplicar([{ tipo: 'opTipo', valor: 'transferir' }, { tipo: 'opOrigen', origenId: 'usd' }], operar);
  const cerrado = aplicar([{ tipo: 'pestana', pestana: 'operar' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opOrigen', origenId: 'mxn' }, { tipo: 'opDestino', destinoId: 'usd' }, { tipo: 'opMotivo', motivo: 'Compra de divisas' }, { tipo: 'opReferencia', referencia: 'Cobertura pagos USD' }], estadoInicial('mercado-cerrado'));

  return [
    {
      titulo: 'Flujo principal · Posición consolidada',
      nota: 'Importadora: faltan dólares → paga a Shenzhen Parts Co. con pesos → posición resuelta',
      frames: [
        { n: '01', titulo: 'Inicio con faltante', nota: 'Posición por divisa calculada desde el modelo de datos; "Cobraste hoy" con el cobro de Comercial Norte; "Pagar" en la fila de Shenzhen Parts Co. abre la ventana de pago.', estado: base },
        { n: '02', titulo: 'Ventana de pago · Origen', nota: 'Ventana de pago de dos columnas sobre el inicio atenuado: a la izquierda las cuentas, con un chip solo si cambia la decisión (cubre el faltante o te faltaría para los pagos del vie 9) y la Cuenta Principal MXN preseleccionada; a la derecha, el tipo de cambio indicativo de esa cuenta, la comisión, lo que recibe Shenzhen y el vencimiento.', estado: e02 },
        { n: '03', titulo: 'Ventana de pago · Revisión', nota: 'A la izquierda, montos (Pagas en vivo, Recibe fijo), fecha valor con Hoy y lo que gana quien elige otro día, concepto y referencia; a la derecha, el tipo de cambio indicativo, la comisión, de qué cuenta y qué día sale el dinero y cómo queda la cuenta.', estado: e03 },
        { n: '04', titulo: 'Ventana de pago · Precio y token', nota: 'Precio ejecutable 18.092415 arriba a la derecha con "Confirma en 2:00": se mueve con el mercado hasta que confirmas (estático en el tablero). A la izquierda, el lado fijo y el otro exacto en cada instante, y el token de 6 dígitos. "Volver" descarta el precio.', estado: e04 },
        { n: '05', titulo: 'Ventana de pago · Precio vencido', nota: 'Se acabó el tiempo para confirmar: aviso informativo, badge "Vencido" sobre el último precio, montos al indicativo, sin casillas de token.', estado: e05 },
        { n: '06', titulo: 'Confirmación · Pago en proceso', nota: 'Dos columnas: el estado y los montos finales en el mismo BloqueMonto; a la derecha de dónde y cuándo sale el dinero, el tipo de cambio, la comisión, el concepto y la referencia. El inicio detrás ya está actualizado.', estado: e06 },
        { n: '07', titulo: 'Inicio con la posición resuelta', nota: 'Aviso "Pago en proceso", USD "Alcanza", Shenzhen en Realizados con "En proceso", MXN 1,152,861.38.', estado: e07 },
      ],
    },
    {
      titulo: 'Flujo principal · Fecha valor',
      nota: 'Rama desde 03: el usuario elige jue 8, cierra hoy el precio y el pago queda Pactada',
      conHojaDeEstados: true,
      frames: [
        { n: '03B', titulo: 'Ventana de pago · Revisión con fecha', nota: 'jue 8 elegido: "Cierras el precio hoy y el dinero sale el jue 8. No necesitas tener el saldo hasta ese día."; la fila "El jue 8 tu cuenta queda en" lleva la fecha.', estado: e03B },
        { n: '04B', titulo: 'Ventana de pago · Precio y token con fecha', nota: 'Igual al 04, con el día en que sale el dinero en la columna derecha.', estado: e04B },
        { n: '06B', titulo: 'Confirmación · Pago pactado', nota: 'Badge Pactada, los montos finales, "Sale el dinero jue 8", el aviso de fondeo y "Descargar confirmación".', estado: e06B },
        { n: '07B', titulo: 'Inicio con el pago pactado', nota: 'USD ya alcanza; MXN suma "Pactadas por liquidar (1)" y el saldo no cambia hasta el jue 8.', estado: e07B },
      ],
    },
    {
      titulo: 'Pestaña Operar clásico',
      nota: 'El formulario clásico con el mismo motor que la ventana de pago',
      frames: [
        { n: '08', titulo: 'Operar clásico · Comprar, vacío', nota: 'Badge de mercado, TDC indicativo visible desde el inicio, "Pedir precio" deshabilitado hasta completar los campos.', estado: operar },
        { n: '09', titulo: 'Operar clásico · Selector de par', nota: 'Selector agrupado: primero los pares de tus posiciones, después el resto. GBP/MXN y CAD/MXN avisan que no están en el prototipo.', estado: aplicar([{ tipo: 'opParAbierto', abierto: true }], operar) },
        { n: '10', titulo: 'Operar clásico · Compra completa, precio indicativo', nota: 'El lado que escribes queda fijo y el otro se calcula en vivo; el CTA se habilita con los campos completos.', estado: compraLlena },
        { n: '11', titulo: 'Operar clásico · Precio ejecutable y token', nota: 'Precio ejecutable en vivo con "Confirma en 2:00", la línea "Se mueve con el mercado hasta que confirmas.", la comisión y el token dentro del formulario.', estado: precioOp },
        { n: '12', titulo: 'Operar clásico · Precio vencido', nota: 'Al acabarse el tiempo para confirmar, los montos vuelven al indicativo y la única acción principal es pedir precio de nuevo.', estado: aplicar(vencer(), precioOp) },
        { n: '13', titulo: 'Operar clásico · Vender con error de saldo', nota: 'Error inline bajo el campo, con el saldo disponible; "Pedir precio" deshabilitado.', estado: aplicar([{ tipo: 'opTipo', valor: 'vender' }, { tipo: 'opMonto', lado: 'izq', valor: '5000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestino', destinoId: 'mxn' }, { tipo: 'opMotivo', motivo: 'Venta de divisas' }], operar) },
        { n: '14', titulo: 'Operar clásico · Transferir, selector de destino', nota: 'Destino con buscador y grupos; el mismo componente que el paso Destino de la ventana de pago.', estado: aplicar([{ tipo: 'opDestinoBusqueda', texto: 'Logí' }], transfer) },
        { n: '15', titulo: 'Operar clásico · Transferencia lista, token', nota: 'Transferencia en la misma divisa: sin TDC ni precio; el token se pide al confirmar.', estado: aplicar([{ tipo: 'opDestino', destinoId: 'log' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opMotivo', motivo: 'Pago a proveedores' }, { tipo: 'opReferencia', referencia: 'Flete OCT-02' }, { tipo: 'opContinuar' }], transfer) },
        { n: '16', titulo: 'Operar clásico · Mercado cerrado', nota: 'Escenario mercado-cerrado: formulario editable y "Pedir precio" deshabilitado. Sin horario mientras el dato no esté confirmado.', estado: cerrado },
      ],
    },
    {
      titulo: 'Movimientos · Detalle y cargar un pago',
      nota: 'Cada fila de Movimientos abre su detalle en el panel lateral; el "+" junto al título carga un pago nuevo en la ventana de pago',
      frames: [
        { n: 'D1', titulo: 'Detalle · Pago pendiente', nota: 'Fila de Shenzhen Parts Co.: destinatario, vencimiento, motivo, referencia y el equivalente en pesos de hoy. "Pagar" cierra el panel y abre la ventana de pago.', estado: aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], base) },
        { n: 'D2', titulo: 'Detalle · Cobro realizado', nota: 'Fila de Comercial Norte en Realizados: de quién, cuándo, referencia, cuenta en la que entró y estado.', estado: aplicar([{ tipo: 'abrirDetalle', id: 'r1' }], base) },
        { n: 'D3', titulo: 'Detalle · Pago pactado', nota: 'Desde el escenario pactada: los montos finales y las mismas filas que la confirmación, el aviso de fondeo y la nota de que cancelar se pide por WhatsApp desde Contáctanos.', estado: aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], pactadaInicio) },
        { n: 'A1', titulo: 'Cargar un pago · Destinatario', nota: 'El "+" de Movimientos abre la ventana de pago con el mismo selector de destino, solo con destinatarios.', estado: aplicar([{ tipo: 'abrirAgendar' }], base) },
        { n: 'A2', titulo: 'Cargar un pago · Datos', nota: 'Monto en la divisa del destinatario, vencimiento (día hábil, hasta 90 días), concepto y referencia opcionales; "Cargar" se habilita con monto y fecha.', estado: agendaLlena },
        { n: 'A3', titulo: 'Cargar un pago · Confirmación', nota: '"Pago cargado": queda en Próximos para pagarlo cuando quieras; "Pagar ahora" entra al flujo de pago con ese pago.', estado: aplicar([{ tipo: 'agendar' }], agendaLlena) },
        { n: 'A4', titulo: 'Inicio con el pago cargado', nota: 'El pago nuevo del vie 9 entra en Próximos de la semana y la proyección en USD lo descuenta: faltan 1,250.00 USD.', estado: aplicar([{ tipo: 'agendar' }, { tipo: 'volverInicio' }], agendaLlena) },
      ],
    },
    {
      titulo: 'Flujo secundario · Turismo',
      nota: 'Viajes Altavista cobra en pesos y paga en euros: el cobro de Familia Ortega llega hoy, el pago al Hotel Gran Vía Madrid vence el vie 9 y la Cuenta EUR está en cero → usa el cobro, cierra hoy el precio y el dinero sale el vie 9 (S07H y S08H: la variante con Hoy)',
      frames: [
        { n: 'S01', titulo: 'Home · Turismo', nota: 'EUR primero (D-34), con saldo 0.00, "Faltan 4,200.00", proyección en cero que cae el vie 9 y "Comprar 4,200 EUR"; USD alcanza; MXN sin pendientes; "Cobraste hoy" con el cobro de Familia Ortega. Tipo de cambio con EUR/MXN (tendencia) y USD/MXN compacto.', estado: tur },
        { n: 'S02', titulo: 'Ventana de pago · ¿Qué pagas con este cobro?', nota: '"Usar para pagar" abre la ventana de pago con el cobro como contexto: OpcionPago por pago pendiente con cuánto del cobro usa y un chip solo si cambia la decisión (el Hotel cubre el faltante en EUR); el Hotel viene seleccionado.', estado: s02 },
        { n: 'S03', titulo: 'Ventana de pago · Origen', nota: 'La cuenta donde entró el cobro viene seleccionada ("incluye el cobro de hoy"); la Cuenta USD muestra la consecuencia de usarla y la Cuenta EUR, sin saldo, no se puede elegir (D-31).', estado: s03 },
        { n: 'S04', titulo: 'Ventana de pago · Revisión con vie 9', nota: 'Llega con Hoy; con vie 9 el precio se cierra hoy y el dinero sale el día del vencimiento. Precio indicativo EUR/MXN y "El vie 9 tu cuenta queda en ≈ X".', estado: s04 },
        { n: 'S05', titulo: 'Ventana de pago · Precio y token', nota: 'Precio ejecutable EUR/MXN (indicativo × 1.0000681) arriba a la derecha con "Confirma en 2:00": se mueve con el mercado hasta que confirmas. Con el día en que sale el dinero, y el token a la izquierda.', estado: s05 },
        { n: 'S06', titulo: 'Ventana de pago · Precio vencido', nota: 'Al acabarse el tiempo para confirmar, los montos vuelven al indicativo y la única acción principal es pedir precio de nuevo; la fecha elegida se conserva.', estado: s06 },
        { n: 'S07', titulo: 'Confirmación · Pago pactado', nota: 'Badge Pactada, los montos finales con el precio del momento en que confirmaste, "Sale el dinero vie 9", aviso de fondeo y "Descargar confirmación".', estado: s07 },
        { n: 'S08', titulo: 'Home con el pago pactado', nota: 'Aviso info; EUR sin pendientes ("pactado en pesos, sale el vie 9"); MXN con "Pactadas por liquidar (1)"; el Hotel sigue en Próximos con badge Pactada y el detalle en pesos.', estado: s08 },
        { n: 'S07H', titulo: 'Confirmación · Pago en proceso (Hoy)', nota: 'Con Hoy en S04 el pago sale ya: la confirmación es la del flujo principal (06).', estado: s07h },
        { n: 'S08H', titulo: 'Home con la posición resuelta (Hoy)', nota: 'Aviso success; EUR sin pendientes ("pagado hoy en pesos"); el Hotel pasa a Realizados con "En proceso"; la cuenta en pesos ya descontó el pago.', estado: s08h },
      ],
    },
    {
      // C-52: Control de operaciones, Destinatarios y Monitoreo de divisas quedan en el código sin entrada (sin frames N1–N3).
      titulo: 'Paneles y alta de destinatario',
      nota: 'Notificaciones y todas las cuentas en el panel lateral, y el alta de destinatario en la ventana de pago. En el menú solo Inicio navega',
      frames: [
        { n: 'N4', titulo: 'Panel · Notificaciones', nota: 'Avisos derivados del estado: el cobro de hoy, los faltantes de la semana, lo en proceso, el fondeo de lo pactado y los vencimientos; cada uno abre su movimiento.', estado: aplicar([{ tipo: 'abrirNotificaciones' }], base) },
        { n: 'N5', titulo: 'Panel · Tus cuentas', nota: '"Ver todas mis cuentas": saldo, banco, máscara y CLABE; "Pasar dinero a esta cuenta" y "Ver datos para depositar".', estado: aplicar([{ tipo: 'abrirCuentas' }], base) },
        { n: 'N6', titulo: 'Ventana de pago · Agregar destinatario', nota: 'Desde el paso Destino: nombre, divisa, banco y cuenta o CLABE; "Guardar y pagar" sigue con el pago al destinatario nuevo.', estado: aplicar([{ tipo: 'abrirPanel', orden: null }, { tipo: 'abrirDestinatarioNuevo' }, { tipo: 'destinatarioCampo', campo: 'nombre', valor: 'Maderas del Sur' }, { tipo: 'destinatarioCampo', campo: 'banco', valor: 'Banorte' }, { tipo: 'destinatarioCampo', campo: 'cuenta', valor: '072180000123456789' }], base) },
      ],
    },
    {
      titulo: 'Onboarding',
      nota: 'Recorrido contextual de 4 pasos al entrar por primera vez · Atrás / Siguiente y cierre en cualquier momento · "Empezar" o × vuelven al inicio',
      frames: [0, 1, 2, 3].map((i) => ({
        n: String(17 + i),
        titulo: `Onboarding · Paso ${i + 1} de 4`,
        nota: '',
        estado: aplicar([{ tipo: 'onboardingIniciar' }, ...Array.from({ length: i }, () => ({ tipo: 'onboardingSiguiente' as const }))], base),
      })),
    },
  ];
}
