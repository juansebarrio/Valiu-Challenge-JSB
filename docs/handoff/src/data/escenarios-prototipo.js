// src/data/escenarios.js — escenarios del challenge 1.
// Dato con `inventado: true` = no viene del pedido ni del brief; se eligió para completar la pantalla.
// Prototipo: expone window.VALIU_DATA. En Next.js pasa a src/data/escenarios.ts.
window.VALIU_DATA = {
  hoy: '2026-10-06T09:40:00',
  escenarios: {
    importadora: {
      id: 'importadora',
      empresa: 'Importadora del Bajío S.A. de C.V.', // inventado
      usuario: 'Jorge R.',
      cuentas: [
        { id: 'mxn1', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '1025', saldo: 1180000.0, banco: 'Banco BASE' },
        { id: 'usd1', nombre: 'Cuenta USD', divisa: 'USD', mascara: '2024', saldo: 2000.0, banco: 'Banco BASE' },
        { id: 'eur1', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '3033', saldo: 50000.0, banco: 'Banco BASE' }
      ],
      // Cuenta propia en otro banco, de ejemplo (inventado)
      cuentasOtroBanco: [{ id: 'ext1', nombre: 'Cuenta USD empresa', divisa: 'USD', mascara: '7781', banco: 'BBVA', inventado: true }],
      destinatarios: [
        { empresa: 'Shenzhen Parts Co.', cuentas: [{ id: 'd1', divisa: 'USD', mascara: '4410', banco: 'HSBC Hong Kong' }] },
        { empresa: 'Logística Pacífico', cuentas: [{ id: 'd2', divisa: 'USD', mascara: '0931', banco: 'Citibanamex' }, { id: 'd3', divisa: 'MXN', mascara: '1048', banco: 'BBVA México' }] },
        { empresa: 'Aduanas Nogales', cuentas: [{ id: 'd5', divisa: 'USD', mascara: '2210', banco: 'Santander' }], inventado: true },
        { empresa: 'Comercial Norte', cuentas: [{ id: 'd4', divisa: 'MXN', mascara: '5678', banco: 'Banorte' }] }
      ],
      // Pagos cargados con fecha: 3,000.00 USD (pedido) y 80,350.50 MXN (pedido); el reparto es inventado
      pagos: [
        { id: 'p3', destinatarioId: 'd5', destinatario: 'Aduanas Nogales', monto: 500.0, divisa: 'USD', fecha: '2026-10-07', referencia: 'Pedimento 26-4471', motivo: 'Pago de servicios', inventado: true },
        { id: 'p2', destinatarioId: 'd2', destinatario: 'Logística Pacífico', monto: 1000.0, divisa: 'USD', fecha: '2026-10-08', referencia: 'Flete OCT-02', motivo: 'Pago a proveedores' },
        { id: 'p4', destinatarioId: null, destinatario: 'Nómina quincenal', monto: 62000.0, divisa: 'MXN', fecha: '2026-10-08', referencia: '1a quincena oct', motivo: 'Nómina', inventado: true },
        { id: 'p1', destinatarioId: 'd1', destinatario: 'Shenzhen Parts Co.', monto: 1500.0, divisa: 'USD', fecha: '2026-10-09', referencia: 'Factura SZ-2026-114', motivo: 'Pago a proveedores' },
        { id: 'p5', destinatarioId: null, destinatario: 'CFE', monto: 18350.5, divisa: 'MXN', fecha: '2026-10-13', referencia: 'Servicio 0921', motivo: 'Pago de servicios', inventado: true }
      ],
      nuevo: [{ id: 'n1', de: 'Comercial Norte', monto: 180000.0, divisa: 'MXN', fecha: '2026-10-06T09:40:00', referencia: 'Factura CN-3310', cuentaId: 'mxn1', inventado: 'referencia y hora' }],
      realizados: [
        { id: 'r1', concepto: 'Cobro de Comercial Norte', monto: 180000.0, divisa: 'MXN', fecha: '2026-10-06T09:40:00', estado: 'Confirmada' },
        { id: 'r2', concepto: 'Compra de 500.00 USD a 18.000000', monto: -9000.0, divisa: 'MXN', fecha: '2026-10-05T18:31:00', estado: 'Enviada', inventado: true },
        { id: 'r3', concepto: 'Pago a Servicios Logísticos MX', monto: -12000.0, divisa: 'MXN', fecha: '2026-10-05T17:31:00', estado: 'Enviada', inventado: true }
      ],
      paresEnJuego: ['USD/MXN', 'EUR/MXN']
    },
    turismo: {
      id: 'turismo',
      empresa: 'Viajes Altavista S.A. de C.V.', // inventado
      usuario: 'Mariana L.', // inventado
      cuentas: [
        { id: 't-mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '4410', saldo: 420000.0, banco: 'Banco BASE' },
        { id: 't-usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '8821', saldo: 6000.0, banco: 'Banco BASE' },
        { id: 't-eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '9034', saldo: 0.0, banco: 'Banco BASE' }
      ],
      cuentasOtroBanco: [],
      destinatarios: [
        { empresa: 'Hotel Gran Vía Madrid', cuentas: [{ id: 't-d1', divisa: 'EUR', mascara: '6620', banco: 'CaixaBank' }] },
        { empresa: 'Mayorista Caribe', cuentas: [{ id: 't-d2', divisa: 'USD', mascara: '3317', banco: 'Banco Popular' }] },
        { empresa: 'Familia Ortega', cuentas: [{ id: 't-d3', divisa: 'MXN', mascara: '7702', banco: 'BBVA México' }], inventado: true }
      ],
      // Pagos futuros (pedido); referencias y motivos inventados
      pagos: [
        { id: 't-p2', destinatarioId: 't-d2', destinatario: 'Mayorista Caribe', monto: 2500.0, divisa: 'USD', fecha: '2026-10-08', referencia: 'Bloqueo nov-26', motivo: 'Pago a proveedores', inventado: 'referencia' },
        { id: 't-p1', destinatarioId: 't-d1', destinatario: 'Hotel Gran Vía Madrid', monto: 4200.0, divisa: 'EUR', fecha: '2026-10-09', referencia: 'Reserva 88213', motivo: 'Pago a proveedores', inventado: 'referencia' }
      ],
      nuevo: [{ id: 't-n1', de: 'Familia Ortega', monto: 95000.0, divisa: 'MXN', fecha: '2026-10-06T08:15:00', referencia: 'Paquete Madrid', cuentaId: 't-mxn', inventado: 'hora' }],
      realizados: [
        { id: 't-r1', concepto: 'Cobro de Familia Ortega', monto: 95000.0, divisa: 'MXN', fecha: '2026-10-06T08:15:00', estado: 'Confirmada' },
        { id: 't-r2', concepto: 'Pago a Aerolínea Centro', monto: -38500.0, divisa: 'MXN', fecha: '2026-10-05T12:10:00', estado: 'Enviada', inventado: true }
      ],
      paresEnJuego: ['EUR/MXN', 'EUR/USD', 'USD/MXN']
    }
  },
  // Tendencia de 7 días del par principal, solo para la gráfica (inventado)
  tendencia: { 'USD/MXN': [18.21, 18.17, 18.12, 18.15, 18.09, 18.06, 18.09], 'EUR/MXN': [21.02, 21.1, 21.18, 21.14, 21.22, 21.19, 21.25] }
};
window.dispatchEvent(new Event('valiu-data'));
