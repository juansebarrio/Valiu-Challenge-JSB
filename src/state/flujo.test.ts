import { describe, it, expect } from 'vitest';
import { aplicar, estadoInicial, pagoPorId, type Accion } from './estado';
import { destinoDeDestinatario, ordenDePago } from './derivados';
import { estadoDeEscenario } from './escenarios';
import { vistaHome, vistaPanel, vistaOperar } from './vistas';
import { centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';

const base = estadoInicial('faltante');
const shenzhen = ordenDePago(pagoPorId(base, 'p1')!);
const JUE8 = new Date(2026, 9, 8);
const tick = (n: number): Accion[] => Array.from({ length: n }, () => ({ tipo: 'tick' as const }));
const TOKEN: Accion[] = [{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }, { tipo: 'confirmado', hora: '10:43' }];
const pos = (e: ReturnType<typeof estadoInicial>, d: string) => vistaHome(e).posiciones.find((p) => p.divisa === d)!;

describe('frame 01 · inicio con faltante', () => {
  const h = vistaHome(base);
  it('USD faltan 1,000 con proyección y acción', () => {
    const usd = pos(base, 'USD');
    expect(usd.resultado).toEqual({ tipo: 'faltan', monto: centavos(1000) });
    expect(usd.pagosFuturos).toEqual({ cantidad: 3, total: centavos(3000) });
    expect(usd.proyeccion?.serie).toEqual([2000, 2000, 500, -1000].map(centavos));
    expect(usd.proyeccion?.etiquetas).toEqual(['mar 6', 'mié 7', 'jue 8', 'vie 9']);
    expect(usd.proyeccion?.etiquetaCruce).toBe('faltante');
    expect(usd.linea).toBe('≈ 18,091.18 MXN a precio de compra');
    expect(usd.accion?.label).toBe('Comprar 1,000 USD');
  });
  it('MXN sobran 1,099,649.50 con siete pagos futuros que suman 80,350.50', () => {
    const mxn = pos(base, 'MXN');
    expect(mxn.resultado).toEqual({ tipo: 'sobran', monto: centavos(1_099_649.5) });
    expect(mxn.pagosFuturos).toEqual({ cantidad: 7, total: centavos(80_350.5) });
    expect(mxn.proyeccion).toBeNull();
    expect(mxn.linea).toBe('Incluye los 180,000.00 de Comercial Norte');
  });
  it('EUR nada pendiente', () => {
    expect(pos(base, 'EUR').resultado.tipo).toBe('nada');
  });
  it('próximos de la semana y "Ver los 10 pagos futuros"', () => {
    expect(h.proximos.map((p) => p.nombre)).toEqual(['Shenzhen Parts Co.', 'Logística Pacífico', 'Asia Packaging']);
    expect(h.totalProximos).toBe(10);
    expect(vistaHome(aplicar([{ tipo: 'verTodosLosPagos', valor: true }], base)).proximos).toHaveLength(10);
    expect(h.realizados.map((r) => r.fecha)).toEqual(['Hoy', '4 oct', '1 oct']);
  });
  it('tipo de cambio con EUR/MXN debajo', () => {
    expect(fmt.tdc(h.tdc.compra)).toBe('18.091183');
    expect(h.tdc.otros[0]).toMatchObject({ par: 'EUR/MXN', compra: 19_619_888, venta: 19_474_706 });
  });
});

describe('flujo principal 02 → 07', () => {
  const e02 = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }], base);
  it('02 · origen: MXN y EUR cubren, USD faltaría el vie 9', () => {
    const p = vistaPanel(e02)!;
    expect(p.titulo).toBe('Pagar a Shenzhen Parts Co.');
    expect(p.sub).toBe('1,500.00 USD · vence jue 8 · Factura 0457');
    expect(p.origenes.map((o) => [o.pagas, o.consecuencia.texto, o.consecuencia.tono])).toEqual([
      ['Pagas ≈ 27,136.77 MXN', 'Cubre el faltante en USD', 'success'],
      ['Pagas 1,500.00 USD, sin tipo de cambio', 'Te faltarían 1,000.00 USD el vie 9', 'warning'],
      ['Pagas ≈ 1,388.89 EUR', 'Cubre el faltante en USD', 'success'],
    ]);
    expect(p.origenes[0].seleccionada).toBe(true);
    expect(p.secundario?.label).toBe('Cancelar');
  });
  const e03 = aplicar([{ tipo: 'irPaso', paso: 'revision' }], e02);
  it('03 · revisión', () => {
    const r = vistaPanel(e03)!.revision!;
    expect(r.editable).toBe(false);
    expect(fmt.monto(r.pagas, r.pagasDivisa)).toBe('27,136.77 MXN');
    expect(r.fechas.map((f) => f.etiqueta)).toEqual(['Hoy', 'mié 7', 'jue 8', 'vie 9']);
    expect(r.fechas.map((f) => f.vence)).toEqual([false, false, true, false]);
    expect(r.texto).toBe('Vas a pagar 1,500.00 USD con pesos. Compras los dólares a 18.091183 MXN.');
    expect(r.efecto).toBe('Tu cuenta en pesos queda en ≈ 1,152,863.23 MXN.');
    expect(r.motivo).toBe('Pago a proveedores');
    expect(r.referencia).toBe('Factura 0457');
  });
  const e04 = aplicar([{ tipo: 'pedirPrecio' }], e03);
  it('04 · precio fijo 18.092415 por 2:00', () => {
    const p = vistaPanel(e04)!.precio!;
    expect(p.estado).toBe('fijo');
    expect(fmt.tdc(p.tdc!)).toBe('18.092415');
    expect(fmt.cuentaRegresiva(p.segundos)).toBe('2:00');
    expect(fmt.monto(p.pagas, p.pagasDivisa)).toBe('27,138.62 MXN');
    expect(vistaPanel(e04)!.primario).toEqual({ label: 'Confirmar pago', habilitado: false, accion: 'confirmar' });
    expect(vistaPanel(e04)!.secundario).toEqual({ label: 'Volver', accion: 'volver' });
  });
  it('04 · últimos 30 s en warning; Volver descarta el precio', () => {
    expect(vistaPanel(aplicar(tick(90), e04))!.precio!.porVencer).toBe(true);
    const atras = aplicar([{ tipo: 'irPaso', paso: 'revision' }], e04);
    expect(atras.panel.precio.estado).toBe('indicativo');
  });
  it('04 · token incorrecto 000000', () => {
    const e = aplicar([{ tipo: 'token', token: '000000' }, { tipo: 'confirmar' }], e04);
    expect(vistaPanel(e)!.primario.label).toBe('Confirmando…');
    const err = aplicar([{ tipo: 'confirmado', hora: '10:43' }], e);
    expect(err.panel.tokenError).toBe('El código no coincide. Revisa tu token y vuelve a intentarlo.');
    expect(err.panel.precio.estado).toBe('fijo');
    expect(err.operaciones).toHaveLength(0);
  });
  const e05 = aplicar(tick(120), e04);
  it('05 · vencido: el badge va sobre el precio que venció y vuelve al indicativo', () => {
    const v = vistaPanel(e05)!;
    expect(v.precio!.estado).toBe('vencido');
    expect(fmt.tdc(v.precio!.tdc!)).toBe('18.092415');
    expect(fmt.monto(v.precio!.pagas, 'MXN')).toBe('27,136.77 MXN');
    expect(v.primario.label).toBe('Pedir precio');
    expect(vistaPanel(aplicar([{ tipo: 'pedirPrecio' }], e05))!.precio!.segundos).toBe(120);
  });
  it('demo · vencer precio deja la cuenta en 0:05', () => {
    expect(aplicar([{ tipo: 'vencerPrecio' }], e04).panel.precio).toMatchObject({ estado: 'fijo', venceEn: 5 });
  });
  const e06 = aplicar(TOKEN, e04);
  it('06 · Pago en proceso con detalle', () => {
    const c = vistaPanel(e06)!.confirmacion!;
    expect(c.titulo).toBe('Pago en proceso');
    expect(c.detalle).toEqual([
      { k: 'Enviaste', v: '1,500.00 USD a Shenzhen Parts Co.' },
      { k: 'Pagaste', v: '27,138.62 MXN' },
      { k: 'TDC', v: '18.092415' },
      { k: 'Motivo', v: 'Pago a proveedores' },
      { k: 'Referencia', v: 'Factura 0457' },
    ]);
    expect(vistaPanel(e06)!.secundario?.label).toBe('Descargar comprobante');
    expect(pos(e06, 'MXN').saldo).toBe(centavos(1_152_861.38));
  });
  const e07 = aplicar([{ tipo: 'volverInicio' }], e06);
  it('07 · inicio resuelto', () => {
    expect(e07.aviso).toEqual({ tipo: 'success', texto: 'Pago en proceso. Ya te alcanza para los pagos en USD de la semana.' });
    const usd = pos(e07, 'USD');
    expect(usd.resultado).toEqual({ tipo: 'sobran', monto: centavos(500) });
    expect(usd.pagosFuturos).toEqual({ cantidad: 2, total: centavos(1500) });
    expect(usd.proyeccion?.serie).toEqual([2000, 2000, 2000, 500].map(centavos));
    const mxn = pos(e07, 'MXN');
    expect(mxn.saldo).toBe(centavos(1_152_861.38));
    expect(mxn.resultado.monto).toBe(centavos(1_072_510.88));
    const h = vistaHome(e07);
    expect(h.realizados[0]).toMatchObject({ fecha: 'Hoy', nombre: 'Shenzhen Parts Co.', monto: -centavos(27_138.62), detalle: '1,500.00 USD a 18.092415', badge: { texto: 'En proceso' } });
    expect(h.proximos.map((p) => p.nombre)).toEqual(['Logística Pacífico', 'Asia Packaging']);
    expect(estadoDeEscenario('resuelta').aviso?.texto).toBe('Pago en proceso. Ya te alcanza para los pagos en USD de la semana.');
  });
});

