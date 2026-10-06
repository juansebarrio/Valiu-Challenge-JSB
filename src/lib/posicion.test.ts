import { describe, it, expect } from 'vitest';
import { diasSemana, proyeccion, diaDeCruce, posicion, evaluarOrigen, agregar } from './posicion';
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
  it('USD: te faltarían 1,000 el vie 9', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'USD', saldo: centavos(2000) } });
    expect(r.pagasTexto).toBe('Pagas 1,500.00 USD, sin tipo de cambio');
    expect(r.consecuencia).toMatchObject({ texto: 'Te faltarían 1,000.00 USD el vie 9', tono: 'warn' });
  });
  it('EUR también cubre el faltante en USD', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'EUR', saldo: centavos(50_000) } });
    expect(r.pagasTexto).toBe('Pagas ≈ 1,280.96 EUR');
    expect(r.consecuencia).toMatchObject({ texto: 'Cubre el faltante en USD', tono: 'ok' });
  });
  it('sin faltante que cubrir: te quedan X', () => {
    const sinFaltante = { ...posiciones, USD: posicion('USD', centavos(5000), agregar(pendientesUSD)) };
    const r = evaluarOrigen({ ...base, posiciones: sinFaltante, origen: { divisa: 'EUR', saldo: centavos(50_000) } });
    expect(r.consecuencia).toMatchObject({ texto: 'Te quedan 48,719.04 EUR', tono: 'neutro' });
  });
  it('hoy no alcanza se puede elegir igual', () => {
    const r = evaluarOrigen({ ...base, origen: { divisa: 'MXN', saldo: centavos(20_000) } });
    expect(r.consecuencia).toMatchObject({ texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true });
  });
  it('compra a cuenta propia: cubre el faltante', () => {
    const r = evaluarOrigen({ ...base, monto: centavos(1000), destinoPropio: true, pagoCargado: false, origen: { divisa: 'MXN', saldo: centavos(1_180_000) } });
    expect(r.consecuencia.texto).toBe('Cubre el faltante en USD');
  });
});
