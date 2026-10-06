import { describe, it, expect } from 'vitest';
import { deducir, cotizar, fechasLiquidacion } from './fx';

describe('deducir (sección 5 / Anexo A)', () => {
  it('MXN → USD es compra de USD/MXN a la punta de compra', () => {
    expect(deducir('MXN', 'USD')).toMatchObject({ tipo: 'compra', par: 'USD/MXN', punta: 'compra', tdc: 18.091183 });
  });
  it('USD → MXN es venta de USD/MXN a la punta de venta', () => {
    expect(deducir('USD', 'MXN')).toMatchObject({ tipo: 'venta', par: 'USD/MXN', punta: 'venta', tdc: 18.032135 });
  });
  it('MXN → EUR es compra de EUR/MXN', () => {
    expect(deducir('MXN', 'EUR')).toMatchObject({ tipo: 'compra', par: 'EUR/MXN', punta: 'compra' });
  });
  it('USD → EUR es compra de EUR/USD', () => {
    expect(deducir('USD', 'EUR')).toMatchObject({ tipo: 'compra', par: 'EUR/USD', punta: 'compra' });
  });
  it('misma divisa es transferencia sin par', () => {
    expect(deducir('USD', 'USD')).toEqual({ tipo: 'transferencia', par: null, punta: null, tdc: null });
  });
  it('combinación inexistente devuelve null', () => {
    expect(deducir('GBP', 'CAD')).toBeNull();
  });
});

describe('cotizar', () => {
  it('1,500 USD fijos desde MXN cuestan 27,136.77 MXN', () => {
    expect(cotizar('MXN', 'USD', 1500, 'destino')!.pagas).toBeCloseTo(27136.77, 2);
  });
  it('transferencia: pagas = recibe', () => {
    expect(cotizar('USD', 'USD', 1000, 'destino')).toMatchObject({ pagas: 1000, recibe: 1000 });
  });
});

describe('fechasLiquidacion', () => {
  it('martes 6 oct 2026 → Hoy, mié 7, jue 8 (vence), vie 9', () => {
    const f = fechasLiquidacion(new Date(2026, 9, 6), new Date(2026, 9, 8));
    expect(f.map(x => x.etiqueta)).toEqual(['Hoy', 'mié 7', 'jue 8', 'vie 9']);
    expect(f.map(x => x.vence)).toEqual([false, false, true, false]);
  });
  it('salta el fin de semana', () => {
    expect(fechasLiquidacion(new Date(2026, 9, 9)).map(x => x.etiqueta)).toEqual(['Hoy', 'lun 12', 'mar 13', 'mié 14']);
  });
});