describe('fecha valor 03B → 07B', () => {
  const e03B = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'fechaValor', fecha: JUE8 }], base);
  it('03B · consecuencia pactada y línea de efecto con fecha', () => {
    const r = vistaPanel(e03B)!.revision!;
    expect(r.fechaEsHoy).toBe(false);
    expect(r.texto).toBe('Cierras hoy el precio de 1,500.00 USD. El jue 8 salen ≈ 27,136.77 MXN de tu Cuenta Principal MXN y se envía el pago a Shenzhen Parts Co.');
    expect(r.ayuda).toBe('Hoy tienes el saldo. Asegúrate de que siga en tu cuenta el jue 8.');
    expect(r.efecto).toBe('El jue 8 tu cuenta en pesos queda en ≈ 1,152,863.23 MXN.');
    expect(r.posVencimiento).toBeNull();
  });
  it('día posterior al vencimiento', () => {
    const r = vistaPanel(aplicar([{ tipo: 'fechaValor', fecha: new Date(2026, 9, 9) }], e03B))!.revision!;
    expect(r.posVencimiento).toBe('El dinero sale después del vencimiento (jue 8).');
  });
  const e04B = aplicar([{ tipo: 'pedirPrecio' }], e03B);
  it('04B · el dinero sale el jue 8', () => {
    expect(vistaPanel(e04B)!.precio!.sale).toBe('El dinero sale el jue 8');
  });
  const e06B = aplicar(TOKEN, e04B);
  it('06B · pago pactado con fondeo', () => {
    const c = vistaPanel(e06B)!.confirmacion!;
    expect(c.titulo).toBe('Pago pactado');
    expect(c.fondeo).toBe('Ten 27,138.62 MXN en tu Cuenta Principal MXN el jue 8 para que el pago salga.');
    expect(c.comprobante).toBe('Descargar confirmación');
  });
  const e07B = aplicar([{ tipo: 'volverInicio' }], e06B);
  it('07B · inicio pactado', () => {
    expect(e07B.aviso).toEqual({ tipo: 'info', texto: 'Pactaste el pago a Shenzhen Parts Co. El dinero sale el jue 8.' });
    const mxn = pos(e07B, 'MXN');
    expect(mxn.saldo).toBe(centavos(1_180_000));
    expect(mxn.pactadasLiquidar).toEqual({ cantidad: 1, total: centavos(27_138.62) });
    expect(mxn.resultado.monto).toBe(centavos(1_072_510.88));
    expect(pos(e07B, 'USD').resultado).toEqual({ tipo: 'sobran', monto: centavos(500) });
    const h = vistaHome(e07B);
    expect(h.proximos[0]).toMatchObject({ nombre: 'Shenzhen Parts Co.', fecha: 'jue 8', badge: { texto: 'Pactada', tono: 'pactada' }, detalle: '27,138.62 MXN a 18.092415' });
    expect(h.proximos[0].orden).toBeUndefined();
    expect(estadoDeEscenario('pactada').aviso?.tipo).toBe('info');
  });
});

