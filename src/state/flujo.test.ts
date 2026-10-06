import { describe, it, expect } from 'vitest';
import { aplicar, ordenDePago, pagoPorId, ESTADO_INICIAL, type Accion } from './estado';
import { vistaHome, vistaPanel, vistaOperar } from './vistas';
import * as fmt from '@/lib/format';

const shenzhen = ordenDePago(pagoPorId('p1')!);
const JUE8 = new Date(2026, 9, 8);
const vencer = (n: number): Accion[] => Array.from({ length: n }, () => ({ tipo: 'tick' as const }));

describe('frame 01 · home con faltante', () => {
  const h = vistaHome(ESTADO_INICIAL);
  it('USD faltan 1,000 con proyección y acción', () => {
    const usd = h.posiciones.find((p) => p.divisa === 'USD')!;
    expect(usd.resultado).toEqual({ tipo: 'faltan', monto: 1000 });
    expect(usd.pagosFuturos).toEqual({ cantidad: 3, total: 3000 });
    expect(usd.proyeccion?.serie).toEqual([2000, 2000, 500, -1000]);
    expect(usd.proyeccion?.etiquetas).toEqual(['mar 6', 'mié 7', 'jue 8', 'vie 9']);
    expect(usd.linea).toBe('≈ 18,091.18 MXN a precio de compra');
    expect(usd.accion?.label).toBe('Comprar 1,000 USD');
  });
  it('MXN sobran 1,099,649.50 e incluye lo nuevo', () => {
    const mxn = h.posiciones.find((p) => p.divisa === 'MXN')!;
    expect(mxn.resultado).toEqual({ tipo: 'sobran', monto: 1099649.5 });
    expect(mxn.pagosFuturos.cantidad).toBe(7);
    expect(mxn.linea).toBe('Incluye los 180,000.00 de Comercial Norte');
    expect(mxn.accion).toBeNull();
  });
  it('EUR nada pendiente', () => {
    expect(h.posiciones.find((p) => p.divisa === 'EUR')!.resultado.tipo).toBe('nada');
  });
  it('próximos y realizados', () => {
    expect(h.proximos.map((p) => p.nombre)).toEqual(['Shenzhen Parts Co.', 'Logística Pacífico', 'Asia Packaging']);
    expect(h.proximos[0].fecha).toBe('jue 8');
    expect(h.realizados.map((r) => r.fecha)).toEqual(['Hoy', '4 oct', '1 oct']);
  });
});

