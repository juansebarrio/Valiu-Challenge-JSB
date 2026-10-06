// src/data/escenario-turismo.ts — datos del flujo secundario (challenge 2 · turismo), frames S01–S08.
// Misma forma que la importadora (src/data/escenario.ts). Marcado "inventado": no viene del brief; se eligió para completar la pantalla.
import { centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import type { TablaPares } from '@/lib/fx';
import { HOY, type Arquetipo, type Cobro, type Cuenta, type Destinatario, type PagoFuturo, type Realizado } from './escenario';

const CUENTAS: Cuenta[] = [
  { id: 'mxn', nombre: 'Cuenta Principal MXN', divisa: 'MXN', mascara: '4410', saldo: centavos(420_000), banco: 'Banco BASE', clabe: '012180000044100017' /* inventado */ },
  { id: 'usd', nombre: 'Cuenta USD', divisa: 'USD', mascara: '8821', saldo: centavos(6_000), banco: 'Banco BASE' },
  { id: 'eur', nombre: 'Cuenta EUR', divisa: 'EUR', mascara: '9034', saldo: centavos(0), banco: 'Banco BASE' },
];

const DESTINATARIOS: Destinatario[] = [
  { id: 'hgv', nombre: 'Hotel Gran Vía Madrid', divisa: 'EUR', banco: 'CaixaBank', mascara: '6620' },
  { id: 'mc', nombre: 'Mayorista Caribe', divisa: 'USD', banco: 'Banco Popular', mascara: '3317' },
  { id: 'fo', nombre: 'Familia Ortega', divisa: 'MXN', banco: 'BBVA México', mascara: '7702' }, // inventado
];

const pago = (id: string, destinatarioId: string, monto: number, fecha: Date, referencia: string, motivo = 'Pago a proveedores'): PagoFuturo => {
  const dst = DESTINATARIOS.find((x) => x.id === destinatarioId)!;
  return { id, destinatarioId, destinatario: dst.nombre, monto: centavos(monto), divisa: dst.divisa, fecha, referencia, motivo, cuentaDestino: { divisa: dst.divisa, banco: dst.banco, mascara: dst.mascara } };
};

/** Pagos futuros del pedido; las referencias son inventadas. */
const PAGOS: PagoFuturo[] = [
  pago('t-p2', 'mc', 2_500, new Date(2026, 9, 8), 'Bloqueo nov-26' /* inventado */),
  pago('t-p1', 'hgv', 4_200, new Date(2026, 9, 9), 'Reserva 88213' /* inventado */),
];

/** Realizados de S01; el cobro de Familia Ortega es del pedido, Aerolínea Centro y Familia Ríos son inventados (hora, banco y cuenta también). */
const REALIZADOS: Realizado[] = [
  { id: 't-r1', fecha: HOY, nombre: 'Familia Ortega', monto: centavos(95_000), divisa: 'MXN', tipo: 'cobro', hora: '08:15' /* inventado */, banco: 'BBVA México', mascara: '7702', referencia: 'Paquete Madrid', estado: 'Confirmada' },
  { id: 't-r2', fecha: new Date(2026, 9, 5), nombre: 'Aerolínea Centro', monto: centavos(-38_500), divisa: 'MXN', tipo: 'pago', hora: '12:10', banco: 'Santander', mascara: '2250', referencia: 'Boletos oct-26', motivo: 'Pago a proveedores', estado: 'Enviada' }, // inventado
  { id: 't-r3', fecha: new Date(2026, 9, 2), nombre: 'Familia Ríos', monto: centavos(62_000), divisa: 'MXN', tipo: 'cobro', hora: '11:05', banco: 'Banorte', mascara: '8190', referencia: 'Paquete Cancún', estado: 'Confirmada' }, // inventado
];

/** El cobro que dispara el flujo: "Usar para pagar" abre el panel en el paso "¿Qué pagas con este cobro?". */
const LO_NUEVO: Cobro = { id: REALIZADOS[0].id, cuentaId: 'mxn', monto: REALIZADOS[0].monto, divisa: 'MXN', de: REALIZADOS[0].nombre, hora: REALIZADOS[0].hora, banco: REALIZADOS[0].banco, referencia: REALIZADOS[0].referencia };

/**
 * Tipo de cambio del pedido: EUR/MXN compra 21.25 (venta 21.10, inventada), USD/MXN 18.091183 / 18.032135 y EUR/USD 1.175000 / 1.171000,
 * el cross que cierra con los otros dos (sección 7 del brief). El precio ejecutable sale de `ejecutable()` (fx.ts), no de un valor fijo.
 */
const PARES_TURISMO: TablaPares = {
  'USD/MXN': { compra: 18_091_183, venta: 18_032_135 },
  'EUR/USD': { compra: 1_175_000, venta: 1_171_000 },
  'EUR/MXN': { compra: 21_250_000, venta: 21_100_000 },
  'GBP/MXN': { compra: 24_300_000, venta: 24_100_000 },
  'CAD/MXN': { compra: 13_200_000, venta: 13_050_000 },
};

/** Viajes Altavista: cobra en pesos, paga en euros; la Cuenta EUR está en cero (frames S01–S08). */
export const TURISMO: Arquetipo = {
  id: 'turismo',
  empresa: 'Viajes Altavista S.A. de C.V.', // inventado
  usuario: { nombre: 'Mariana L.', rol: 'Administración', iniciales: 'ML' }, // inventado
  datos: { cuentas: CUENTAS, destinatarios: DESTINATARIOS, pagosFuturos: PAGOS, loNuevo: LO_NUEVO, realizados: REALIZADOS, mercado: 'abierto' },
  pares: PARES_TURISMO,
  paresTarjeta: ['EUR/MXN', 'USD/MXN'],
  tendencia: [21.231, 21.238, 21.235, 21.246, 21.242, 21.255, 21.249, 21.25], // inventado
  ordenPosiciones: ['eur', 'usd', 'mxn'],
  pagoPrincipal: 't-p1',
  entradaCobro: 'pago',
  contexto: [
    `La ${CUENTAS[2].nombre} está en cero: faltan ${fmt.monto(PAGOS[1].monto, 'EUR')}`,
    `Cobra ${fmt.monto(LO_NUEVO.monto, 'MXN')} de ${LO_NUEVO.de} y paga al ${PAGOS[1].destinatario} el viernes`,
    `Cierra hoy el precio; el dinero sale el ${fmt.diaCorto(PAGOS[1].fecha)}`,
  ],
};
