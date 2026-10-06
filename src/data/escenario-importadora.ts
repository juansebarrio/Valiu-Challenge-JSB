// src/data/escenario-importadora.ts — datos del flujo principal tal como se ven en los frames.
// Marcado "inventado": no viene del brief; se eligió para completar la pantalla.
import type { Divisa } from '@/lib/fx';

export const HOY = new Date(2026, 9, 6, 10, 42); // martes 6 de octubre de 2026

export const empresa = 'Servicios Corporativos KAAX';

export type CuentaId = 'mxn' | 'usd' | 'eur';

export interface Cuenta {
  id: CuentaId;
  nombre: string;
  divisa: Divisa;
  mascara: string;
  saldo: number;
  banco: string;
}

export const cuentas: readonly Cuenta[] = [
  { id: 'mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '1025', saldo: 1180000.0, banco: 'Banco BASE' },
  { id: 'usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '2024', saldo: 2000.0, banco: 'Banco BASE' },
  { id: 'eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '3033', saldo: 50000.0, banco: 'Banco BASE' },
];

/** Orden de las TarjetaPosicion en el home (frames 01–07): la divisa de los pagos cargados primero, después pesos y euros. */
export const ORDEN_POSICIONES: CuentaId[] = ['usd', 'mxn', 'eur'];

export const NOMBRE_DIVISA: Record<Divisa, { singular: string; plural: string; con: string }> = {
  MXN: { singular: 'Peso', plural: 'Pesos', con: 'pesos' },
  USD: { singular: 'Dólar', plural: 'Dólares', con: 'dólares' },
  EUR: { singular: 'Euro', plural: 'Euros', con: 'euros' },
  GBP: { singular: 'Libra', plural: 'Libras', con: 'libras' },
  CAD: { singular: 'Dólar canadiense', plural: 'Dólares canadienses', con: 'dólares canadienses' },
};

export interface CuentaDestino {
  divisa: Divisa;
  banco: string;
  mascara: string;
}

export interface PagoFuturo {
  id: string;
  destinatario: string;
  monto: number;
  divisa: Divisa;
  fecha: Date;
  referencia: string;
  concepto: string;
  cuentaDestino: CuentaDestino;
}

export const pagosFuturos: readonly PagoFuturo[] = [
  { id: 'p1', destinatario: 'Shenzhen Parts Co.', monto: 1500.0, divisa: 'USD', fecha: new Date(2026, 9, 8), referencia: 'Factura 0457', concepto: 'Pago de factura', cuentaDestino: { divisa: 'USD', banco: 'HSBC Hong Kong', mascara: '4410' } },
  { id: 'p2', destinatario: 'Logística Pacífico', monto: 1000.0, divisa: 'USD', fecha: new Date(2026, 9, 9), referencia: 'Flete OCT-02', concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'USD', banco: 'Citibanamex', mascara: '0931' } },
  { id: 'p3', destinatario: 'Asia Packaging', monto: 500.0, divisa: 'USD', fecha: new Date(2026, 9, 9), referencia: 'inventado', concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'USD', banco: 'DBS Singapur', mascara: '7712' } },
  // 7 pagos en MXN por 80,350.50 (brief); el reparto por fecha es inventado y no se muestra en pantalla
];
export const pagosFuturosMXN = { cantidad: 7, total: 80350.5 };

export const loNuevo = { monto: 180000.0, divisa: 'MXN' as Divisa, de: 'Comercial Norte', hora: '10:42', banco: 'BBVA México', referencia: 'factura 2231' };

export interface Realizado {
  fecha: Date;
  nombre: string;
  monto: number;
  divisa: Divisa;
}

export const realizados: readonly Realizado[] = [
  { fecha: HOY, nombre: 'Comercial Norte', monto: 180000.0, divisa: 'MXN' },
  { fecha: new Date(2026, 9, 4), nombre: 'Logística y Abastecimiento', monto: -1250.5, divisa: 'MXN' },
  { fecha: new Date(2026, 9, 1), nombre: 'Distribuidora Norte', monto: 50000.0, divisa: 'MXN' },
];

export const tipoDeCambio = {
  par: 'USD/MXN',
  compra: 18.091183,
  venta: 18.032135,
  ejecutable: 18.092415,
  /** inventado */
  tendenciaDia: [18.062, 18.071, 18.068, 18.084, 18.079, 18.095, 18.088, 18.091],
  hora: '10:42',
};

/** Banda del tipo de cambio "en vivo" (±, inventado) y segundos que dura el precio fijo. */
export const BANDA_TDC = 0.003;
export const DURACION_PRECIO_S = 120;

// Resultado esperado del flujo (frames 06 y 07)
export const pagoShenzhen = { recibe: 1500.0, pagas: 27138.62, tdc: 18.092415, saldoMXNDespues: 1152861.38 };
// Proyección USD mar→vie (frame 01): 2,000 hasta el miércoles, 500 el jueves, −1,000 el viernes
export const proyeccionUSD = [2000, 2000, 500, -1000];
export const proyeccionUSDResuelta = [2000, 2000, 2000, 500];

/** Pares del selector de Operar clásico: primero los de tus posiciones, después el resto. */
export const PARES_SELECTOR: { titulo: string; items: { par: string; nombre: string }[] }[] = [
  { titulo: 'Tus posiciones', items: [{ par: 'USD/MXN', nombre: 'Dólar · Peso' }, { par: 'EUR/MXN', nombre: 'Euro · Peso' }] },
  { titulo: 'Otros pares', items: [{ par: 'EUR/USD', nombre: 'Euro · Dólar' }, { par: 'GBP/MXN', nombre: 'Libra · Peso' }, { par: 'CAD/MXN', nombre: 'Dólar canadiense · Peso' }] },
];

/** Destinos de Operar clásico: cuentas propias + destinatarios con cuenta en cada divisa. */
export interface Destino {
  id: string;
  divisa: Divisa;
  nombre: string;
  banco: string;
  mascara: string;
  propia: boolean;
}

export const destinos: readonly Destino[] = [
  ...cuentas.map((c): Destino => ({ id: c.id, divisa: c.divisa, nombre: c.nombre, banco: c.banco, mascara: c.mascara, propia: true })),
  { id: 'log', divisa: 'USD', nombre: 'Logística Pacífico', banco: 'Citibanamex', mascara: '0931', propia: false },
  { id: 'sz', divisa: 'USD', nombre: 'Shenzhen Parts Co.', banco: 'HSBC Hong Kong', mascara: '4410', propia: false },
  { id: 'ap', divisa: 'USD', nombre: 'Asia Packaging', banco: 'DBS Singapur', mascara: '7712', propia: false },
  { id: 'cn', divisa: 'MXN', nombre: 'Comercial Norte', banco: 'Banorte', mascara: '5678', propia: false }, // inventado
];

export const MOTIVOS = ['Pago de factura', 'Pago a proveedores', 'Compra de divisas', 'Venta de divisas', 'Nómina', 'Pago de servicios', 'Transferencia entre cuentas'];

/** Horario de operación (hora de CDMX), solo para el aviso de mercado cerrado. */
export const HORARIO = { abre: '6:30', cierra: '16:30' };