describe('entradas al panel', () => {
  it('Comprar 1,000 USD: destino propio, monto editable, MXN preseleccionada, título "Pasar a tu Cuenta USD"', () => {
    const orden = pos(base, 'USD').accion!.orden;
    const e = aplicar([{ tipo: 'abrirPanel', orden }], base);
    const p = vistaPanel(e)!;
    expect(p.titulo).toBe('Pasar a tu Cuenta USD');
    expect(e.panel.origenId).toBe('mxn');
    expect(p.origenes.map((o) => o.id)).toEqual(['mxn', 'eur']);
    expect(p.origenes[0].consecuencia.texto).toBe('Cubre el faltante en USD');
    const r = vistaPanel(aplicar([{ tipo: 'irPaso', paso: 'revision' }], e))!.revision!;
    expect(r.editable).toBe(true);
    expect(r.motivo).toBe('Compra de divisas');
    expect(fmt.monto(r.pagas, 'MXN')).toBe('18,091.18 MXN');
  });
  it('Comprar 1,000 USD con Hoy: 18,092.42 MXN; USD 3,000 sobran 0; MXN 1,161,907.58 sobran 1,081,557.08', () => {
    const orden = pos(base, 'USD').accion!.orden;
    const e = aplicar([{ tipo: 'abrirPanel', orden }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'pedirPrecio' }, ...TOKEN], base);
    const c = vistaPanel(e)!.confirmacion!;
    expect(c.titulo).toBe('Compra en proceso');
    expect(fmt.monto(c.pagas, 'MXN')).toBe('18,092.42 MXN');
    const e2 = aplicar([{ tipo: 'volverInicio' }], e);
    expect(e2.aviso?.texto).toBe('Compraste 1,000.00 USD. Ya te alcanza para los pagos en USD de la semana.');
    expect(pos(e2, 'USD')).toMatchObject({ saldo: centavos(3000), resultado: { tipo: 'sobran', monto: 0 } });
    expect(pos(e2, 'MXN')).toMatchObject({ saldo: centavos(1_161_907.58), resultado: { tipo: 'sobran', monto: centavos(1_081_557.08) } });
  });
  it('Comprar 1,000 USD pactada al vie 9', () => {
    const orden = pos(base, 'USD').accion!.orden;
    const e = aplicar([{ tipo: 'abrirPanel', orden }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'fechaValor', fecha: new Date(2026, 9, 9) }, { tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], base);
    expect(e.aviso?.texto).toBe('Pactaste la compra de 1,000.00 USD. El dinero sale el vie 9.');
    expect(pos(e, 'USD')).toMatchObject({ pactadasRecibir: { cantidad: 1, total: centavos(1000) }, resultado: { tipo: 'sobran', monto: 0 } });
    expect(pos(e, 'MXN').pactadasLiquidar).toEqual({ cantidad: 1, total: centavos(18_092.42) });
  });
  it('monto editable: escribir Pagas fija ese lado', () => {
    const orden = pos(base, 'USD').accion!.orden;
    const e = aplicar([{ tipo: 'abrirPanel', orden }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'monto', lado: 'pagas', valor: centavos(18_091.18) }], base);
    const r = vistaPanel(e)!.revision!;
    expect(r.ladoFijo).toBe('pagas');
    expect(fmt.monto(r.recibe, 'USD')).toBe('1,000.00 USD');
  });
  it('"Pagar" del encabezado arranca en Destino con pagos próximos, cuentas y destinatarios', () => {
    const e = aplicar([{ tipo: 'abrirPanel', orden: null }], base);
    const p = vistaPanel(e)!;
    expect(p.paso).toBe('destino');
    expect(p.destino!.grupos.map((g) => g.titulo)).toEqual(['Pagos próximos', 'Tus cuentas', 'Destinatarios']);
    const pago = p.destino!.grupos[0].items[0];
    const e2 = aplicar([{ tipo: 'elegirDestino', destino: pago.destino, pago: pago.pago }], e);
    expect(vistaPanel(e2)!.titulo).toBe('Pagar a Shenzhen Parts Co.');
    expect(e2.panel.paso).toBe('origen');
    expect(vistaPanel(e2)!.secundario).toEqual({ label: 'Cancelar', accion: 'cancelar' });
  });
  it('Usar para pagar: Destino con MXN preseleccionada', () => {
    const e = aplicar([{ tipo: 'abrirPanel', orden: null, origenId: 'mxn' }], base);
    expect(e.panel.paso).toBe('destino');
    expect(e.panel.origenId).toBe('mxn');
  });
});

