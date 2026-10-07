// src/data/escenario.ts — escenario y datos del prototipo. Todos los datos son ficticios.
// Montos en centavos (dinero.ts). Nada de montos escritos a mano en los componentes: todo sale de acá y de src/lib.
import { centavos, type Centavos } from '@/lib/dinero';
import { PARES, type Divisa, type TablaPares } from '@/lib/fx';
import * as fmt from '@/lib/format';

/** Fecha fija del escenario: martes 6 de octubre de 2026, 10:42 hora de CDMX. Nunca se usa la fecha del sistema. */
export const HOY = new Date(2026, 9, 6, 10, 42);

export const empresa = 'Servicios Corporativos KAAX';

/** Arquetipos de empresa de la pantalla inicial: la importadora (flujo principal) y la minorista de turismo (flujo secundario). */
export type ArquetipoId = 'importadora' | 'turismo';

export type EscenarioNombre = 'faltante' | 'resuelta' | 'pactada' | 'sin-saldo' | 'mercado-cerrado' | 'otras-divisas';
export const ESCENARIOS: EscenarioNombre[] = ['faltante', 'resuelta', 'pactada', 'sin-saldo', 'mercado-cerrado', 'otras-divisas'];

export type CuentaId = 'mxn' | 'usd' | 'eur';

export interface Cuenta {
  id: CuentaId;
  nombre: string;
  divisa: Divisa;
  mascara: string;
  saldo: Centavos;
  banco: string;
  /** CLABE ficticia de 18 dígitos (solo la cuenta en pesos, para "Ver datos para depositar"). */
  clabe?: string;
}

export interface CuentaDestino {
  divisa: Divisa;
  banco: string;
  mascara: string;
}

export interface Destinatario extends CuentaDestino {
  id: string;
  nombre: string;
}

export interface PagoFuturo {
  id: string;
  destinatarioId: string;
  destinatario: string;
  monto: Centavos;
  divisa: Divisa;
  fecha: Date;
  referencia: string;
  motivo: string;
  cuentaDestino: CuentaDestino;
}

export interface Realizado {
  id: string;
  fecha: Date;
  nombre: string;
  monto: Centavos;
  divisa: Divisa;
  /** Datos del comprobante que muestra el detalle del movimiento (ficticios). */
  tipo: 'cobro' | 'pago';
  hora: string;
  banco: string;
  mascara: string;
  referencia: string;
  motivo?: string;
  estado: 'Confirmada' | 'Enviada';
}

/** El cobro de hoy (bloque "Cobraste hoy" del inicio): `id` es el del realizado que lo registra y `cuentaId` la cuenta donde entró. */
export interface Cobro {
  id: string;
  cuentaId: CuentaId;
  monto: Centavos;
  divisa: Divisa;
  de: string;
  hora: string;
  banco: string;
  referencia: string;
}

/** Clase de una operación: pago a un tercero; compra, venta o transferencia a una cuenta propia (claseDe en derivados.ts). */
export type ClaseOperacion = 'pago' | 'compra' | 'venta' | 'transferencia';

/** Comisión por clase de operación en puntos básicos enteros (100 = 1 %). Hoy 0 en todas; la pantalla ya muestra la fila "Comisión" (C-50). */
export const COMISIONES_BP: Record<ClaseOperacion, number> = { pago: 0, compra: 0, venta: 0, transferencia: 0 };

export interface Datos {
  cuentas: Cuenta[];
  /** Cuenta que paga los pagos cargados en divisas en las que la empresa no tiene cuenta, con tipo de cambio (C-54). */
  cuentaFondeo: CuentaId;
  destinatarios: Destinatario[];
  pagosFuturos: PagoFuturo[];
  loNuevo: Cobro | null;
  realizados: Realizado[];
  mercado: 'abierto' | 'cerrado';
  /** Comisión por clase de operación, en puntos básicos (C-50). */
  comisiones: Record<ClaseOperacion, number>;
}

