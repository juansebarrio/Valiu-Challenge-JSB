// src/data/escenario-turismo.ts — datos del flujo secundario (challenge 2) tal como se ven en los frames S01–S08.
// Marcado "inventado": no viene del brief; se eligió para completar la pantalla.
// Misma forma que escenario-importadora.ts; si el tipo del proyecto cambió, adaptar los nombres de campo al tipo actual.
export const HOY = new Date(2026, 9, 6, 9, 40); // martes 6 de octubre de 2026

export const empresa = 'Viajes Altavista S.A. de C.V.'; // inventado
export const usuario = { nombre: 'Mariana L.', rol: 'Administración', iniciales: 'ML' }; // inventado

export const cuentas = [
  { id: 'mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '4410', saldo: 420000.0 },
  { id: 'usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '8821', saldo: 6000.0 },
  { id: 'eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '9034', saldo: 0.0 },
] as const;

export const pagosFuturos = [
  { id: 't-p2', destinatario: 'Mayorista Caribe', monto: 2500.0, divisa: 'USD', fecha: new Date(2026, 9, 8), referencia: 'Bloqueo nov-26' /* inventado */, concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'USD', banco: 'Banco Popular', mascara: '3317' } },
  { id: 't-p1', destinatario: 'Hotel Gran Vía Madrid', monto: 4200.0, divisa: 'EUR', fecha: new Date(2026, 9, 9), referencia: 'Reserva 88213' /* inventado */, concepto: 'Pago a proveedores', cuentaDestino: { divisa: 'EUR', banco: 'CaixaBank', mascara: '6620' } },
];
export const pagosFuturosMXN = { cantidad: 0, total: 0 };

// El cobro que dispara el flujo: "Usar para pagar" abre el panel en el paso `pago`
export const loNuevo = { id: 't-n1', monto: 95000.0, divisa: 'MXN', de: 'Familia Ortega', hora: '08:15' /* inventado */, banco: 'BBVA México', referencia: 'Paquete Madrid', cuentaId: 'mxn' };

export const realizados = [
  { fecha: new Date(2026, 9, 6, 8, 15), nombre: 'Familia Ortega', monto: 95000.0, divisa: 'MXN' },
  { fecha: new Date(2026, 9, 5, 12, 10), nombre: 'Aerolínea Centro', monto: -38500.0, divisa: 'MXN' }, // inventado
  { fecha: new Date(2026, 9, 2, 11, 5), nombre: 'Familia Ríos', monto: 62000.0, divisa: 'MXN' }, // inventado
];

// Pares de las posiciones. EUR/MXN primero (el par de la decisión), con tendencia; USD/MXN compacto.
export const tiposDeCambio = [
  { par: 'EUR/MXN', base: 'EUR', compra: 21.25, venta: 21.1 /* inventado */, ejecutable: 21.25145 /* inventado */, tendenciaDia: [21.231, 21.238, 21.235, 21.246, 21.242, 21.255, 21.249, 21.25] /* inventado */ },
  { par: 'USD/MXN', base: 'USD', compra: 18.091183, venta: 18.032135 },
];
// Cross EUR/USD dado por el pedido; solo se usa para la consecuencia de pagar desde la Cuenta USD
export const eurUsd = 1.085;
// TDC indicativo en vivo (demo): banda alrededor de compra EUR/MXN, un paso al azar cada 2 s; congelado al pedir precio
export const bandaEnVivo = { centro: 21.25, amplitud: 0.0012, pasoMaximo: 0.0004, intervaloMs: 2000 };

// Paso "¿Qué pagas con este cobro?" (S02): cuánto del cobro usa cada pago y su consecuencia
export const opcionesPago = [
  { pagoId: 't-p1', usaMXN: 89250.0, consecuencia: 'Cubre el faltante en EUR', tono: 'ok', seleccionada: true },
  { pagoId: 't-p2', usaMXN: 45227.96, consecuencia: 'Ya lo cubre tu Cuenta USD', tono: 'neutro', seleccionada: false },
];
export const restoDelCobro = 5750.0; // 95,000.00 − 89,250.00 (indicativo)

// Paso origen (S03)
export const opcionesOrigen = [
  { cuentaId: 'mxn', pagas: 89250.0, divisa: 'MXN', consecuencia: 'Cubre el faltante en EUR', tono: 'ok', seleccionada: true, nota: 'incluye el cobro de hoy' },
  { cuentaId: 'usd', pagas: 4557.0, divisa: 'USD', consecuencia: 'Te faltarían 1,057.00 USD el jueves', tono: 'warn', seleccionada: false },
  { cuentaId: 'eur', pagas: 4200.0, divisa: 'EUR', consecuencia: 'Sin saldo', tono: 'neutro', deshabilitada: true },
];

// Resultado esperado del flujo
export const pagoHotel = { recibe: 4200.0, pagas: 89256.09, tdc: 21.25145, fechaValor: new Date(2026, 9, 9), saldoMXNDespues: 330743.91 };
// Proyecciones mar→vie: EUR en cero hasta el jueves y −4,200 el viernes (S01); USD cae el jueves con el pago a Mayorista Caribe
export const proyeccionEUR = [0, 0, 0, -4200];
export const proyeccionUSD = [6000, 6000, 3500, 3500];