describe('casos: vender y transferir por el panel', () => {
  it('vender: destino MXN desde USD, lado vender', () => {
    const mxn = base.datos.cuentas.find((c) => c.id === 'mxn')!;
    const e = aplicar([{ tipo: 'abrirPanel', orden: null }, { tipo: 'elegirDestino', destino: { tipo: 'propia', id: 'mxn', nombre: mxn.nombre, divisa: 'MXN', banco: mxn.banco, mascara: mxn.mascara, cuentaId: 'mxn' } }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'monto', lado: 'pagas', valor: centavos(1000) }, { tipo: 'irPaso', paso: 'revision' }], base);
    const r = vistaPanel(e)!.revision!;
    expect(fmt.tdc(r.tdc!)).toBe('18.032135');
    expect(fmt.monto(r.recibe, 'MXN')).toBe('18,032.14 MXN');
    expect(r.motivo).toBe('Venta de divisas');
    const c = vistaPanel(aplicar([{ tipo: 'pedirPrecio' }, ...TOKEN], e))!.confirmacion!;
    expect(c.titulo).toBe('Venta en proceso');
    expect(fmt.tdc(c.tdc!)).toBe('18.030907');
  });
  it('transferir: misma divisa, sin tipo de cambio ni fecha valor; token al confirmar', () => {
    const log = base.datos.destinatarios.find((d) => d.id === 'log')!;
    const e = aplicar([{ tipo: 'abrirPanel', orden: null }, { tipo: 'elegirDestino', destino: { tipo: 'tercero', id: 'log', nombre: log.nombre, divisa: 'USD', banco: log.banco, mascara: log.mascara } }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'monto', lado: 'recibe', valor: centavos(1000) }, { tipo: 'irPaso', paso: 'revision' }], base);
    const v = vistaPanel(e)!;
    expect(v.sinTdc).toBe(true);
    expect(v.revision!.fechas).toEqual([]);
    expect(v.primario.label).toBe('Continuar');
    const e2 = aplicar([{ tipo: 'pedirPrecio' }], e);
    expect(vistaPanel(e2)!.precio!.estado).toBe('sinTdc');
    const e3 = aplicar(TOKEN, e2);
    expect(vistaPanel(e3)!.confirmacion!.titulo).toBe('Pago en proceso');
    expect(pos(e3, 'USD').saldo).toBe(centavos(1000));
  });
});

describe('escenario sin-saldo', () => {
  const e = estadoDeEscenario('sin-saldo');
  it('MXN 20,000 sin pagos futuros', () => {
    expect(pos(e, 'MXN')).toMatchObject({ saldo: centavos(20_000), pagosFuturos: null });
  });
  it('origen que hoy no alcanza: elegible, Hoy deshabilitado y fecha al vencimiento', () => {
    const e02 = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(e, 'p1')!) }], e);
    const p = vistaPanel(e02)!;
    expect(e02.panel.origenId).toBeNull();
    expect(p.origenes[0].consecuencia).toMatchObject({ texto: 'Hoy no alcanza', tono: 'warning' });
    const e03 = aplicar([{ tipo: 'elegirOrigen', origenId: 'mxn' }, { tipo: 'irPaso', paso: 'revision' }], e02);
    const r = vistaPanel(e03)!.revision!;
    expect(r.hoyNoAlcanza).toBe(true);
    expect(r.fechas[0]).toMatchObject({ etiqueta: 'Hoy', deshabilitada: true, motivo: 'Hoy no alcanza el saldo' });
    expect(r.fechaDia).toBe('jue 8');
    expect(r.ayuda).toBe('Hoy no tienes el saldo. Fondea 27,136.77 MXN antes del jue 8.');
    const e07 = aplicar([{ tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], e03);
    const mxn = pos(e07, 'MXN');
    expect(mxn.resultado).toEqual({ tipo: 'faltan', monto: centavos(7_138.62) });
    expect(mxn.linea).toBe('Fondea 7,138.62 MXN para el jue 8');
    expect(mxn.enlace?.label).toBe('Ver datos para depositar');
  });
});

