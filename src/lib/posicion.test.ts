import { describe, it, expect } from 'vitest';
import { diasSemana, proyeccion, diaDeCruce, posicion, evaluarOrigen, agregar, posicionesDe, cuentaQuePaga } from './posicion';
import { centavos } from './dinero';
import { PARES } from './fx';

const HOY = new Date(2026, 9, 6);
const pagosUSD = [
  { id: 'p1', monto: centavos(-1500), divisa: 'USD' as const, fecha: new Date(2026, 9, 8) },
  { id: 'p2', monto: centavos(-1000), divisa: 'USD' as const, fecha: new Date(2026, 9, 9) },
  { id: 'p3', monto: centavos(-500), divisa: 'USD' as const, fecha: new Date(2026, 9, 9) },
];
const pendientesUSD = pagosUSD.map((p) => ({ monto: -p.monto }));

describe('diasSemana', () => {
  it('martes 6 → mar 6, mié 7, jue 8, vie 9', () => {
    expect(diasSemana(HOY).map((d) => d.getDate())).toEqual([6, 7, 8, 9]);
  });
  it('viernes 9 → cuatro días hábiles', () => {
    expect(diasSemana(new Date(2026, 9, 9)).map((d) => d.getDate())).toEqual([9, 12, 13, 14]);
  });
});

describe('proyección USD (frame 01)', () => {
  it('2,000 hasta el miércoles, 500 el jueves, −1,000 el viernes', () => {
    const serie = proyeccion(centavos(2000), pagosUSD, diasSemana(HOY));
    expect(serie).toEqual([2000, 2000, 500, -1000].map(centavos));
    expect(diaDeCruce(serie)).toBe(3);
  });
});

describe('posición', () => {
  it('USD: faltan 1,000', () => {
    expect(posicion('USD', centavos(2000), agregar(pendientesUSD)).resultado).toEqual({ tipo: 'faltan', monto: centavos(1000) });
  });
  it('MXN: sobran 1,099,649.50', () => {
    expect(posicion('MXN', centavos(1_180_000), { cantidad: 7, total: centavos(80_350.5) }).resultado).toEqual({ tipo: 'sobran', monto: centavos(1_099_649.5) });
  });
  it('MXN con pactada por liquidar: sobran 1,072,510.88', () => {
    expect(posicion('MXN', centavos(1_180_000), { cantidad: 7, total: centavos(80_350.5) }, { cantidad: 1, total: centavos(27_138.62) }).resultado.monto).toBe(centavos(1_072_510.88));
  });
  it('USD con pactada por recibir: 2,000 + 1,000 − 3,000 = sobran 0', () => {
    expect(posicion('USD', centavos(2000), agregar(pendientesUSD), null, { cantidad: 1, total: centavos(1000) }).resultado).toEqual({ tipo: 'sobran', monto: 0 });
  });
  it('EUR: nada pendiente', () => {
    expect(posicion('EUR', centavos(50_000), null).resultado.tipo).toBe('nada');
  });
});

describe('evaluarOrigen (frame 02)', () => {
  const posiciones = {
    USD: posicion('USD', centavos(2000), agregar(pendientesUSD)),
    MXN: posicion('MXN', centavos(1_180_000), { cantidad: 7, total: centavos(80_350.5) }),
    EUR: posicion('EUR', centavos(50_000), null),
  };
  const dias = diasSemana(HOY);
  const proyecciones = { USD: { serie: proyeccion(centavos(2000), pagosUSD, dias), dias } };
  const base = { monto: centavos(1500), divisaDestino: 'USD' as const, destinoPropio: false, pagoCargado: true, posiciones, proyecciones, pares: PARES };
  it('MXN cubre el faltante en USD', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'MXN', saldo: centavos(1_180_000) } });
    expect(r.pagasTexto).toBe('Pagas ≈ 27,136.77 MXN');
    expect(r.consecuencia).toMatchObject({ texto: 'Cubre el faltante en USD', tono: 'ok' });
  });
  it('USD: te faltarían 1,000 para tus pagos del vie 9 (C-49)', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'USD', saldo: centavos(2000) } });
    expect(r.pagasTexto).toBe('Pagas 1,500.00 USD');
    expect(r.consecuencia).toMatchObject({ texto: 'Te faltarían 1,000.00 USD para tus pagos del vie 9', tono: 'warn' });
  });
  it('EUR también cubre el faltante en USD', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'EUR', saldo: centavos(50_000) } });
    expect(r.pagasTexto).toBe('Pagas ≈ 1,280.96 EUR');
    expect(r.consecuencia).toMatchObject({ texto: 'Cubre el faltante en USD', tono: 'ok' });
  });
  it('sin faltante que cubrir: sin chip, no cambia la decisión (C-49)', () => {
    const sinFaltante = { ...posiciones, USD: posicion('USD', centavos(5000), agregar(pendientesUSD)) };
    const r = evaluarOrigen({ ...base, posiciones: sinFaltante, origen: { divisa: 'EUR', saldo: centavos(50_000) } });
    expect(r.pagasTexto).toBe('Pagas ≈ 1,280.96 EUR');
    expect(r.consecuencia).toBeNull();
  });
  it('hoy no alcanza se puede elegir igual', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'MXN', saldo: centavos(20_000) } });
    expect(r.consecuencia).toMatchObject({ texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true });
  });
  it('compra a cuenta propia: cubre el faltante', () => {
    const r = evaluarOrigen({ ...base, monto: centavos(1000), destinoPropio: true, pagoCargado: false, origen: { divisa: 'MXN', saldo: centavos(1_180_000) } });
    expect(r.consecuencia?.texto).toBe('Cubre el faltante en USD');
  });
});

