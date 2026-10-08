// src/data/escenario-importadora.ts — datos del flujo principal tal como se ven en los frames.
// Marcado "inventado": no viene del brief; se eligió para completar la pantalla.
export const HOY = new Date(2026, 9, 6, 10, 42); // martes 6 de octubre de 2026

export const empresa = 'Servicios Corporativos KAAX';

export const cuentas = [
  { id: 'mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '1025', saldo: 1180000.0 },
  { id: 'usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '2024', saldo: 2000.0 },
  { id: 'eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '3033', saldo: 50000.0 },
] as const;

export const pagosFuturos = [
  { id: 'p1', destinatario: 'Shenzhen Parts Co.', monto: 1500.0, divisa: 'USD', fecha: new Date(2026, 9, 8), referencia: 'Factura 0457', concepto: 'Pago de factura', cuentaDestino: { divisa: 'USD', banco: 'HSBC Hong Kong', mascara: '4410' } },
  { id: 'p2', destinatario: 'Logística Pacífico', monto: 1000.0, divisa: 'USD', fecha: new Date(2026, 9, 9), referencia: 'Flete OCT-02', concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'USD', banco: 'Citibanamex', mascara: '0931' } },
  { id: 'p3', destinatario: 'Asia Packaging', monto: 500.0, divisa: 'USD', fecha: new Date(2026, 9, 9), referencia: 'inventado', concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'USD', banco: 'DBS Singapur', mascara: '7712' } },
  // 7 pagos en MXN por 80,350.50 (brief); el reparto por fecha es inventado y no se muestra en pantalla
];
export const pagosFuturosMXN = { cantidad: 7, total: 80350.5 };

export const loNuevo = { monto: 180000.0, divisa: 'MXN', de: 'Comercial Norte', hora: '10:42', banco: 'BBVA México', referencia: 'factura 2231' };

export const realizados = [
  { fecha: HOY, nombre: 'Comercial Norte', monto: 180000.0, divisa: 'MXN' },
  { fecha: new Date(2026, 9, 4), nombre: 'Logística y Abastecimiento', monto: -1250.5, divisa: 'MXN' },
  { fecha: new Date(2026, 9, 1), nombre: 'Distribuidora Norte', monto: 50000.0, divisa: 'MXN' },
];

export const tipoDeCambio = { par: 'USD/MXN', compra: 18.091183, venta: 18.032135, ejecutable: 18.092415, tendenciaDia: [18.062, 18.071, 18.068, 18.084, 18.079, 18.095, 18.088, 18.091] /* inventado */ };

// Resultado esperado del flujo (frames 06 y 07)
export const pagoShenzhen = { recibe: 1500.0, pagas: 27138.62, tdc: 18.092415, saldoMXNDespues: 1152861.38 };
// Proyección USD mar→vie (frame 01): 2,000 hasta el miércoles, 500 el jueves, −1,000 el viernes
export const proyeccionUSD = [2000, 2000, 500, -1000];
export const proyeccionUSDResuelta = [2000, 2000, 2000, 500];