describe('operar clásico 08 → 16', () => {
  const e08 = aplicar([{ tipo: 'pestana', pestana: 'operar' }], base);
  it('08 · vacío con CTA deshabilitado', () => {
    const v = vistaOperar(e08);
    expect(v.cta).toEqual({ label: 'Pedir precio', habilitado: false, accion: 'pedirPrecio' });
    expect(fmt.tdc(v.cotizacion.tdc!.valor)).toBe('18.091183');
  });
  it('09 · GBP/MXN avisa que no está en el prototipo', () => {
    const v = vistaOperar(aplicar([{ tipo: 'opPar', par: 'GBP/MXN' }], e08));
    expect(v.par.aviso).toBe('Este par no está en el prototipo.');
  });
  const e10 = aplicar([{ tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMontoEditando', lado: null }, { tipo: 'opOrigen', origenId: 'mxn' }, { tipo: 'opDestino', destinoId: 'usd' }, { tipo: 'opMotivo', motivo: 'Compra de divisas' }, { tipo: 'opReferencia', referencia: 'Cobertura pagos USD' }], e08);
  it('10 · compra completa con indicativo 18,091.18', () => {
    const v = vistaOperar(e10);
    expect(v.montoIzq).toBe('1,000.00');
    expect(v.montoDer).toBe('18,091.18');
    expect(v.cta.habilitado).toBe(true);
  });
  const e11 = aplicar([{ tipo: 'opPedirPrecio' }, { tipo: 'opToken', token: '47' }], e10);
  it('11 · precio fijo 18.092415 y 18,092.42', () => {
    const v = vistaOperar(e11);
    expect(v.montoDer).toBe('18,092.42');
    expect(v.cotizacion.badge.texto).toBe('Precio fijo por 2:00');
    expect(v.cotizacion.tdc).toMatchObject({ valor: 18_092_415, tipo: 'Ejecutable' });
    expect(v.token).toMatchObject({ visible: true, valor: '47' });
  });
  it('12 · vencido', () => {
    const v = vistaOperar(aplicar(tick(120), e11));
    expect(v.vencido).toBe(true);
    expect(v.montoDer).toBe('18,091.18');
    expect(v.token.visible).toBe(false);
    expect(v.cta).toEqual({ label: 'Pedir precio', habilitado: true, accion: 'pedirPrecio' });
  });
  it('confirmar deja el inicio igual que "Comprar 1,000 USD con Hoy" y muestra la confirmación en la tarjeta', () => {
    const e = aplicar([{ tipo: 'opToken', token: '123456' }, { tipo: 'opConfirmar' }, { tipo: 'opConfirmado', hora: '10:44' }], e11);
    const v = vistaOperar(e);
    expect(v.paso).toBe('confirmacion');
    expect(v.confirmacion!.titulo).toBe('Compra en proceso');
    expect(pos(e, 'USD')).toMatchObject({ saldo: centavos(3000), resultado: { tipo: 'sobran', monto: 0 } });
    expect(pos(e, 'MXN')).toMatchObject({ saldo: centavos(1_161_907.58), resultado: { tipo: 'sobran', monto: centavos(1_081_557.08) } });
    expect(vistaOperar(aplicar([{ tipo: 'opNueva' }], e)).montoIzq).toBe('');
  });
  it('13 · vender con error de saldo', () => {
    const v = vistaOperar(aplicar([{ tipo: 'opTipo', valor: 'vender' }, { tipo: 'opMonto', lado: 'izq', valor: '5000' }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestino', destinoId: 'mxn' }, { tipo: 'opMotivo', motivo: 'Venta de divisas' }], e08));
    expect(v.montoDer).toBe('90,160.68');
    expect(v.error).toBe('Supera tu saldo disponible: 2,000.00 USD.');
    expect(v.cta.habilitado).toBe(false);
  });
  const e14 = aplicar([{ tipo: 'opTipo', valor: 'transferir' }, { tipo: 'opOrigen', origenId: 'usd' }, { tipo: 'opDestinoBusqueda', texto: 'Logí' }], e08);
  it('14 · transferir con selector de destino', () => {
    const v = vistaOperar(e14);
    expect(v.destino.grupos.map((g) => [g.titulo, g.items.map((i) => i.nombre)])).toEqual([['Destinatarios en USD', ['Logística Pacífico']]]);
    expect(v.cta.label).toBe('Continuar');
  });
  it('15 · transferencia lista con token', () => {
    const v = vistaOperar(aplicar([{ tipo: 'opDestino', destinoId: 'log' }, { tipo: 'opMonto', lado: 'izq', valor: '1000' }, { tipo: 'opMotivo', motivo: 'Pago a proveedores' }, { tipo: 'opReferencia', referencia: 'Flete OCT-02' }, { tipo: 'opContinuar' }], e14));
    expect(v.destino.valor).toBe('Logística Pacífico · Citibanamex **** 0931');
    expect(v.token.visible).toBe(true);
    expect(v.cta.label).toBe('Confirmar transferencia');
  });
  it('16 · mercado cerrado sin horario ni "Programar"', () => {
    const v = vistaOperar(aplicar([{ tipo: 'pestana', pestana: 'operar' }], estadoDeEscenario('mercado-cerrado')));
    expect(v.cerrado).toBe(true);
    expect(v.avisoCerrado?.texto).not.toContain('6:30');
    expect(v.cta.habilitado).toBe(false);
    const panel = vistaPanel(aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(base, 'p1')!) }, { tipo: 'irPaso', paso: 'revision' }], estadoDeEscenario('mercado-cerrado')))!;
    expect(panel.primario).toMatchObject({ label: 'Pedir precio', habilitado: false });
  });
});

describe('onboarding y tipo de cambio en vivo', () => {
  it('aparece en el escenario base y no con recorrido=0 ni en otros escenarios', () => {
    expect(estadoDeEscenario('faltante', { recorrido: true }).onboarding.activo).toBe(true);
    expect(estadoDeEscenario('faltante', { recorrido: false }).onboarding.activo).toBe(false);
    expect(estadoDeEscenario('resuelta', { recorrido: true }).onboarding.activo).toBe(false);
  });
  it('cuatro pasos y Empezar cierra', () => {
    const e = aplicar([{ tipo: 'onboardingIniciar' }, { tipo: 'onboardingSiguiente' }, { tipo: 'onboardingSiguiente' }, { tipo: 'onboardingSiguiente' }], base);
    expect(e.onboarding).toEqual({ activo: true, paso: 3 });
    expect(aplicar([{ tipo: 'onboardingSiguiente' }], e).onboarding.activo).toBe(false);
  });
  it('congelar fija el indicativo', () => {
    const e = estadoInicial('faltante', { congelado: true });
    expect(aplicar([{ tipo: 'tdcVivo', pares: { ...e.tdcVivo, 'USD/MXN': { compra: 18_095_000, venta: 18_035_000 } } }], e).tdcVivo['USD/MXN'].compra).toBe(18_091_183);
  });
});

describe('detalle de movimiento en el panel', () => {
  it('fila de un pago pendiente: datos del pago, equivalente en pesos y "Pagar" que abre el flujo', () => {
    const e = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], base);
    const p = vistaPanel(e)!;
    expect(p.tipo).toBe('detalle');
    expect(p.titulo).toBe('Shenzhen Parts Co.');
    expect(p.sub).toBe('1,500.00 USD · vence jue 8 · Factura 0457');
    expect(p.detalle?.titulo).toBe('Pago pendiente');
    expect(p.detalle?.filas).toEqual([
      { k: 'Destinatario', v: 'Shenzhen Parts Co. · HSBC Hong Kong **** 4410' },
      { k: 'Monto', v: '1,500.00 USD' },
      { k: 'Vence', v: 'jueves 8 de octubre' },
      { k: 'Motivo', v: 'Pago a proveedores' },
      { k: 'Referencia', v: 'Factura 0457' },
      { k: 'Con pesos, hoy', v: '≈ 27,136.77 MXN' },
    ]);
    expect(p.primario).toEqual({ label: 'Pagar', habilitado: true, accion: 'pagar' });
    const pago = aplicar([{ tipo: 'abrirPanel', orden: p.detalle!.orden! }], e);
    expect(vistaPanel(pago)).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Shenzhen Parts Co.' });
  });
  it('fila de un realizado: cobro de Comercial Norte con comprobante', () => {
    const p = vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'r1' }], base))!;
    expect(p.titulo).toBe('Cobro de Comercial Norte');
    expect(p.sub).toBe('Hoy 10:42 · BBVA México **** 5678');
    expect(p.detalle).toMatchObject({ clase: 'cobro', titulo: 'Cobro confirmado', badge: { texto: 'Confirmada', tono: 'success' }, monto: centavos(180_000) });
    expect(p.detalle?.filas.map((f) => f.k)).toEqual(['De', 'Monto', 'Fecha', 'Referencia', 'A', 'Estado']);
    expect(p.secundario).toEqual({ label: 'Descargar comprobante', accion: 'comprobante' });
    expect(p.primario.accion).toBe('cerrar');
  });
  it('fila de un pago en proceso (escenario resuelta)', () => {
    const p = vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'op1' }], estadoDeEscenario('resuelta')))!;
    expect(p.titulo).toBe('Shenzhen Parts Co.');
    expect(p.detalle).toMatchObject({ clase: 'proceso', titulo: 'Pago en proceso', monto: centavos(-27_138.62), divisa: 'MXN' });
    expect(p.detalle?.filas).toContainEqual({ k: 'TDC', v: '18.092415' });
  });
  it('Esc / Cerrar vuelve al inicio sin tocar nada', () => {
    const e = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }, { tipo: 'cerrarPanel' }], base);
    expect(e.panel.abierto).toBe(false);
    expect(vistaHome(e)).toEqual(vistaHome(base));
  });
});