describe('flujo principal 02 → 07', () => {
  const e02 = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }]);
  it('02 · origen con tres opciones y consecuencias', () => {
    const p = vistaPanel(e02)!;
    expect(p.titulo).toBe('Pagar a Shenzhen Parts Co.');
    expect(p.sub).toBe('1,500.00 USD · vence jue 8 · Factura 0457');
    expect(p.origenes.map((o) => [o.pagas, o.consecuencia.texto, o.consecuencia.tono])).toEqual([
      ['Pagas ≈ 27,136.77 MXN', 'Cubre el faltante en USD', 'success'],
      ['Pagas 1,500.00 USD, sin tipo de cambio', 'Te faltarían 1,000.00 USD el viernes', 'warning'],
      ['Pagas ≈ 1,390.18 EUR', 'Sin pagos pendientes en euros', 'neutral'],
    ]);
    expect(p.origenes[0].seleccionada).toBe(true);
  });
  const e03 = aplicar([{ tipo: 'irPaso', paso: 'revision' }], e02);
  it('03 · revisión', () => {
    const r = vistaPanel(e03)!.revision!;
    expect(fmt.monto(r.pagas, r.pagasDivisa)).toBe('27,136.77 MXN');
    expect(r.fechas.map((f) => f.etiqueta)).toEqual(['Hoy', 'mié 7', 'jue 8', 'vie 9']);
    expect(r.fechas.map((f) => f.vence)).toEqual([false, false, true, false]);
    expect(r.texto).toBe('Vas a pagar 1,500.00 USD con pesos. Compras los dólares a 18.091183 MXN.');
    expect(r.saldoDespues).toBe('Tu cuenta en pesos queda en ≈ 1,152,863.23 MXN.');
  });
  const e04 = aplicar([{ tipo: 'pedirPrecio' }], e03);
  it('04 · precio fijo 18.092415 por 1:59', () => {
    const p = vistaPanel(e04)!.precio!;
    expect(p.estado).toBe('fijo');
    expect(p.tdc).toBe(18.092415);
    expect(fmt.cuentaRegresiva(p.segundos)).toBe('1:59');
    expect(fmt.monto(p.pagas, p.pagasDivisa)).toBe('27,138.62 MXN');
    expect(vistaPanel(e04)!.primario).toEqual({ label: 'Confirmar pago', habilitado: false, accion: 'confirmar' });
  });
  it('04 · últimos 30 s en warning y P pausa', () => {
    const e = aplicar(vencer(90), e04);
    expect(vistaPanel(e)!.precio!.porVencer).toBe(true);
    const pausado = aplicar([{ tipo: 'pausar' }, ...vencer(10)], e);
    expect(vistaPanel(pausado)!.precio!.segundos).toBe(29);
  });
  const e05 = aplicar(vencer(119), e04);
  it('05 · vencido vuelve al indicativo', () => {
    const v = vistaPanel(e05)!;
    expect(v.precio!.estado).toBe('vencido');
    expect(fmt.monto(v.precio!.pagas, 'MXN')).toBe('27,136.77 MXN');
    expect(v.primario.label).toBe('Pedir precio');
    expect(v.precio!.tokenHabilitado).toBe(false);
  });
  const e06 = aplicar([{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }], e04);
  it('06 · confirmación con detalle', () => {
    const c = vistaPanel(e06)!.confirmacion!;
    expect(c.tipo).toBe('enviado');
    expect(c.detalle).toEqual([
      { k: 'Enviaste', v: '1,500.00 USD a Shenzhen Parts Co.' },
      { k: 'Pagaste', v: '27,138.62 MXN' },
      { k: 'TDC', v: '18.092415' },
      { k: 'Referencia', v: 'Factura 0457' },
    ]);
    const h = vistaHome(e06);
    expect(h.posiciones.find((p) => p.divisa === 'MXN')!.saldo).toBeCloseTo(1152861.38, 2);
  });
  const e07 = aplicar([{ tipo: 'volverInicio' }], e06);
  it('07 · home resuelto', () => {
    expect(e07.aviso).toEqual({ tipo: 'success', texto: 'Pago enviado. Ya te alcanza para los pagos en USD de la semana.' });
    const h = vistaHome(e07);
    const usd = h.posiciones.find((p) => p.divisa === 'USD')!;
    expect(usd.resultado).toEqual({ tipo: 'sobran', monto: 500 });
    expect(usd.pagosFuturos).toEqual({ cantidad: 2, total: 1500 });
    expect(usd.proyeccion?.serie).toEqual([2000, 2000, 2000, 500]);
    const mxn = h.posiciones.find((p) => p.divisa === 'MXN')!;
    expect(mxn.resultado.monto).toBeCloseTo(1072510.88, 2);
    expect(h.realizados[0]).toMatchObject({ fecha: 'Hoy', nombre: 'Shenzhen Parts Co.', monto: -27138.62, detalle: '1,500.00 USD a 18.092415', badge: { texto: 'En proceso' } });
    expect(h.proximos.map((p) => p.nombre)).toEqual(['Logística Pacífico', 'Asia Packaging']);
    expect(h.cuentas[0].saldo).toBeCloseTo(1152861.38, 2);
  });
});