describe('pagos en divisas sin cuenta (C-54): cada pago cuenta contra la cuenta que lo va a pagar', () => {
  const VIE9 = new Date(2026, 9, 9);
  const CUENTAS = [
    { id: 'mxn', divisa: 'MXN' as const, saldo: centavos(1_180_000) },
    { id: 'usd', divisa: 'USD' as const, saldo: centavos(2000) },
    { id: 'eur', divisa: 'EUR' as const, saldo: centavos(50_000) },
  ];
  const pago = (id: string, monto: number, divisa: 'MXN' | 'USD' | 'EUR' | 'GBP' | 'CAD') => ({ id, monto: centavos(monto), divisa, fecha: VIE9 });
  const calcular = (pendientes: ReturnType<typeof pago>[], extra: Partial<Parameters<typeof posicionesDe>[0]> = {}) =>
    posicionesDe({ cuentas: CUENTAS, pendientes, pactadas: [], fondeoId: 'mxn', pares: PARES, ...extra });

  it('con cuenta en su divisa y saldo suficiente: en "Pagos futuros" de esa cuenta, sin convertir y sin "≈"', () => {
    const r = calcular([pago('p1', 1500, 'USD')]);
    expect(r.porCuenta.usd).toMatchObject({ pagosFuturos: { cantidad: 1, total: centavos(1500) }, pagosOtrasDivisas: null, resultado: { tipo: 'sobran', monto: centavos(500) }, aprox: false });
    expect(r.porCuenta.mxn.resultado.tipo).toBe('nada');
    expect(r.convertidos).toEqual({});
  });
  it('con cuenta en su divisa y faltante: el faltante queda en esa cuenta; la de fondeo no lo absorbe', () => {
    const r = calcular([pago('p1', 3000, 'USD')]);
    expect(r.porCuenta.usd.resultado).toEqual({ tipo: 'faltan', monto: centavos(1000) });
    expect(r.porCuenta.mxn).toMatchObject({ pagosOtrasDivisas: null, resultado: { tipo: 'nada' } });
  });
  it('sin cuenta y la de fondeo alcanza: "Pagos en otras divisas" al indicativo de compra (40,000.00 GBP a 24.300000) y "≈"', () => {
    expect(cuentaQuePaga('GBP', CUENTAS, 'mxn')).toEqual({ cuenta: CUENTAS[0], convierte: true });
    const r = calcular([pago('x1', 40_000, 'GBP')]);
    expect(r.convertidos.x1).toEqual({ cuentaId: 'mxn', monto: centavos(972_000) });
    expect(r.porCuenta.mxn).toMatchObject({ pagosFuturos: null, pagosOtrasDivisas: { cantidad: 1, total: centavos(972_000) }, resultado: { tipo: 'sobran', monto: centavos(208_000) }, aprox: true });
  });
  it('sin cuenta y la de fondeo no alcanza: faltan ≈ en la de fondeo', () => {
    const r = calcular([pago('x1', 50_000, 'GBP')]);
    expect(r.porCuenta.mxn).toMatchObject({ pagosOtrasDivisas: { cantidad: 1, total: centavos(1_215_000) }, resultado: { tipo: 'faltan', monto: centavos(35_000) }, aprox: true });
  });
  it('dos pagos sin cuenta en divisas distintas: una sola fila en la de fondeo con los dos convertidos', () => {
    const r = calcular([pago('x1', 40_000, 'GBP'), pago('x2', 10_000, 'CAD')]);
    expect(r.convertidos.x2).toEqual({ cuentaId: 'mxn', monto: centavos(132_000) });
    expect(r.porCuenta.mxn.pagosOtrasDivisas).toEqual({ cantidad: 2, total: centavos(1_104_000) });
    expect(r.porCuenta.mxn.resultado).toEqual({ tipo: 'sobran', monto: centavos(76_000) });
  });
  it('sin par disponible: no entra en la posición de ninguna cuenta', () => {
    const sinPesos = CUENTAS.filter((c) => c.id !== 'mxn');
    expect(cuentaQuePaga('GBP', sinPesos, 'usd')).toBeNull();
    const r = posicionesDe({ cuentas: sinPesos, pendientes: [pago('x1', 40_000, 'GBP')], pactadas: [], fondeoId: 'usd', pares: PARES });
    expect(r.sinPar).toEqual(['x1']);
    expect(r.convertidos).toEqual({});
    expect(Object.values(r.porCuenta).map((p) => [p.divisa, p.resultado.tipo, p.aprox])).toEqual([['USD', 'nada', false], ['EUR', 'nada', false]]);
  });
  it('sin cuenta y ya pactado: sale de "Pagos en otras divisas" y entra a "Pactadas por liquidar" con el monto exacto, sin "≈"', () => {
    const r = calcular([], { pactadas: [{ origenId: 'mxn', pagas: centavos(972_486), recibe: centavos(40_000) }] });
    expect(r.porCuenta.mxn).toMatchObject({ pagosOtrasDivisas: null, pactadasLiquidar: { cantidad: 1, total: centavos(972_486) }, resultado: { tipo: 'sobran', monto: centavos(207_514) }, aprox: false });
  });
});