describe('cancelar un pago pactado', () => {
  const pactada = estadoDeEscenario('pactada');
  const detalle = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], pactada);
  it('el detalle de la pactada ofrece "Cancelar pacto" y muestra el fondeo', () => {
    const p = vistaPanel(detalle)!;
    expect(p.sub).toBe('27,138.62 MXN · sale el jue 8 · Factura 0457');
    expect(p.detalle).toMatchObject({ clase: 'pactada', titulo: 'Pago pactado', badge: { texto: 'Pactada', tono: 'pactada' } });
    expect(p.detalle?.fondeo).toBe('Ten 27,138.62 MXN en tu Cuenta Principal MXN el jue 8 para que el pago salga.');
    expect(p.secundario).toEqual({ label: 'Cancelar pacto', accion: 'cancelarPactada' });
  });
  it('pregunta antes de cancelar y "Cancelando…" mientras confirma', () => {
    const q = aplicar([{ tipo: 'cancelarPactada' }], detalle);
    const p = vistaPanel(q)!;
    expect(p.paso).toBe('cancelar');
    expect(p.detalle?.pregunta).toEqual({ titulo: '¿Cancelar el pago pactado?', texto: 'Se libera el precio de 18.092415 que cerraste hoy. El pago a Shenzhen Parts Co. vuelve a Próximos como pendiente y no sale dinero de tu Cuenta Principal MXN el jue 8.' });
    expect(p.primario).toEqual({ label: 'Sí, cancelar', habilitado: true, accion: 'confirmarCancelacion' });
    expect(vistaPanel(aplicar([{ tipo: 'confirmarCancelacion' }], q))!.primario).toEqual({ label: 'Cancelando…', habilitado: false, accion: 'confirmarCancelacion' });
    expect(vistaPanel(aplicar([{ tipo: 'irPaso', paso: 'origen' }], q))!.paso).toBe('origen');
  });
  it('al cancelar, el pago vuelve a Próximos, MXN deja de tener pactadas y queda el aviso', () => {
    const e = aplicar([{ tipo: 'cancelarPactada' }, { tipo: 'confirmarCancelacion' }, { tipo: 'pactadaCancelada', hora: '10:44' }], detalle);
    expect(e.panel.abierto).toBe(false);
    expect(e.aviso).toEqual({ tipo: 'info', texto: 'Cancelaste el pago pactado a Shenzhen Parts Co. Vuelve a Próximos como pendiente.' });
    const h = vistaHome(e);
    expect(h.proximos[0].nombre).toBe('Shenzhen Parts Co.');
    expect(h.proximos[0].badge).toBeUndefined();
    expect(h.proximos[0].orden?.pagoId).toBe('p1');
    expect(pos(e, 'USD').resultado).toEqual({ tipo: 'faltan', monto: centavos(1000) });
    expect(pos(e, 'MXN').pactadasLiquidar).toBeNull();
    expect(pos(e, 'MXN').saldo).toBe(centavos(1_180_000));
    expect(h.realizados[0]).toMatchObject({ nombre: 'Shenzhen Parts Co.', badge: { texto: 'Cancelada', tono: 'neutral' } });
    const d = vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'op1' }], e))!;
    expect(d.detalle).toMatchObject({ clase: 'cancelada', titulo: 'Pago cancelado' });
    expect(d.detalle?.filas).toContainEqual({ k: 'Cancelada', v: 'Hoy 10:44' });
  });
  it('no se puede cancelar lo que no está pactado', () => {
    const e = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }, { tipo: 'cancelarPactada' }], base);
    expect(e.panel.paso).toBe('origen');
    expect(aplicar([{ tipo: 'confirmarCancelacion' }, { tipo: 'pactadaCancelada', hora: '10:44' }], e).operaciones).toEqual([]);
  });
});