/** Una empresa de ejemplo: sus datos base más lo que cambia entre arquetipos (tipo de cambio, par de la decisión, orden de las tarjetas). */
export interface Arquetipo {
  id: ArquetipoId;
  empresa: string;
  usuario: { nombre: string; rol: string; iniciales: string };
  datos: Datos;
  /** Tipo de cambio indicativo base por par (micro-unidades); el "en vivo" oscila alrededor de estos valores. */
  pares: TablaPares;
  /** Pares de tus posiciones en la tarjeta de tipo de cambio: el primero es el de la decisión de la semana y viene elegido (D-33). */
  paresTarjeta: string[];
  /** Orden de las TarjetaPosicion: la divisa con faltante primero; no cambia durante la sesión (D-34). */
  ordenPosiciones: CuentaId[];
  /** Pago que resuelven los escenarios "resuelta" y "pactada". */
  pagoPrincipal: string;
  /** Escenario "otras-divisas" (C-54): el pago cargado que se suma al base, en una divisa en la que la empresa no tiene cuenta. */
  pagoOtrasDivisas: { destinatarioId: string; monto: number; fecha: Date; referencia: string };
  /** "Usar para pagar": paso Destino (como quedó en el código para la importadora) o paso Pago "¿Qué pagas con este cobro?" (D-30). */
  /** Tres líneas de contexto de la tarjeta de la pantalla inicial. */
  contexto: string[];
}

/** Orden de las TarjetaPosicion en el inicio (frames 01–07): la divisa de los pagos cargados primero, después pesos y euros. */
export const ORDEN_POSICIONES: CuentaId[] = ['usd', 'mxn', 'eur'];

export const NOMBRE_DIVISA: Record<Divisa, { singular: string; plural: string; con: string }> = {
  MXN: { singular: 'Peso', plural: 'Pesos', con: 'pesos' },
  USD: { singular: 'Dólar', plural: 'Dólares', con: 'dólares' },
  EUR: { singular: 'Euro', plural: 'Euros', con: 'euros' },
  GBP: { singular: 'Libra', plural: 'Libras', con: 'libras' },
  CAD: { singular: 'Dólar canadiense', plural: 'Dólares canadienses', con: 'dólares canadienses' },
};

