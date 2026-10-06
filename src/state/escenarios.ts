// src/state/escenarios.ts — estados iniciales por escenario (?escenario=) y los frames de /tablero/alta.
import { estadoInicial, aplicar, pagoPorId, type Accion, type EstadoApp, type OpcionesInicio } from './estado';
import { ordenDePago } from './derivados';
import type { EscenarioNombre } from '@/data/escenario';

const JUE8 = new Date(2026, 9, 8);
const HORA = '10:43';

const abrirShenzhen = (e: EstadoApp): Accion[] => [{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(e, 'p1')!) }];
const revision: Accion[] = [{ tipo: 'irPaso', paso: 'revision' }];
const precio: Accion[] = [{ tipo: 'pedirPrecio' }];
const TOKEN: Accion[] = [{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }, { tipo: 'confirmado', hora: HORA }];
const vencer = (): Accion[] => Array.from({ length: 120 }, () => ({ tipo: 'tick' as const }));

/** Estado inicial de cada escenario. "resuelta" y "pactada" parten del base y aplican el pago a Shenzhen. */
export function estadoDeEscenario(nombre: EscenarioNombre, opciones: OpcionesInicio = {}): EstadoApp {
  const base = estadoInicial(nombre, { ...opciones, recorrido: nombre === 'faltante' && opciones.recorrido });
  if (nombre === 'resuelta') return aplicar([...abrirShenzhen(base), ...revision, ...precio, ...TOKEN, { tipo: 'volverInicio' }], base);
  if (nombre === 'pactada') return aplicar([...abrirShenzhen(base), ...revision, { tipo: 'fechaValor', fecha: JUE8 }, ...precio, ...TOKEN, { tipo: 'volverInicio' }], base);
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
        { n: '01', titulo: 'Inicio con faltante', nota: 'Posición por divisa calculada desde el modelo de datos; "Pagar" en la fila de Shenzhen Parts Co. abre el panel.', estado: base },
        { n: '02', titulo: 'Panel · Origen', nota: 'Panel de 480 px sobre el inicio atenuado. Los chips de consecuencia salen del cálculo de posición; Cuenta Principal MXN preseleccionada.', estado: e02 },
        { n: '03', titulo: 'Panel · Revisión', nota: 'Montos (Pagas en vivo, Recibe fijo), fecha valor con Hoy, consecuencia, TDC Valiu indicativo, motivo de pago y referencia.', estado: e03 },
        { n: '04', titulo: 'Panel · Precio y token', nota: 'Precio ejecutable 18.092415 fijo por 2:00 y token de 6 dígitos. "Volver" descarta el precio.', estado: e04 },
        { n: '05', titulo: 'Panel · Precio vencido', nota: 'Aviso informativo, badge "Vencido" sobre el precio que venció, montos al indicativo, sin casillas de token.', estado: e05 },
        { n: '06', titulo: 'Confirmación · Pago en proceso', nota: 'Detalle de la operación; el inicio detrás ya está actualizado.', estado: e06 },
        { n: '07', titulo: 'Inicio con la posición resuelta', nota: 'Aviso "Pago en proceso", USD "Alcanza", Shenzhen en Realizados con "En proceso", MXN 1,152,861.38.', estado: e07 },
      ],
    },
    {
      titulo: 'Flujo principal · Fecha valor',
      nota: 'Rama desde 03: el usuario elige jue 8, cierra hoy el precio y el pago queda Pactada',
      conHojaDeEstados: true,
      frames: [
        { n: '03B', titulo: 'Panel · Revisión con fecha', nota: 'jue 8 elegido: el precio se cierra hoy y el dinero sale ese día; la línea de efecto lleva la fecha.', estado: e03B },
        { n: '04B', titulo: 'Panel · Precio y token con fecha', nota: 'Igual al 04, con el día en que sale el dinero en el resumen.', estado: e04B },
        { n: '06B', titulo: 'Confirmación · Pago pactado', nota: 'Badge Pactada, texto del pacto, aviso de fondeo y "Descargar confirmación".', estado: e06B },
        { n: '07B', titulo: 'Inicio con el pago pactado', nota: 'USD ya alcanza; MXN suma "Pactadas por liquidar (1)" y el saldo no cambia hasta el jue 8.', estado: e07B },
      ],
    },
    {
      titulo: 'Pestaña Operar clásico',
      nota: 'El formulario clásico con el mismo motor que el panel',
      frames: [
        { n: '08', titulo: 'Operar clásico · Comprar, vacío', nota: 'Badge de mercado, TDC indicativo visible desde el inicio, "Pedir precio" deshabilitado hasta completar los campos.', estado: operar },
        { n: '09', titulo: 'Operar clásico · Selector de par', nota: 'Selector agrupado: primero los pares de tus posiciones, después el resto. GBP/MXN y CAD/MXN avisan que no están en el prototipo.', estado: aplicar([{ tipo: 'opParAbierto', abierto: true }], operar) },
        { n: '10', titulo: 'Operar clásico · Compra completa, precio indicativo', nota: 'El lado que escribes queda fijo y el otro se calcula en vivo; el CTA se habilita con los campos completos.', estado: compraLlena },
        { n: '11', titulo: 'Operar clásico · Precio fijo y token', nota: 'Precio ejecutable con cuenta regresiva y token dentro del formulario.', estado: precioOp },
        { n: '12', titulo: 'Operar clásico · Precio vencido', nota: 'Al vencer, los montos vuelven al indicativo y la única acción principal es pedir un precio nuevo.', estado: aplicar(vencer(), precioOp) },
        { n: '13', titulo: 'Operar clásico · Vender con error de saldo', nota: 'Error inline bajo el campo, con el saldo disponible; "Pedir precio" deshabilitado.', estado: aplicar([{ tipo: 'opTipo', valor: 'vender' }, { tipo: 'opMonto', lado: 'izq', valor: '5000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestino', destinoId: 'mxn' }, { tipo: 'opMotivo', motivo: 'Venta de divisas' }], operar) },
        { n: '14', titulo: 'Operar clásico · Transferir, selector de destino', nota: 'Destino con buscador y grupos; el mismo componente que el paso Destino del panel.', estado: aplicar([{ tipo: 'opDestinoBusqueda', texto: 'Logí' }], transfer) },
        { n: '15', titulo: 'Operar clásico · Transferencia lista, token', nota: 'Transferencia en la misma divisa: sin TDC ni precio; el token se pide al confirmar.', estado: aplicar([{ tipo: 'opDestino', destinoId: 'log' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opMotivo', motivo: 'Pago a proveedores' }, { tipo: 'opReferencia', referencia: 'Flete OCT-02' }, { tipo: 'opContinuar' }], transfer) },
        { n: '16', titulo: 'Operar clásico · Mercado cerrado', nota: 'Escenario mercado-cerrado: formulario editable y "Pedir precio" deshabilitado. Sin horario mientras el dato no esté confirmado.', estado: cerrado },
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