describe('agendar un pago desde el "+" de Movimientos', () => {
  const asia = destinoDeDestinatario(base.datos.destinatarios.find((d) => d.id === 'ap')!);
  const VIE9 = new Date(2026, 9, 9);
  const abierto = aplicar([{ tipo: 'abrirAgendar' }], base);
  it('empieza en el selector de destino, solo con destinatarios', () => {
    const p = vistaPanel(abierto)!;
    expect(p).toMatchObject({ tipo: 'agendar', paso: 'destino', titulo: 'Agendar un pago' });
    expect(p.destino?.grupos.map((g) => g.titulo)).toEqual(['Destinatarios']);
    expect(p.primario.habilitado).toBe(false);
  });
  it('"Agendar" se habilita solo con monto, fecha hábil y motivo', () => {
    const conDestino = aplicar([{ tipo: 'agendaDestino', destino: asia }], abierto);
    expect(vistaPanel(conDestino)!.agenda).toMatchObject({ destinatario: 'Asia Packaging', divisa: 'USD', motivo: 'Pago a proveedores', fechaMin: '2026-10-06', fechaMax: '2027-01-04' });
    expect(vistaPanel(conDestino)!.primario).toEqual({ label: 'Agendar', habilitado: false, accion: 'agendar' });
    const sabado = aplicar([{ tipo: 'agendaMonto', texto: '250' }, { tipo: 'agendaFecha', fecha: new Date(2026, 9, 10) }], conDestino);
    expect(vistaPanel(sabado)!.agenda?.fechaError).toBe('Elige un día hábil.');
    expect(vistaPanel(sabado)!.primario.habilitado).toBe(false);
    const ayer = aplicar([{ tipo: 'agendaFecha', fecha: new Date(2026, 9, 5) }], sabado);
    expect(vistaPanel(ayer)!.agenda?.fechaError).toBe('Elige una fecha entre hoy y el lunes 4 de enero.');
    const cero = aplicar([{ tipo: 'agendaMonto', texto: '0' }, { tipo: 'agendaFecha', fecha: VIE9 }], sabado);
    expect(vistaPanel(cero)!.agenda?.montoError).toBe('Escribe un monto mayor a 0.');
    const listo = aplicar([{ tipo: 'agendaMonto', texto: '250' }], cero);
    expect(vistaPanel(listo)!.agenda?.resumen).toBe('Vence el viernes 9 de octubre. Lo verás en Próximos y podrás pagarlo cuando quieras.');
    expect(vistaPanel(listo)!.primario.habilitado).toBe(true);
    expect(aplicar([{ tipo: 'agendar' }], cero).datos.pagosFuturos).toHaveLength(10);
  });
  const lleno = aplicar([{ tipo: 'agendaDestino', destino: asia }, { tipo: 'agendaMonto', texto: '250' }, { tipo: 'agendaFecha', fecha: VIE9 }, { tipo: 'agendaReferencia', referencia: 'Pedido AP-121' }], abierto);
  it('al agendar, el pago entra a Próximos, mueve la posición y la confirmación ofrece "Pagar ahora"', () => {
    const e = aplicar([{ tipo: 'agendar' }], lleno);
    const p = vistaPanel(e)!;
    expect(p).toMatchObject({ tipo: 'agendar', paso: 'confirmacion', sub: '250.00 USD · vence vie 9 · Pedido AP-121' });
    expect(p.detalle).toMatchObject({ clase: 'agendado', titulo: 'Pago agendado', badge: { texto: 'Pendiente', tono: 'neutral' } });
    expect(p.primario).toEqual({ label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' });
    expect(p.secundario).toEqual({ label: 'Pagar ahora', accion: 'pagar' });
    expect(p.detalle?.orden).toMatchObject({ pagoId: 'a1', monto: centavos(250), conFactura: true });
    const inicio = aplicar([{ tipo: 'volverInicio' }], e);
    expect(inicio.aviso).toEqual({ tipo: 'info', texto: 'Agendaste el pago a Asia Packaging por 250.00 USD para el vie 9.' });
    const h = vistaHome(inicio);
    expect(h.proximos.map((f) => f.nombre)).toEqual(['Shenzhen Parts Co.', 'Logística Pacífico', 'Asia Packaging', 'Asia Packaging']);
    expect(h.totalProximos).toBe(11);
    expect(pos(inicio, 'USD').resultado).toEqual({ tipo: 'faltan', monto: centavos(1250) });
    expect(pos(inicio, 'USD').proyeccion?.serie).toEqual([2000, 2000, 500, -1250].map(centavos));
    const pagoAhora = aplicar([{ tipo: 'abrirPanel', orden: p.detalle!.orden! }], e);
    expect(vistaPanel(pagoAhora)).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Asia Packaging', sub: '250.00 USD · vence vie 9 · Pedido AP-121' });
  });
  it('un vencimiento fuera de la semana despliega "Ver los N pagos futuros" y se abre desde su fila', () => {
    const e = aplicar([{ tipo: 'agendaFecha', fecha: new Date(2026, 9, 21) }, { tipo: 'agendar' }, { tipo: 'volverInicio' }], lleno);
    expect(e.verTodosLosPagos).toBe(true);
    const h = vistaHome(e);
    expect(h.proximos.at(-1)).toMatchObject({ id: 'a1', nombre: 'Asia Packaging', fecha: 'mié 21' });
    expect(pos(e, 'USD').pagosFuturos).toEqual({ cantidad: 4, total: centavos(3250) });
    expect(vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'a1' }], e))!.detalle).toMatchObject({ clase: 'agendado', titulo: 'Pago agendado' });
  });
  it('el "+" cierra el onboarding y Cancelar no deja rastro', () => {
    const conRecorrido = aplicar([{ tipo: 'onboardingIniciar' }, { tipo: 'abrirAgendar' }], base);
    expect(conRecorrido.onboarding.activo).toBe(false);
    const e = aplicar([{ tipo: 'agendaDestino', destino: asia }, { tipo: 'agendaMonto', texto: '250' }, { tipo: 'cerrarPanel' }], abierto);
    expect(e.datos.pagosFuturos).toHaveLength(10);
    expect(vistaPanel(e)).toBeNull();
  });
});

