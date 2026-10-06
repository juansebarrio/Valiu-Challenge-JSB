import { describe, it, expect } from 'vitest';
import { diasSemana, proyeccion, diaDeCruce, posicion, evaluarOrigen, agregar, ejecutable } from './posicion';

const HOY = new Date(2026, 9, 6);
const pagosUSD = [
  { id: 'p1', monto: 1500, divisa: 'USD' as const, fecha: new Date(2026, 9, 8) },
  { id: 'p2', monto: 1000, divisa: 'USD' as const, fecha: new Date(2026, 9, 9) },
  { id: 'p3', monto: 500, divisa: 'USD' as const, fecha: new Date(2026, 9, 9) },
];

describe('diasSemana', () => {
  it('martes 6 → mar 6, mié 7, jue 8, vie 9', () => {
    expect(diasSemana(HOY).map((d) => d.getDate())).toEqual([6, 7, 8, 9]);
  });
  it('viernes 9 → cuatro días hábiles', () => {
    expect(diasSemana(new Date(2026, 9, 9)).map((d) => d.getDate())).toEqual([9, 12, 13, 14]);
  });
});

describe('proyeccion USD (frame 01)', () => {
  it('2,000 hasta el miércoles, 500 el jueves, −1,000 el viernes', () => {
    const serie = proyeccion(2000, pagosUSD, diasSemana(HOY));
    expect(serie).toEqual([2000, 2000, 500, -1000]);
    expect(diaDeCruce(serie)).toBe(3);
  });
  it('resuelta: sin Shenzhen queda 2,000 → 500', () => {
    expect(proyeccion(2000, pagosUSD.slice(1), diasSemana(HOY))).toEqual([2000, 2000, 2000, 500]);
  });
});

describe('posicion', () => {
  it('USD: faltan 1,000', () => {
    expect(posicion('USD', 2000, agregar(pagosUSD)).resultado).toEqual({ tipo: 'faltan', monto: 1000 });
  });
  it('MXN: sobran 1,099,649.50', () => {
    expect(posicion('MXN', 1180000, { cantidad: 7, total: 80350.5 }).resultado).toEqual({ tipo: 'sobran', monto: 1099649.5 });
  });
  it('MXN con pactada: sobran 1,072,510.88', () => {
    expect(posicion('MXN', 1180000, { cantidad: 7, total: 80350.5 }, { cantidad: 1, total: 27138.62 }).resultado.monto).toBeCloseTo(1072510.88, 2);
  });
  it('EUR: nada pendiente', () => {
    expect(posicion('EUR', 50000, { cantidad: 0, total: 0 }).resultado.tipo).toBe('nada');
  });
});

describe('evaluarOrigen (frame 02)', () => {
  const posiciones = {
    USD: posicion('USD', 2000, agregar(pagosUSD)),
    MXN: posicion('MXN', 1180000, { cantidad: 7, total: 80350.5 }),
    EUR: posicion('EUR', 50000, { cantidad: 0, total: 0 }),
  };
  const proyeccionPago = { serie: [2000, 2000, 500, -1000], dias: diasSemana(HOY) };
  it('MXN cubre el faltante en USD', () => {
    const r = evaluarOrigen({ origen: { divisa: 'MXN', saldo: 1180000 }, monto: 1500, divisaPago: 'USD', posiciones });
    expect(r.pagasTexto).toBe('Pagas ≈ 27,136.77 MXN');
    expect(r.consecuencia).toMatchObject({ texto: 'Cubre el faltante en USD', tono: 'ok' });
  });
  it('USD: te faltarían 1,000 el viernes', () => {
    const r = evaluarOrigen({ origen: { divisa: 'USD', saldo: 2000 }, monto: 1500, divisaPago: 'USD', posiciones, proyeccionPago });
    expect(r.pagasTexto).toBe('Pagas 1,500.00 USD, sin tipo de cambio');
    expect(r.consecuencia).toMatchObject({ texto: 'Te faltarían 1,000.00 USD el viernes', tono: 'warn' });
  });
  it('EUR: sin pagos pendientes en euros', () => {
    const r = evaluarOrigen({ origen: { divisa: 'EUR', saldo: 50000 }, monto: 1500, divisaPago: 'USD', posiciones });
    expect(r.consecuencia).toMatchObject({ texto: 'Sin pagos pendientes en euros', tono: 'neutro' });
  });
  it('hoy no alcanza se puede elegir igual', () => {
    const r = evaluarOrigen({ origen: { divisa: 'MXN', saldo: 20000 }, monto: 1500, divisaPago: 'USD', posiciones });
    expect(r.consecuencia).toMatchObject({ texto: 'Hoy no alcanza', tono: 'warn', hoyNoAlcanza: true });
  });
});

describe('ejecutable', () => {
  it('compra USD/MXN → 18.092415', () => {
    expect(ejecutable(18.091183, 'compra')).toBe(18.092415);
  });
});
