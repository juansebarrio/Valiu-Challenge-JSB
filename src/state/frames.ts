// src/state/frames.ts — los 24 frames del handoff como estados del reducer (tablero y pruebas).
import { HOY } from '@/data/escenario-importadora';
import { aplicar, ordenDePago, pagoPorId, type Accion, type EstadoApp } from './estado';

export interface Frame {
  n: string;
  titulo: string;
  nota: string;
  estado: EstadoApp;
}

export interface FilaTablero {
  titulo: string;
  nota: string;
  frames: Frame[];
}

const shenzhen = () => ordenDePago(pagoPorId('p1')!);
const JUE8 = new Date(2026, 9, 8);
const vencer = (): Accion[] => Array.from({ length: 119 }, () => ({ tipo: 'tick' as const }));
const TOKEN: Accion[] = [{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }];

const abrir: Accion[] = [{ tipo: 'abrirPanel', orden: shenzhen() }];
const revision: Accion[] = [...abrir, { tipo: 'irPaso', paso: 'revision' }];
const precio: Accion[] = [...revision, { tipo: 'pedirPrecio' }];
const revisionB: Accion[] = [...revision, { tipo: 'fechaValor', fecha: JUE8 }];
const precioB: Accion[] = [...revisionB, { tipo: 'pedirPrecio' }];