describe('flujo secundario · turismo (S01–S02)', () => {
  const t = estadoInicial('faltante', {}, 'turismo');
  it('S01 · EUR primero con saldo 0 y faltan 4,200; USD alcanza; MXN nada pendiente con el cobro', () => {
    const h = vistaHome(t);
    expect(h.empresa).toBe('Viajes Altavista S.A. de C.V.');
    expect(h.posiciones.map((p) => p.divisa)).toEqual(['EUR', 'USD', 'MXN']);
    const eur = pos(t, 'EUR');
    expect(eur.saldo).toBe(0);
    expect(eur.resultado).toEqual({ tipo: 'faltan', monto: centavos(4200) });
    expect(eur.proyeccion?.serie).toEqual([0, 0, 0, -4200].map(centavos));
    expect(eur.proyeccion?.etiquetaCruce).toBe('faltante');
    expect(eur.linea).toBe('≈ 89,250.00 MXN a precio de compra');
    expect(eur.accion?.label).toBe('Comprar 4,200 EUR');
    expect(pos(t, 'USD').resultado).toEqual({ tipo: 'sobran', monto: centavos(3500) });
    expect(pos(t, 'USD').proyeccion?.serie).toEqual([6000, 6000, 3500, 3500].map(centavos));
    expect(pos(t, 'MXN').resultado.tipo).toBe('nada');
    expect(pos(t, 'MXN').linea).toBe('Incluye los 95,000.00 de Familia Ortega');
    expect(h.nuevo).toMatchObject({ id: 't-r1', cuentaId: 'mxn', de: 'Familia Ortega', meta: 'Hoy 08:15 · BBVA México · Ref. Paquete Madrid' });
    expect(h.proximos.map((p) => [p.fecha, p.nombre])).toEqual([['jue 8', 'Mayorista Caribe'], ['vie 9', 'Hotel Gran Vía Madrid']]);
    expect(h.tdc).toMatchObject({ par: 'EUR/MXN', compra: 21_250_000, venta: 21_100_000, otros: [{ par: 'USD/MXN', base: 'USD', compra: 18_091_183, venta: 18_032_135 }] });
  });
  it('S02 · "Usar para pagar" abre "¿Qué pagas con este cobro?" con el Hotel seleccionado', () => {
    const e = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }], t);
    const p = vistaPanel(e)!;
    expect(p).toMatchObject({ tipo: 'pago', paso: 'pago', titulo: 'Usar el cobro de Familia Ortega', sub: '+95,000.00 MXN · Hoy 08:15 · Ref. Paquete Madrid' });
    expect(p.pago?.opciones).toEqual([
      { id: 't-p2', destinatario: 'Mayorista Caribe', monto: '2,500.00 USD', linea: 'Vence jue 8 · Bloqueo nov-26 · usaría ≈ 45,227.96 MXN', consecuencia: { texto: 'Ya lo cubre tu Cuenta USD', tono: 'neutral' }, seleccionada: false },
      { id: 't-p1', destinatario: 'Hotel Gran Vía Madrid', monto: '4,200.00 EUR', linea: 'Vence vie 9 · Reserva 88213 · usa ≈ 89,250.00 MXN', consecuencia: { texto: 'Cubre el faltante en EUR', tono: 'success' }, seleccionada: true },
    ]);
    expect(p.pago?.resto).toBe('Del cobro quedan ≈ 5,750.00 MXN en tu Cuenta Principal MXN.');
    expect(p.primario).toEqual({ label: 'Continuar', habilitado: true, accion: 'continuarPago' });
    expect(p.secundario).toEqual({ label: 'Cancelar', accion: 'cancelar' });
    const otro = aplicar([{ tipo: 'elegirPago', pagoId: 't-p2' }], e);
    expect(vistaPanel(otro)!.pago?.resto).toBe('Del cobro quedan ≈ 49,772.04 MXN en tu Cuenta Principal MXN.');
    expect(vistaPanel(otro)!.pago?.opciones[0].linea).toContain('usa ≈ 45,227.96 MXN');
    expect(aplicar([{ tipo: 'elegirPago', pagoId: 'no-existe' }], e).panel.pagoElegidoId).toBe('t-p1');
  });
  it('S02 → S03 · Continuar entra a Origen con la cuenta del cobro seleccionada y el título del pago', () => {
    const e = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }, { tipo: 'continuarPago' }], t);
    const p = vistaPanel(e)!;
    expect(p).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Hotel Gran Vía Madrid', sub: '4,200.00 EUR · vence vie 9 · Reserva 88213' });
    expect(e.panel).toMatchObject({ cobroId: 't-r1', pagoElegidoId: 't-p1', origenId: 'mxn' });
    expect(e.panel.orden).toMatchObject({ pagoId: 't-p1', monto: centavos(4200), conFactura: true, referencia: 'Reserva 88213' });
  });
  it('?cobro=<id> y "Cancelar" cierran el ciclo; la importadora sigue entrando a Destino', () => {
    const cerrado = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }, { tipo: 'cerrarPanel' }], t);
    expect(cerrado.panel.abierto).toBe(false);
    expect(aplicar([{ tipo: 'abrirCobro', cobroId: 'otro' }], t).panel.abierto).toBe(false);
    const imp = aplicar([{ tipo: 'abrirCobro', cobroId: 'r1' }], base);
    expect(vistaPanel(imp)).toMatchObject({ tipo: 'pago', paso: 'destino', titulo: 'Pagar' });
    expect(imp.panel).toMatchObject({ origenId: 'mxn', cobroId: 'r1' });
  });
});