const CUENTAS: Cuenta[] = [
  { id: 'mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '1025', saldo: centavos(1_180_000), banco: 'Banco BASE', clabe: '012180000010250014' },
  { id: 'usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '2024', saldo: centavos(2_000), banco: 'Banco BASE' },
  { id: 'eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '3033', saldo: centavos(50_000), banco: 'Banco BASE' },
];

const DESTINATARIOS: Destinatario[] = [
  { id: 'sz', nombre: 'Shenzhen Parts Co.', divisa: 'USD', banco: 'HSBC Hong Kong', mascara: '4410' },
  { id: 'log', nombre: 'Logística Pacífico', divisa: 'USD', banco: 'Citibanamex', mascara: '0931' },
  { id: 'ap', nombre: 'Asia Packaging', divisa: 'USD', banco: 'DBS Singapur', mascara: '7712' },
  { id: 'tt', nombre: 'Thames Tooling Ltd.', divisa: 'GBP', banco: 'Barclays', mascara: '6120' }, // inventado (C-54)
  { id: 'mf', nombre: 'Maple Freight Inc.', divisa: 'CAD', banco: 'RBC', mascara: '4471' }, // inventado (C-54)
  // Proveedores mexicanos ficticios de los siete pagos en MXN
  { id: 'pin', nombre: 'Papelería Industrial del Norte', divisa: 'MXN', banco: 'BBVA México', mascara: '3301' },
  { id: 'tgo', nombre: 'Transportes del Golfo', divisa: 'MXN', banco: 'Banorte', mascara: '8824' },
  { id: 'emo', nombre: 'Empaques Monterrey', divisa: 'MXN', banco: 'Santander', mascara: '5190' },
  { id: 'seb', nombre: 'Servicios Eléctricos del Bajío', divisa: 'MXN', banco: 'HSBC México', mascara: '6072' },
  { id: 'adn', nombre: 'Aduanas Nogales', divisa: 'MXN', banco: 'Citibanamex', mascara: '2210' },
  { id: 'tel', nombre: 'Telecom Empresarial', divisa: 'MXN', banco: 'Scotiabank', mascara: '4458' },
  { id: 'lca', nombre: 'Limpieza Corporativa Azteca', divisa: 'MXN', banco: 'Banregio', mascara: '9913' },
  { id: 'cn', nombre: 'Comercial Norte', divisa: 'MXN', banco: 'Banorte', mascara: '5678' },
];

const pago = (id: string, destinatarioId: string, monto: number, fecha: Date, referencia: string, motivo = 'Pago a proveedores'): PagoFuturo => {
  const dst = DESTINATARIOS.find((x) => x.id === destinatarioId)!;
  return { id, destinatarioId, destinatario: dst.nombre, monto: centavos(monto), divisa: dst.divisa, fecha, referencia, motivo, cuentaDestino: { divisa: dst.divisa, banco: dst.banco, mascara: dst.mascara } };
};

/** Pagos futuros en USD (brief) y los siete en MXN (ficticios, desde el lunes 12 para no mover la semana del frame 01). */
const PAGOS_USD: PagoFuturo[] = [
  pago('p1', 'sz', 1_500, new Date(2026, 9, 8), 'Factura 0457'),
  pago('p2', 'log', 1_000, new Date(2026, 9, 9), 'Flete OCT-02'),
  pago('p3', 'ap', 500, new Date(2026, 9, 9), 'Pedido AP-118'),
];
const PAGOS_MXN: PagoFuturo[] = [
  pago('m1', 'pin', 12_400, new Date(2026, 9, 12), 'Factura 2290'),
  pago('m2', 'tgo', 9_850.5, new Date(2026, 9, 13), 'Flete GOL-77'),
  pago('m3', 'emo', 15_000, new Date(2026, 9, 14), 'Factura 0912'),
  pago('m4', 'seb', 7_600, new Date(2026, 9, 15), 'Servicio 10-26', 'Pago de servicios'),
  pago('m5', 'adn', 18_500, new Date(2026, 9, 16), 'Pedimento 26-4471'),
  pago('m6', 'tel', 6_000, new Date(2026, 9, 19), 'Servicio 0921', 'Pago de servicios'),
  pago('m7', 'lca', 11_000, new Date(2026, 9, 20), 'Factura 0344'),
];
// 12,400 + 9,850.50 + 15,000 + 7,600 + 18,500 + 6,000 + 11,000 = 80,350.50 (brief)

/** Realizados del frame 01; hora, banco, cuenta y referencia son ficticios (los muestra el detalle del movimiento). */
const REALIZADOS: Realizado[] = [
  { id: 'r1', fecha: HOY, nombre: 'Comercial Norte', monto: centavos(180_000), divisa: 'MXN', tipo: 'cobro', hora: '10:42', banco: 'BBVA México', mascara: '5678', referencia: 'factura 2231', estado: 'Confirmada' },
  { id: 'r2', fecha: new Date(2026, 9, 4), nombre: 'Logística y Abastecimiento', monto: centavos(-1_250.5), divisa: 'MXN', tipo: 'pago', hora: '12:15', banco: 'Banorte', mascara: '3340', referencia: 'Servicio OCT-01', motivo: 'Pago de servicios', estado: 'Enviada' },
  { id: 'r3', fecha: new Date(2026, 9, 1), nombre: 'Distribuidora Norte', monto: centavos(50_000), divisa: 'MXN', tipo: 'cobro', hora: '09:05', banco: 'Santander', mascara: '7781', referencia: 'factura 2198', estado: 'Confirmada' },
];

const LO_NUEVO: Cobro = { id: REALIZADOS[0].id, cuentaId: 'mxn', monto: REALIZADOS[0].monto, divisa: REALIZADOS[0].divisa, de: REALIZADOS[0].nombre, hora: REALIZADOS[0].hora, banco: REALIZADOS[0].banco, referencia: REALIZADOS[0].referencia };

/** Tipo de cambio indicativo base de la importadora (dos lados, sin punto medio; valores del handoff). */
export const TDC_BASE: TablaPares = Object.fromEntries(Object.entries(PARES).map(([k, v]) => [k, { compra: v.compra, venta: v.venta }]));
export const OSCILACION_TDC = 0.00002; // ±0.002 %
export const OSCILACION_MS = [3000, 5000] as const; // un paso cada 3 a 5 segundos
/** Tendencia intradía de cada par, solo para la gráfica de la tarjeta de tipo de cambio (inventado; termina en el indicativo de compra). */
export const TENDENCIAS: Record<string, number[]> = {
  'USD/MXN': [18.062, 18.071, 18.068, 18.084, 18.079, 18.095, 18.088, 18.091],
  'EUR/MXN': [21.231, 21.238, 21.235, 21.246, 21.242, 21.255, 21.249, 21.25],
  'EUR/USD': [1.1712, 1.1725, 1.1719, 1.1738, 1.1731, 1.1746, 1.1742, 1.175],
  'GBP/MXN': [24.262, 24.271, 24.268, 24.284, 24.279, 24.295, 24.288, 24.3],
  'CAD/MXN': [13.171, 13.178, 13.175, 13.186, 13.182, 13.195, 13.189, 13.2],
};
export const HORA_TDC = '10:42';

/** La importadora del flujo principal (frames 01–20). */
export const IMPORTADORA: Arquetipo = {
  id: 'importadora',
  empresa,
  usuario: { nombre: 'Jorge R.', rol: 'Tesorería', iniciales: 'JR' },
  datos: { cuentas: CUENTAS, cuentaFondeo: 'mxn', destinatarios: DESTINATARIOS, pagosFuturos: [...PAGOS_USD, ...PAGOS_MXN], loNuevo: LO_NUEVO, realizados: REALIZADOS, mercado: 'abierto', comisiones: COMISIONES_BP },
  pares: TDC_BASE,
  paresTarjeta: ['USD/MXN', 'EUR/MXN'],
  ordenPosiciones: ORDEN_POSICIONES,
  pagoPrincipal: 'p1',
  pagoOtrasDivisas: { destinatarioId: 'tt', monto: 40_000, fecha: new Date(2026, 9, 9), referencia: 'Factura TT-3381' /* inventado */ },
  contexto: [
    `Faltan ${fmt.monto(PAGOS_USD.reduce((acc, p) => acc + p.monto, 0) - CUENTAS[1].saldo, 'USD')} para los pagos de la semana`,
    `Paga ${fmt.monto(PAGOS_USD[0].monto, 'USD')} a ${PAGOS_USD[0].destinatario} con pesos`,
    `Acaba de cobrar ${fmt.monto(LO_NUEVO.monto, 'MXN')} de ${LO_NUEVO.de}`,
  ],
};

/** Pago cargado de un arquetipo a uno de sus destinatarios. */
export const pagoA = (destinatarios: Destinatario[], id: string, destinatarioId: string, monto: number, fecha: Date, referencia: string, motivo = 'Pago a proveedores'): PagoFuturo => {
  const dst = destinatarios.find((x) => x.id === destinatarioId)!;
  return { id, destinatarioId, destinatario: dst.nombre, monto: centavos(monto), divisa: dst.divisa, fecha, referencia, motivo, cuentaDestino: { divisa: dst.divisa, banco: dst.banco, mascara: dst.mascara } };
};

/**
 * Datos del escenario pedido para un arquetipo. "resuelta" y "pactada" parten del base y aplican el pago principal (src/state/escenarios.ts);
 * "sin-saldo" deja la cuenta en pesos en 20,000.00 sin el cobro de hoy y sin pagos en pesos; "mercado-cerrado" solo cambia el mercado;
 * "otras-divisas" suma al base un pago cargado en una divisa sin cuenta (C-54).
 */
export function datosEscenario(nombre: EscenarioNombre, arquetipo: Arquetipo = IMPORTADORA): Datos {
  const d = arquetipo.datos;
  const base: Datos = { ...d, cuentas: d.cuentas.map((c) => ({ ...c })), pagosFuturos: [...d.pagosFuturos] };
  if (nombre === 'otras-divisas') {
    const o = arquetipo.pagoOtrasDivisas;
    return { ...base, pagosFuturos: [...base.pagosFuturos, pagoA(d.destinatarios, 'x1', o.destinatarioId, o.monto, o.fecha, o.referencia)] };
  }
  if (nombre === 'sin-saldo') {
    const cobro = d.loNuevo;
    return {
      ...base,
      cuentas: base.cuentas.map((c) => (c.id === 'mxn' ? { ...c, saldo: centavos(20_000) } : c)),
      pagosFuturos: base.pagosFuturos.filter((p) => p.divisa !== 'MXN'),
      loNuevo: null,
      realizados: cobro ? d.realizados.filter((r) => r.id !== cobro.id) : d.realizados,
    };
  }
  if (nombre === 'mercado-cerrado') return { ...base, mercado: 'cerrado' };
  return base;
}

/** Segundos que dura el precio ejecutable. */
export const DURACION_PRECIO_S = 120;
/** Milisegundos de "Confirmando…" al enviar el token. */
export const CONFIRMANDO_MS = 800;
/** Código que simula un token incorrecto. */
export const TOKEN_INCORRECTO = '000000';

/** Horario de operación: dato sin verificar, queda vacío; mientras esté vacío, el aviso de mercado cerrado no muestra horario. */
export const HORARIO: { abre: string; cierra: string } = { abre: '', cierra: '' };

export const AVISO_FUERA_DEL_PROTOTIPO = 'Esta sección no está en el prototipo.';
export const ANCHO_MINIMO = 1024;

/** Cargar un pago: la fecha de vencimiento va de hoy hasta AGENDAR_DIAS días después. */
export const AGENDAR_DIAS = 90;