const operar: Accion[] = [{ tipo: 'pestana', pestana: 'operar' }];
const compraLlena: Accion[] = [...operar, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opOrigen', origenId: 'mxn' }, { tipo: 'opDestino', destinoId: 'usd' }, { tipo: 'opMotivo', motivo: 'Compra de divisas' }, { tipo: 'opReferencia', referencia: 'Cobertura pagos USD' }];
const precioOp: Accion[] = [...compraLlena, { tipo: 'opPedirPrecio' }, { tipo: 'opToken', token: '47' }];
const transfer: Accion[] = [...operar, { tipo: 'opTipo', valor: 'transferir' }, { tipo: 'opOrigen', origenId: 'usd' }];

export const FILAS_TABLERO: FilaTablero[] = [
  {
    titulo: 'Flujo principal · Posición consolidada',
    nota: 'Importadora: faltan dólares → paga a Shenzhen Parts Co. con pesos → posición resuelta',
    frames: [
      { n: '01', titulo: 'Home con faltante', nota: '"Pagar" en la fila Shenzhen Parts Co. abre el panel.', estado: aplicar([]) },
      { n: '02', titulo: 'Panel · Origen', nota: 'Panel 480 px sobre el home atenuado; Cuenta Principal MXN seleccionada.', estado: aplicar(abrir) },
      { n: '03', titulo: 'Panel · Revisión', nota: 'BloqueMonto, FechaLiquidacion con Hoy, consecuencia, TDC Valiu indicativo, concepto y referencia.', estado: aplicar(revision) },
      { n: '04', titulo: 'Panel · Precio y token', nota: 'Precio ejecutable 18.092415 fijo por 1:59; cuenta regresiva real en la app (P la pausa).', estado: aplicar(precio) },
      { n: '05', titulo: 'Panel · Precio vencido', nota: 'Alert error, montos vuelven al indicativo, token deshabilitado.', estado: aplicar([...precio, ...vencer()]) },
      { n: '06', titulo: 'Confirmación', nota: '"Pago enviado" + badge En proceso; el home detrás ya está actualizado.', estado: aplicar([...precio, ...TOKEN]) },
      { n: '07', titulo: 'Home con la posición resuelta', nota: 'Aviso success, USD "Alcanza", Shenzhen pasa a Realizados con "En proceso", MXN 1,152,861.38.', estado: aplicar([...precio, ...TOKEN, { tipo: 'volverInicio' }]) },
    ],
  },
  {
    titulo: 'Flujo principal · Fecha valor',
    nota: 'Rama desde 03: el usuario elige jue 8, cierra hoy el precio y el pago queda Pactada',
    frames: [
      { n: '03B', titulo: 'Panel · Revisión con fecha', nota: 'Variante de 03 con jue 8 elegido: el precio se cierra hoy y el dinero sale ese día.', estado: aplicar(revisionB) },
      { n: '04B', titulo: 'Panel · Precio y token con fecha', nota: 'Igual al 04, con el día en que sale el dinero en el resumen.', estado: aplicar(precioB) },
      { n: '06B', titulo: 'Confirmación · Pago pactado', nota: 'La operación queda Pactada hasta que sale el dinero.', estado: aplicar([...precioB, ...TOKEN]) },
      { n: '07B', titulo: 'Home con el pago pactado', nota: 'USD ya alcanza; el saldo en pesos no cambia hasta el jue 8.', estado: aplicar([...precioB, ...TOKEN, { tipo: 'volverInicio' }]) },
    ],
  },
  {
    titulo: 'Pestaña Operar clásico',
    nota: 'El formulario actual con los patrones corregidos',
    frames: [
      { n: '08', titulo: 'Operar clásico · Comprar, vacío', nota: 'Badge de mercado, TDC indicativo visible desde el inicio, un solo CTA deshabilitado hasta completar.', estado: aplicar(operar) },
      { n: '09', titulo: 'Operar clásico · Selector de par', nota: 'Selector agrupado: primero los pares de tus posiciones, después el resto.', estado: aplicar([...operar, { tipo: 'opParAbierto', abierto: true }]) },
      { n: '10', titulo: 'Operar clásico · Compra completa, precio indicativo', nota: 'El lado que escribes queda con borde activo y el otro se calcula en vivo; el CTA se habilita recién acá.', estado: aplicar(compraLlena) },
      { n: '11', titulo: 'Operar clásico · Precio fijo y token', nota: 'Precio ejecutable con cuenta regresiva y token dentro del formulario.', estado: aplicar(precioOp) },
      { n: '12', titulo: 'Operar clásico · Precio vencido', nota: 'Al vencer, los montos vuelven al indicativo y la única salida es pedir un precio nuevo.', estado: aplicar([...precioOp, ...vencer()]) },
      { n: '13', titulo: 'Operar clásico · Vender con error de saldo', nota: 'Error inline bajo el campo, con el saldo disponible; CTA deshabilitado.', estado: aplicar([...operar, { tipo: 'opTipo', valor: 'vender' }, { tipo: 'opMonto', lado: 'izq', valor: '5000' }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestino', destinoId: 'mxn' }, { tipo: 'opMotivo', motivo: 'Venta de divisas' }]) },
      { n: '14', titulo: 'Operar clásico · Transferir, selector de destino', nota: 'Destino con buscador y grupos (tus cuentas, destinatarios) en lugar del modal.', estado: aplicar([...transfer, { tipo: 'opDestinoBusqueda', texto: 'Logí' }]) },
      { n: '15', titulo: 'Operar clásico · Transferencia lista, token', nota: 'Transferencia en la misma divisa: sin TDC ni precio; el token se pide en el mismo lugar.', estado: aplicar([...transfer, { tipo: 'opDestino', destinoId: 'log' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMotivo', motivo: 'Pago a proveedores' }, { tipo: 'opReferencia', referencia: 'Flete OCT-02' }, { tipo: 'opContinuar' }]) },
      { n: '16', titulo: 'Operar clásico · Mercado cerrado', nota: 'Fuera de horario: aviso con la próxima apertura, formulario editable y CTA deshabilitado.', estado: aplicar([...compraLlena, { tipo: 'mercado', mercado: 'cerrado' }]) },
    ],
  },
  {
    titulo: 'Onboarding',
    nota: 'Recorrido contextual de 4 pasos al entrar por primera vez · Atrás / Siguiente y cierre en cualquier momento · "Empezar" o × vuelven al home',
    frames: [0, 1, 2, 3].map((i) => ({
      n: String(17 + i),
      titulo: `Onboarding · Paso ${i + 1} de 4`,
      nota: '',
      estado: aplicar([{ tipo: 'onboardingIniciar' }, ...Array.from({ length: i }, () => ({ tipo: 'onboardingSiguiente' as const }))]),
    })),
  },
];

export const FRAMES: Frame[] = FILAS_TABLERO.flatMap((f) => f.frames);
export const HOY_TABLERO = HOY;