describe('fecha valor 03B → 07B', () => {
  const e03B = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'fechaValor', fecha: JUE8 }]);
  it('03B · consecuencia pactada', () => {
    const r = vistaPanel(e03B)!.revision!;
    expect(r.fechaEsHoy).toBe(false);
    expect(r.texto).toBe('Cierras hoy el precio de 1,500.00 USD. El jue 8 salen ≈ 27,136.77 MXN de tu Cuenta Principal MXN y se envía el pago a Shenzhen Parts Co.');
    expect(r.ayuda).toBe('Hoy tienes el saldo. Asegúrate de que siga en tu cuenta el jue 8.');
  });
  const e04B = aplicar([{ tipo: 'pedirPrecio' }], e03B);
  it('04B · el dinero sale el jue 8', () => {
    expect(vistaPanel(e04B)!.precio!.sale).toBe('El dinero sale el jue 8');
  });
  const e06B = aplicar([{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }], e04B);
  it('06B · pago pactado', () => {
    const c = vistaPanel(e06B)!.confirmacion!;
    expect(c.tipo).toBe('pactado');
    expect(c.fechaDia).toBe('jue 8');
    expect(fmt.monto(c.pagas, c.pagasDivisa)).toBe('27,138.62 MXN');
  });
  const e07B = aplicar([{ tipo: 'volverInicio' }], e06B);
  it('07B · home pactado', () => {
    expect(e07B.aviso).toEqual({ tipo: 'info', texto: 'Pactaste el pago a Shenzhen Parts Co. El dinero sale el jue 8.' });
    const h = vistaHome(e07B);
    const mxn = h.posiciones.find((p) => p.divisa === 'MXN')!;
    expect(mxn.saldo).toBe(1180000);
    expect(mxn.pactadas).toEqual({ cantidad: 1, total: 27138.62 });
    expect(mxn.resultado.monto).toBeCloseTo(1072510.88, 2);
    expect(h.posiciones.find((p) => p.divisa === 'USD')!.resultado).toEqual({ tipo: 'sobran', monto: 500 });
    expect(h.proximos[0]).toMatchObject({ nombre: 'Shenzhen Parts Co.', fecha: 'jue 8', badge: { texto: 'Pactada', tono: 'pactada' }, detalle: '27,138.62 MXN a 18.092415' });
    expect(h.proximos[0].orden).toBeUndefined();
  });
});

