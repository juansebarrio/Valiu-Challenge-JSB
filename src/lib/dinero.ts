// src/lib/dinero.ts — dinero en centavos enteros y tipo de cambio en micro-unidades (6 decimales).
// Nada de floats para dinero: las operaciones mixtas usan BigInt y redondeo half-up.

/** Monto en centavos (entero). 1,180,000.00 MXN = 118_000_000. */
export type Centavos = number;
/** Tipo de cambio en millonésimas (entero). 18.091183 = 18_091_183. */
export type TdcMicro = number;

const MICRO = 1_000_000n;
const FACTOR_BASE = 10_000_000n;

/** División entera con redondeo half-up (alejándose de cero en el medio exacto). */
export function dividirHalfUp(num: bigint, den: bigint): bigint {
  if (den === 0n) throw new Error('división por cero');
  const negativo = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = (2n * n + d) / (2n * d);
  return negativo ? -q : q;
}

/** Solo para escribir datos del escenario: 1180000 → 118_000_000. */
export const centavos = (monto: number): Centavos => Math.round(monto * 100);
/** Solo para escribir datos del escenario: 18.091183 → 18_091_183. */
export const micro = (tdc: number): TdcMicro => Math.round(tdc * 1_000_000);

/** Centavos × tipo de cambio (p. ej. 1,500.00 USD × 18.091183 = 27,136.77 MXN). */
export const porTdc = (c: Centavos, t: TdcMicro): Centavos => Number(dividirHalfUp(BigInt(c) * BigInt(t), MICRO));
/** Centavos ÷ tipo de cambio (p. ej. 1,500.00 USD ÷ 1.171000 = 1,280.96 EUR). */
export const entreTdc = (c: Centavos, t: TdcMicro): Centavos => Number(dividirHalfUp(BigInt(c) * MICRO, BigInt(t)));
/** Tipo de cambio × factor expresado en diezmillonésimas (1.0000681 → 10_000_681). */
export const escalarTdc = (t: TdcMicro, factorDiezMillonesimas: number): TdcMicro =>
  Number(dividirHalfUp(BigInt(t) * BigInt(factorDiezMillonesimas), FACTOR_BASE));
const BP = 10_000n;
/** Centavos × tasa en puntos básicos (100 = 1 %), half-up: la comisión de un monto (C-50). */
export const porBp = (c: Centavos, bp: number): Centavos => Number(dividirHalfUp(BigInt(c) * BigInt(bp), BP));
/** Centavos ÷ (1 + tasa): lo que queda de un monto que ya incluye la comisión, half-up (C-50). */
export const sinBp = (c: Centavos, bp: number): Centavos => Number(dividirHalfUp(BigInt(c) * BP, BP + BigInt(bp)));
/** Tipo de cambio × (1 + r), con r una fracción chica (oscilación del indicativo). */
export const oscilarTdc = (t: TdcMicro, r: number): TdcMicro => Math.round(t * (1 + r));

/** Texto escrito por el usuario ("1,000" / "1000.5") → centavos. Null si no es un número. */
export function leerCentavos(texto: string): Centavos | null {
  const limpio = texto.replace(/,/g, '').trim();
  if (!/^\d*(\.\d{0,2})?$/.test(limpio) || limpio === '' || limpio === '.') return null;
  const [ent, dec = ''] = limpio.split('.');
  return Number(ent || '0') * 100 + Number((dec + '00').slice(0, 2));
}

/** Solo para gráficas: centavos → número de pantalla. */
export const aNumero = (c: Centavos) => c / 100;
