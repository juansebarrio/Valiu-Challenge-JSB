import { describe, it, expect } from 'vitest';
import { cotizar, deducir, ejecutable, fechasLiquidacion, siguienteHabil } from './fx';
import { centavos, entreTdc, escalarTdc, leerCentavos, porTdc } from './dinero';
import * as fmt from './format';

describe('dinero', () => {
  it('redondea half-up a centavos', () => {
    expect(porTdc(centavos(1500), 18_091_183)).toBe(centavos(27_136.77)); // 27,136.7745
    expect(porTdc(centavos(1500), 18_092_415)).toBe(centavos(27_138.62)); // 27,138.6225
    expect(porTdc(centavos(1000), 18_092_415)).toBe(centavos(18_092.42)); // 18,092.415 → .42 (half-up)
    expect(entreTdc(centavos(1500), 1_171_000)).toBe(centavos(1_280.96)); // 1,280.956…
  });
  it('precio ejecutable con los factores del handoff', () => {
    expect(escalarTdc(18_091_183, 10_000_681)).toBe(18_092_415);
    expect(ejecutable(18_091_183, 'comprar')).toBe(18_092_415);
    expect(ejecutable(18_032_135, 'vender')).toBe(18_030_907);
  });
  it('lee lo que escribe el usuario', () => {
    expect(leerCentavos('1,000')).toBe(100000);
    expect(leerCentavos('1000.5')).toBe(100050);
    expect(leerCentavos('')).toBeNull();
    expect(leerCentavos('abc')).toBeNull();
  });
  it('formatea', () => {
    expect(fmt.monto(centavos(1_180_000), 'MXN')).toBe('1,180,000.00 MXN');
    expect(fmt.montoSigno(centavos(-1250.5), 'MXN')).toBe('−1,250.50 MXN');
    expect(fmt.tdc(18_091_183)).toBe('18.091183');
    expect(fmt.compacto(centavos(1000))).toBe('1,000');
    expect(fmt.cuentaRegresiva(120)).toBe('2:00');
  });
});

describe('deducir (sección 5 / Anexo A)', () => {
  it('MXN → USD es compra de USD/MXN al lado comprar', () => {
    expect(deducir('MXN', 'USD')).toMatchObject({ tipo: 'compra', par: 'USD/MXN', lado: 'comprar' });
  });
  it('USD → MXN es venta de USD/MXN al lado vender', () => {
    expect(deducir('USD', 'MXN')).toMatchObject({ tipo: 'venta', par: 'USD/MXN', lado: 'vender' });
  });
  it('EUR → USD es venta de EUR/USD', () => {
    expect(deducir('EUR', 'USD')).toMatchObject({ tipo: 'venta', par: 'EUR/USD', lado: 'vender' });
  });
  it('misma divisa es transferencia sin par', () => {
    expect(deducir('USD', 'USD')).toEqual({ tipo: 'transferencia', par: null, lado: null });
  });
  it('combinación inexistente devuelve null', () => {
    expect(deducir('GBP', 'CAD')).toBeNull();
  });
});

describe('cotizar', () => {
  it('1,500 USD fijos desde MXN cuestan 27,136.77 MXN', () => {
    expect(cotizar({ origen: 'MXN', destino: 'USD', monto: centavos(1500), ladoFijo: 'recibe' })!.pagas).toBe(centavos(27_136.77));
  });
  it('1,500 USD desde EUR cuestan 1,280.96 EUR (lado vender de EUR/USD, 1.171000)', () => {
    expect(cotizar({ origen: 'EUR', destino: 'USD', monto: centavos(1500), ladoFijo: 'recibe' })!.pagas).toBe(centavos(1_280.96));
  });
  it('con el ejecutable fijo: 27,138.62 MXN', () => {
    expect(cotizar({ origen: 'MXN', destino: 'USD', monto: centavos(1500), ladoFijo: 'recibe', tdc: 18_092_415 })!.pagas).toBe(centavos(27_138.62));
  });
  it('lado pagas fijo: 18,091.18 MXN compran 1,000.00 USD', () => {
    expect(cotizar({ origen: 'MXN', destino: 'USD', monto: centavos(18_091.18), ladoFijo: 'pagas' })!.recibe).toBe(centavos(1000));
  });
  it('transferencia: pagas = recibe', () => {
    expect(cotizar({ origen: 'USD', destino: 'USD', monto: centavos(1000), ladoFijo: 'recibe' })).toMatchObject({ pagas: centavos(1000), recibe: centavos(1000), tdc: null });
  });
});

describe('fechasLiquidacion', () => {
  it('martes 6 oct 2026 → Hoy, mié 7, jue 8 (vence), vie 9', () => {
    const f = fechasLiquidacion(new Date(2026, 9, 6), new Date(2026, 9, 8));
    expect(f.map((x) => x.etiqueta)).toEqual(['Hoy', 'mié 7', 'jue 8', 'vie 9']);
    expect(f.map((x) => x.vence)).toEqual([false, false, true, false]);
  });
  it('salta el fin de semana', () => {
    expect(fechasLiquidacion(new Date(2026, 9, 9)).map((x) => x.etiqueta)).toEqual(['Hoy', 'lun 12', 'mar 13', 'mié 14']);
    expect(siguienteHabil(new Date(2026, 9, 9)).getDate()).toBe(12);
  });
});

describe('flujo secundario · turismo (EUR/MXN 21.25, EUR/USD 1.175 / 1.171)', () => {
  const pares = { 'EUR/MXN': { compra: 21_250_000, venta: 21_100_000 }, 'EUR/USD': { compra: 1_175_000, venta: 1_171_000 }, 'USD/MXN': { compra: 18_091_183, venta: 18_032_135 } };
  it('compra de 4,200 EUR con pesos: 4,200 × 21.25 = 89,250.00 MXN', () => {
    const c = cotizar({ origen: 'MXN', destino: 'EUR', monto: centavos(4200), ladoFijo: 'recibe', pares })!;
    expect(c).toMatchObject({ tipo: 'compra', par: 'EUR/MXN', lado: 'comprar', tdc: 21_250_000 });
    expect(c.pagas).toBe(centavos(89_250));
    expect(fmt.monto(c.pagas, 'MXN')).toBe('89,250.00 MXN');
  });
  it('4,200 EUR desde la Cuenta USD con EUR/USD 1.175000: 4,935.00 USD', () => {
    const c = cotizar({ origen: 'USD', destino: 'EUR', monto: centavos(4200), ladoFijo: 'recibe', pares })!;
    expect(c).toMatchObject({ tipo: 'compra', par: 'EUR/USD', lado: 'comprar', tdc: 1_175_000 });
    expect(c.pagas).toBe(centavos(4_935));
    // Los tres pares cierran entre sí: 18.091183 × 1.175 ≈ 21.26 ≈ EUR/MXN
    expect(Math.abs(18.091183 * 1.175 - 21.25) < 0.02).toBe(true);
  });
  it('precio ejecutable sobre 21.250000 y lo que paga con él', () => {
    expect(ejecutable(21_250_000, 'comprar')).toBe(21_251_447);
    expect(porTdc(centavos(4200), ejecutable(21_250_000, 'comprar'))).toBe(centavos(89_256.08));
  });
  it('fechas de liquidación con vencimiento vie 9: "vie 9" lleva vence', () => {
    const f = fechasLiquidacion(new Date(2026, 9, 6, 10, 42), new Date(2026, 9, 9));
    expect(f.map((x) => [x.etiqueta, x.vence])).toEqual([['Hoy', false], ['mié 7', false], ['jue 8', false], ['vie 9', true]]);
  });
});