describe('operar clásico 08 → 16', () => {
  const e08 = aplicar([{ tipo: 'pestana', pestana: 'operar' }]);
  it('08 · vacío con CTA deshabilitado', () => {
    const v = vistaOperar(e08);
    expect(v.cta).toEqual({ label: 'Pedir precio', habilitado: false, accion: 'pedirPrecio' });
    expect(v.cotizacion.tdc?.valor).toBe(18.091183);
  });
  const e10 = aplicar([
    { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opOrigen', origenId: 'mxn' }, { tipo: 'opDestino', destinoId: 'usd' }, { tipo: 'opMotivo', motivo: 'Compra de divisas' }, { tipo: 'opReferencia', referencia: 'Cobertura pagos USD' },
  ], e08);
  it('10 · compra completa', () => {
    const v = vistaOperar(e10);
    expect(v.montoDer).toBe('18,091.18');
    expect(v.cta.habilitado).toBe(true);
    expect(v.cotizacion.der).toBe('18,091.18 MXN');
  });
  const e11 = aplicar([{ tipo: 'opPedirPrecio' }, { tipo: 'opToken', token: '47' }], e10);
  it('11 · precio fijo y token', () => {
    const v = vistaOperar(e11);
    expect(v.montoDer).toBe('18,092.42');
    expect(v.cotizacion.badge.texto).toBe('Precio fijo por 1:59');
    expect(v.cotizacion.tdc).toMatchObject({ valor: 18.092415, tipo: 'Ejecutable' });
    expect(v.token).toEqual({ visible: true, valor: '47' });
    expect(v.cta.label).toBe('Confirmar compra');
    expect(v.subtitulo).toBe('Revisa y confirma');
  });
  it('12 · vencido', () => {
    const v = vistaOperar(aplicar(vencer(119), e11));
    expect(v.vencido).toBe(true);
    expect(v.montoDer).toBe('18,091.18');
    expect(v.cotizacion.badge.texto).toBe('Vencido');
    expect(v.token.visible).toBe(false);
    expect(v.cta).toEqual({ label: 'Pedir precio', habilitado: true, accion: 'pedirPrecio' });
  });
  it('11 → confirmar registra la compra', () => {
    const e = aplicar([{ tipo: 'opToken', token: '123456' }, { tipo: 'opConfirmar' }], e11);
    expect(e.operaciones[0]).toMatchObject({ pagas: 18092.42, tdc: 18.092415, estado: 'En proceso' });
    const h = vistaHome(e);
    expect(h.posiciones.find((p) => p.divisa === 'USD')!.saldo).toBe(3000);
    expect(h.posiciones.find((p) => p.divisa === 'MXN')!.saldo).toBeCloseTo(1161907.58, 2);
    expect(vistaOperar(e).montoIzq).toBe('');
  });
  it('13 · vender con error de saldo', () => {
    const v = vistaOperar(aplicar([{ tipo: 'opTipo', valor: 'vender' }, { tipo: 'opMonto', lado: 'izq', valor: '5000' }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestino', destinoId: 'mxn' }, { tipo: 'opMotivo', motivo: 'Venta de divisas' }], e08));
    expect(v.labelIzq).toBe('Vendes');
    expect(v.montoDer).toBe('90,160.68');
    expect(v.error).toBe('Supera tu saldo disponible: 2,000.00 USD.');
    expect(v.cta.habilitado).toBe(false);
    expect(v.cotizacion.izqLabel).toBe('Tu venta');
  });
  const e14 = aplicar([{ tipo: 'opTipo', valor: 'transferir' }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestinoBusqueda', texto: 'Logí' }], e08);
  it('14 · transferir con selector de destino', () => {
    const v = vistaOperar(e14);
    expect(v.esCambio).toBe(false);
    expect(v.destino.abierto).toBe(true);
    expect(v.destino.grupos.map((g) => [g.titulo, g.items.map((i) => i.nombre)])).toEqual([['Destinatarios en USD', ['Logística Pacífico']]]);
    expect(v.disponible).toBe('2,000.00 USD');
    expect(v.cotizacion).toMatchObject({ titulo: 'Resumen', badge: { texto: 'Sin tipo de cambio', tono: 'neutral' } });
    expect(v.cta.label).toBe('Continuar');
  });
  it('15 · transferencia lista con token', () => {
    const v = vistaOperar(aplicar([{ tipo: 'opDestino', destinoId: 'log' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMotivo', motivo: 'Pago a proveedores' }, { tipo: 'opReferencia', referencia: 'Flete OCT-02' }, { tipo: 'opContinuar' }], e14));
    expect(v.destino.valor).toBe('Logística Pacífico · Citibanamex **** 0931');
    expect(v.cotizacion.derLabel).toBe('Recibe Logística Pacífico');
    expect(v.token.visible).toBe(true);
    expect(v.cta.label).toBe('Confirmar transferencia');
  });
  it('16 · mercado cerrado', () => {
    const v = vistaOperar(aplicar([{ tipo: 'mercado', mercado: 'cerrado' }], e10));
    expect(v.cerrado).toBe(true);
    expect(v.mercado.texto).toBe('Mercado cerrado');
    expect(v.cta.habilitado).toBe(false);
    expect(v.cotizacion.tdc?.tipo).toBe('Último cierre');
  });
});

describe('onboarding y compra desde la posición', () => {
  it('cuatro pasos y Empezar cierra', () => {
    const e = aplicar([{ tipo: 'onboardingIniciar' }, { tipo: 'onboardingSiguiente' }, { tipo: 'onboardingSiguiente' }, { tipo: 'onboardingSiguiente' }]);
    expect(e.onboarding).toEqual({ activo: true, paso: 3 });
    expect(aplicar([{ tipo: 'onboardingSiguiente' }], e).onboarding.activo).toBe(false);
  });
  it('Comprar 1,000 USD abre el panel con destino propio', () => {
    const h = vistaHome(ESTADO_INICIAL);
    const orden = h.posiciones.find((p) => p.divisa === 'USD')!.accion!.orden;
    const e = aplicar([{ tipo: 'abrirPanel', orden }]);
    const p = vistaPanel(e)!;
    expect(p.titulo).toBe('Comprar 1,000.00 USD');
    expect(p.origenes.map((o) => o.id)).toEqual(['mxn', 'eur']);
    expect(p.origenes[0].consecuencia.texto).toBe('Cubre el faltante en USD');
  });
});
