import { describe, it, expect } from 'vitest';
import { aplicar, estadoInicial, pagoPorId, type Accion } from './estado';
import { cuentasActuales, destinoDeCuenta, destinoDeDestinatario, notificaciones, ordenDePago } from './derivados';
import { ARQUETIPO_IDS } from '@/data/arquetipos';
import { estadoDeEscenario } from './escenarios';
import { vistaControl, vistaDestinatarios, vistaHome, vistaMonitoreo, vistaPanel, vistaOperar } from './vistas';
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
  it('próximos de la semana en el inicio; los 10 pagos futuros solo en la sección Movimientos', () => {
    expect(h.proximos.map((p) => p.nombre)).toEqual(['Shenzhen Parts Co.', 'Logística Pacífico', 'Asia Packaging']);
    expect(h.totalProximos).toBe(10);
    expect(h.proximosTodos).toHaveLength(10);
    expect(h.realizados.map((r) => r.fecha)).toEqual(['Hoy', '4 oct', '1 oct']);
  });
  it('tipo de cambio con EUR/MXN debajo', () => {
    expect(fmt.tdc(h.tdc.compra)).toBe('18.091183');
    expect(h.tdc.otros[0]).toMatchObject({ par: 'EUR/MXN', compra: 21_250_000, venta: 21_100_000 });
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
      ['Pagas ≈ 1,280.96 EUR', 'Cubre el faltante en USD', 'success'],
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
    expect(r.concepto).toBe('Pago a proveedores');
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
      { k: 'TDC', v: '18.092415 MXN por USD' },
      { k: 'Concepto', v: 'Pago a proveedores' },
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
    expect(r.concepto).toBe(''); // Concepto opcional: sin factura queda vacío
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
    expect(r.concepto).toBe('');
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
      { k: 'Concepto', v: 'Pago a proveedores' },
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
    expect(p.detalle?.filas).toContainEqual({ k: 'TDC', v: '18.092415 MXN por USD' });
  });
  it('Esc / Cerrar vuelve al inicio sin tocar nada', () => {
    const e = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }, { tipo: 'cerrarPanel' }], base);
    expect(e.panel.abierto).toBe(false);
    expect(vistaHome(e)).toEqual(vistaHome(base));
  });
});

describe('detalle de un pago pactado', () => {
  const pactada = estadoDeEscenario('pactada');
  const detalle = aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], pactada);
  it('muestra el fondeo y la nota de que cancelar se pide por WhatsApp; no hay acción de cancelar', () => {
    const p = vistaPanel(detalle)!;
    expect(p.sub).toBe('27,138.62 MXN · sale el jue 8 · Factura 0457');
    expect(p.detalle).toMatchObject({ clase: 'pactada', titulo: 'Pago pactado', badge: { texto: 'Pactada', tono: 'pactada' } });
    expect(p.detalle?.fondeo).toBe('Ten 27,138.62 MXN en tu Cuenta Principal MXN el jue 8 para que el pago salga.');
    expect(p.detalle?.nota).toBe('Ya cerraste el precio de esta operación. Si necesitas cancelarla, escríbenos por WhatsApp desde Contáctanos.');
    expect(p.primario).toEqual({ label: 'Cerrar', habilitado: true, accion: 'cerrar' });
    expect(p.secundario).toBeNull();
  });
  it('los pendientes y realizados no llevan la nota', () => {
    expect(vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'p1' }], base))!.detalle?.nota).toBeNull();
    expect(vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'r1' }], base))!.detalle?.nota).toBeNull();
  });
});

describe('cargar un pago desde el "+" de Movimientos', () => {
  const asia = destinoDeDestinatario(base.datos.destinatarios.find((d) => d.id === 'ap')!);
  const VIE9 = new Date(2026, 9, 9);
  const abierto = aplicar([{ tipo: 'abrirAgendar' }], base);
  it('empieza en el selector de destino, solo con destinatarios', () => {
    const p = vistaPanel(abierto)!;
    expect(p).toMatchObject({ tipo: 'agendar', paso: 'destino', titulo: 'Cargar un pago' });
    expect(p.destino?.grupos.map((g) => g.titulo)).toEqual(['Destinatarios']);
    expect(p.primario.habilitado).toBe(false);
  });
  it('"Cargar" se habilita solo con monto y fecha hábil (concepto y referencia son opcionales)', () => {
    const conDestino = aplicar([{ tipo: 'agendaDestino', destino: asia }], abierto);
    expect(vistaPanel(conDestino)!.agenda).toMatchObject({ destinatario: 'Asia Packaging', divisa: 'USD', concepto: '', fechaMin: '2026-10-06', fechaMax: '2027-01-04' });
    expect(vistaPanel(conDestino)!.primario).toEqual({ label: 'Cargar', habilitado: false, accion: 'agendar' });
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
  it('al cargar, el pago entra a Próximos, mueve la posición y la confirmación ofrece "Pagar ahora"', () => {
    const e = aplicar([{ tipo: 'agendar' }], lleno);
    const p = vistaPanel(e)!;
    expect(p).toMatchObject({ tipo: 'agendar', paso: 'confirmacion', sub: '250.00 USD · vence vie 9 · Pedido AP-121' });
    expect(p.detalle).toMatchObject({ clase: 'agendado', titulo: 'Pago cargado', badge: { texto: 'Pendiente', tono: 'neutral' }, texto: 'Queda en Próximos para que lo pagues cuando quieras.' });
    expect(p.primario).toEqual({ label: 'Volver al inicio', habilitado: true, accion: 'volverInicio' });
    expect(p.secundario).toEqual({ label: 'Pagar ahora', accion: 'pagar' });
    expect(p.detalle?.orden).toMatchObject({ pagoId: 'a1', monto: centavos(250), conFactura: true });
    const inicio = aplicar([{ tipo: 'volverInicio' }], e);
    expect(inicio.aviso).toEqual({ tipo: 'info', texto: 'Cargaste el pago a Asia Packaging por 250.00 USD. Vence el vie 9.' });
    const h = vistaHome(inicio);
    expect(h.proximos.map((f) => f.nombre)).toEqual(['Shenzhen Parts Co.', 'Logística Pacífico', 'Asia Packaging', 'Asia Packaging']);
    expect(h.totalProximos).toBe(11);
    expect(pos(inicio, 'USD').resultado).toEqual({ tipo: 'faltan', monto: centavos(1250) });
    expect(pos(inicio, 'USD').proyeccion?.serie).toEqual([2000, 2000, 500, -1250].map(centavos));
    const pagoAhora = aplicar([{ tipo: 'abrirPanel', orden: p.detalle!.orden! }], e);
    expect(vistaPanel(pagoAhora)).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Asia Packaging', sub: '250.00 USD · vence vie 9 · Pedido AP-121' });
  });
  it('un vencimiento fuera de la semana no entra al bloque del inicio pero sí a la sección Movimientos, y se abre desde su fila', () => {
    const e = aplicar([{ tipo: 'agendaFecha', fecha: new Date(2026, 9, 21) }, { tipo: 'agendar' }, { tipo: 'volverInicio' }], lleno);
    const h = vistaHome(e);
    expect(h.proximos.some((f) => f.id === 'a1')).toBe(false);
    expect(h.proximosTodos.at(-1)).toMatchObject({ id: 'a1', nombre: 'Asia Packaging', fecha: 'mié 21' });
    expect(pos(e, 'USD').pagosFuturos).toEqual({ cantidad: 4, total: centavos(3250) });
    expect(vistaPanel(aplicar([{ tipo: 'abrirDetalle', id: 'a1' }], e))!.detalle).toMatchObject({ clase: 'agendado', titulo: 'Pago cargado' });
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
  it('?cobro=<id> y "Cancelar" cierran el ciclo; la importadora entra al mismo paso "¿Qué pagas con este cobro?"', () => {
    const cerrado = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }, { tipo: 'cerrarPanel' }], t);
    expect(cerrado.panel.abierto).toBe(false);
    expect(aplicar([{ tipo: 'abrirCobro', cobroId: 'otro' }], t).panel.abierto).toBe(false);
    const imp = aplicar([{ tipo: 'abrirCobro', cobroId: 'r1' }], base);
    const p = vistaPanel(imp)!;
    expect(p).toMatchObject({ tipo: 'pago', paso: 'pago' });
    expect(imp.panel).toMatchObject({ cobroId: 'r1', pagoElegidoId: 'p1' });
    expect(p.pago?.opciones.map((o) => [o.destinatario, o.seleccionada])).toEqual([['Shenzhen Parts Co.', true], ['Logística Pacífico', false], ['Asia Packaging', false], ['Papelería Industrial del Norte', false], ['Transportes del Golfo', false], ['Empaques Monterrey', false], ['Servicios Eléctricos del Bajío', false], ['Aduanas Nogales', false], ['Telecom Empresarial', false], ['Limpieza Corporativa Azteca', false]]);
    expect(p.pago?.otro.label).toBe('Pagar a otro destinatario');
    const origen = aplicar([{ tipo: 'continuarPago' }], imp);
    expect(vistaPanel(origen)).toMatchObject({ paso: 'origen', titulo: 'Pagar a Shenzhen Parts Co.' });
    expect(origen.panel.origenId).toBe('mxn');
  });
});

describe('flujo secundario · turismo (S03–S08)', () => {
  const t = estadoInicial('faltante', {}, 'turismo');
  const VIE9 = new Date(2026, 9, 9);
  const s03 = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }, { tipo: 'continuarPago' }], t);
  it('S03 · MXN con el cobro de hoy cubre el faltante; USD elegible con faltante el jue 8; EUR sin saldo, deshabilitada', () => {
    const p = vistaPanel(s03)!;
    expect(p.origenes.map((o) => [o.nombre, o.saldo, o.pagas, o.consecuencia.texto, o.consecuencia.tono, o.deshabilitada, o.seleccionada])).toEqual([
      ['Cuenta Principal MXN', 'Saldo 420,000.00 MXN · incluye el cobro de hoy', 'Pagas ≈ 89,250.00 MXN', 'Cubre el faltante en EUR', 'success', false, true],
      ['Cuenta USD', 'Saldo 6,000.00 USD', 'Pagas ≈ 4,935.00 USD', 'Te faltarían 1,435.00 USD el jue 8', 'warning', false, false],
      ['Cuenta EUR', 'Saldo 0.00 EUR', 'Pagas 4,200.00 EUR, sin tipo de cambio', 'Sin saldo', 'neutral', true, false],
    ]);
    expect(aplicar([{ tipo: 'elegirOrigen', origenId: 'eur' }], s03).panel.origenId).toBe('mxn');
    expect(aplicar([{ tipo: 'elegirOrigen', origenId: 'usd' }], s03).panel.origenId).toBe('usd');
    // Desde la fila del Hotel ("Pagar") se entra directo a Origen, sin el cobro como contexto.
    const directo = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(t, 't-p1')!) }], t);
    expect(vistaPanel(directo)!.origenes[0].saldo).toBe('Saldo 420,000.00 MXN');
  });
  const s04 = aplicar([{ tipo: 'irPaso', paso: 'revision' }, { tipo: 'fechaValor', fecha: VIE9 }], s03);
  it('S04 · revisión con vie 9: cierra hoy el precio, el dinero sale el vie 9', () => {
    const r = vistaPanel(s04)!.revision!;
    expect(r.fechas.map((f) => [f.etiqueta, f.vence, f.seleccionada])).toEqual([['Hoy', false, false], ['mié 7', false, false], ['jue 8', false, false], ['vie 9', true, true]]);
    expect(r.pagas).toBe(centavos(89_250));
    expect(r.recibe).toBe(centavos(4200));
    expect(r.texto).toBe('Cierras hoy el precio de 4,200.00 EUR. El vie 9 salen ≈ 89,250.00 MXN de tu Cuenta Principal MXN y se envía el pago a Hotel Gran Vía Madrid.');
    expect(r.ayuda).toBe('Hoy tienes el saldo. Asegúrate de que siga en tu cuenta el vie 9.');
    expect(r.efecto).toBe('El vie 9 tu cuenta en pesos queda en ≈ 330,750.00 MXN.');
    expect(fmt.tdc(r.tdc!)).toBe('21.250000');
    const hoy = vistaPanel(aplicar([{ tipo: 'irPaso', paso: 'revision' }], s03))!.revision!;
    expect(hoy.texto).toBe('Vas a pagar 4,200.00 EUR con pesos. Compras los euros a 21.250000 MXN.');
  });
  const s05 = aplicar([{ tipo: 'pedirPrecio' }], s04);
  it('S05 · precio ejecutable 21.251447 (indicativo × 1.0000681) → 89,256.08 MXN; S06 vencido conserva la fecha', () => {
    const p = vistaPanel(s05)!.precio!;
    expect(fmt.tdc(p.tdc!)).toBe('21.251447');
    expect(p.pagas).toBe(centavos(89_256.08));
    expect(p.sale).toBe('El dinero sale el vie 9');
    expect(p.segundos).toBe(120);
    const s06 = aplicar(tick(120), s05);
    expect(vistaPanel(s06)!.precio!.estado).toBe('vencido');
    expect(s06.panel.fechaValor).toEqual(VIE9);
  });
  const s07 = aplicar(TOKEN, s05);
  it('S07 · Pago pactado con el aviso de fondeo', () => {
    const c = vistaPanel(s07)!.confirmacion!;
    expect(c.titulo).toBe('Pago pactado');
    expect(c.texto).toBe('Cerraste el precio en 21.251447. El vie 9 salen 89,256.08 MXN de tu Cuenta Principal MXN y se envían 4,200.00 EUR a Hotel Gran Vía Madrid.');
    expect(c.fondeo).toBe('Ten 89,256.08 MXN en tu Cuenta Principal MXN el vie 9 para que el pago salga.');
  });
  it('S08 · home con el pago pactado', () => {
    const s08 = aplicar([{ tipo: 'volverInicio' }], s07);
    expect(s08.aviso).toEqual({ tipo: 'info', texto: 'Pactaste el pago a Hotel Gran Vía Madrid. El dinero sale el vie 9.' });
    expect(pos(s08, 'EUR').resultado.tipo).toBe('nada');
    expect(pos(s08, 'EUR').linea).toBe('Hotel Gran Vía Madrid: pactado en pesos, sale el vie 9');
    expect(pos(s08, 'MXN')).toMatchObject({ saldo: centavos(420_000), pactadasLiquidar: { cantidad: 1, total: centavos(89_256.08) }, resultado: { tipo: 'sobran', monto: centavos(330_743.92) } });
    const hotel = vistaHome(s08).proximos.find((f) => f.nombre === 'Hotel Gran Vía Madrid')!;
    expect(hotel).toMatchObject({ badge: { texto: 'Pactada', tono: 'pactada' }, detalle: '89,256.08 MXN a 21.251447' });
    expect(vistaHome(s08).posiciones.map((p) => p.divisa)).toEqual(['EUR', 'USD', 'MXN']);
  });
  it('S07H/S08H · con Hoy: pago en proceso, Hotel en Realizados y MXN 330,743.92', () => {
    const s08h = aplicar([{ tipo: 'irPaso', paso: 'revision' }, { tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], s03);
    expect(s08h.aviso).toEqual({ tipo: 'success', texto: 'Pago en proceso. Ya te alcanza para los pagos en EUR de la semana.' });
    expect(pos(s08h, 'MXN')).toMatchObject({ saldo: centavos(330_743.92), resultado: { tipo: 'nada', monto: 0 } });
    expect(pos(s08h, 'EUR').linea).toBe('Hotel Gran Vía Madrid: pagado hoy en pesos');
    expect(vistaHome(s08h).realizados[0]).toMatchObject({ nombre: 'Hotel Gran Vía Madrid', badge: { texto: 'En proceso', tono: 'warning' }, detalle: '4,200.00 EUR a 21.251447' });
    expect(vistaHome(s08h).proximos.map((f) => f.nombre)).toEqual(['Mayorista Caribe']);
  });
  it('escenarios por URL del arquetipo: resuelta y pactada pagan el Hotel', () => {
    expect(pos(estadoDeEscenario('pactada', {}, 'turismo'), 'MXN').pactadasLiquidar).toEqual({ cantidad: 1, total: centavos(89_256.08) });
    expect(pos(estadoDeEscenario('resuelta', {}, 'turismo'), 'MXN').saldo).toBe(centavos(330_743.92));
    expect(pos(estadoDeEscenario('sin-saldo', {}, 'turismo'), 'MXN').saldo).toBe(centavos(20_000));
  });
});

describe('sección Movimientos del menú', () => {
  it('"Ver más" lleva a la lista completa: todos los próximos con sus totales por divisa', () => {
    const h = vistaHome(base);
    expect(h.proximosTodos).toHaveLength(10);
    expect(h.resumenProximos).toBe('10 pagos próximos · 3,000.00 USD · 80,350.50 MXN');
    const e = aplicar([{ tipo: 'onboardingIniciar' }, { tipo: 'seccion', seccion: 'movimientos' }], base);
    expect(e.seccion).toBe('movimientos');
    expect(e.onboarding.activo).toBe(false);
    expect(aplicar([{ tipo: 'seccion', seccion: 'inicio' }], e).seccion).toBe('inicio');
  });
  it('el resumen sigue a las operaciones: pactada y agendado cuentan, lo pagado hoy no', () => {
    expect(vistaHome(estadoDeEscenario('pactada')).resumenProximos).toBe('10 pagos próximos · 3,000.00 USD · 80,350.50 MXN');
    expect(vistaHome(estadoDeEscenario('resuelta')).resumenProximos).toBe('9 pagos próximos · 1,500.00 USD · 80,350.50 MXN');
    expect(vistaHome(estadoInicial('faltante', {}, 'turismo')).resumenProximos).toBe('2 pagos próximos · 2,500.00 USD · 4,200.00 EUR');
  });
});

describe('sección 7 del brief · destino propio sin monto y transferencia por el panel', () => {
  it('"Pagar" del encabezado → Cuenta EUR → Origen deja continuar sin monto y la revisión es editable (compra)', () => {
    const eur = base.datos.cuentas.find((c) => c.id === 'eur')!;
    const e = aplicar([{ tipo: 'abrirPanel', orden: null }, { tipo: 'elegirDestino', destino: destinoDeCuenta(eur) }], base);
    const origen = vistaPanel(e)!;
    expect(origen.paso).toBe('origen');
    expect(origen.primario).toEqual({ label: 'Continuar', habilitado: true, accion: 'continuar' });
    expect(origen.origenes.map((o) => o.pagas)).toEqual(['El monto se elige después', 'El monto se elige después']);
    const rev = aplicar([{ tipo: 'irPaso', paso: 'revision' }], e);
    const r = vistaPanel(rev)!;
    expect(r.revision?.editable).toBe(true);
    expect(r.primario.habilitado).toBe(false);
    const conMonto = aplicar([{ tipo: 'monto', lado: 'recibe', valor: centavos(1000) }], rev);
    expect(vistaPanel(conMonto)!.revision).toMatchObject({ pagas: centavos(21_250), recibe: centavos(1000), ladoFijo: 'recibe' }); // 1,000 × 21.250000
    const desdePagas = aplicar([{ tipo: 'monto', lado: 'pagas', valor: centavos(10_000) }], conMonto);
    expect(vistaPanel(desdePagas)!.revision).toMatchObject({ pagas: centavos(10_000), recibe: centavos(470.59), ladoFijo: 'pagas' }); // 10,000 / 21.250000 = 470.588…
    expect(vistaPanel(desdePagas)!.primario).toEqual({ label: 'Pedir precio', habilitado: true, accion: 'pedirPrecio' });
  });
  it('Shenzhen desde la Cuenta USD es una transferencia: sin TDC, sin fecha valor, token al confirmar', () => {
    const e = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'irPaso', paso: 'revision' }], base);
    const r = vistaPanel(e)!;
    expect(r.sinTdc).toBe(true);
    expect(r.revision?.fechas).toEqual([]);
    expect(r.revision?.tdc).toBeNull();
    expect(r.primario).toEqual({ label: 'Continuar', habilitado: true, accion: 'pedirPrecio' });
    const precio = aplicar([{ tipo: 'pedirPrecio' }], e);
    expect(vistaPanel(precio)!.precio).toMatchObject({ estado: 'sinTdc', pagas: centavos(1500), recibe: centavos(1500) });
    const hecho = aplicar([...TOKEN, { tipo: 'volverInicio' }], precio);
    expect(hecho.operaciones[0]).toMatchObject({ clase: 'pago', estado: 'En proceso', pagas: centavos(1500), recibe: centavos(1500), tdc: null });
    expect(vistaHome(hecho).cuentas.find((c) => c.id === 'usd')?.saldo).toBe(centavos(500));
  });
  it('Mayorista Caribe desde la Cuenta USD (turismo) también es transferencia', () => {
    const t = estadoInicial('faltante', {}, 'turismo');
    const e = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(t, 't-p2')!) }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], t);
    expect(e.operaciones[0]).toMatchObject({ estado: 'En proceso', tdc: null, pagas: centavos(2500) });
    expect(vistaHome(e).cuentas.find((c) => c.id === 'usd')?.saldo).toBe(centavos(3500));
  });
  it('"Pagar a otro destinatario" va al paso Destino con la cuenta del cobro y "Volver" regresa', () => {
    const t = estadoInicial('faltante', {}, 'turismo');
    const e = aplicar([{ tipo: 'abrirCobro', cobroId: 't-r1' }, { tipo: 'otroDestinatario' }], t);
    const p = vistaPanel(e)!;
    expect(p.paso).toBe('destino');
    expect(p.destino?.grupos.map((g) => g.titulo)).toEqual(['Pagos próximos', 'Tus cuentas', 'Destinatarios']);
    expect(p.secundario).toEqual({ label: 'Volver', accion: 'volverPago' });
    expect(e.panel.origenId).toBe('mxn');
    expect(vistaPanel(aplicar([{ tipo: 'irPaso', paso: 'pago' }], e))!.paso).toBe('pago');
  });
});

describe('pendientes: destinatario nuevo, secciones del menú, notificaciones y transferencia sin saldo', () => {
  it('"Agregar destinatario" desde el paso Destino guarda y sigue con el pago a ese destinatario', () => {
    const abierto = aplicar([{ tipo: 'abrirPanel', orden: null }, { tipo: 'abrirDestinatarioNuevo' }], base);
    let p = vistaPanel(abierto)!;
    expect(p).toMatchObject({ tipo: 'destinatario', titulo: 'Agregar destinatario', primario: { label: 'Guardar y pagar', habilitado: false } });
    const lleno = aplicar([{ tipo: 'destinatarioCampo', campo: 'nombre', valor: 'Maderas del Sur' }, { tipo: 'destinatarioCampo', campo: 'divisa', valor: 'USD' }, { tipo: 'destinatarioCampo', campo: 'banco', valor: 'Banorte' }, { tipo: 'destinatarioCampo', campo: 'cuenta', valor: '12' }], abierto);
    p = vistaPanel(lleno)!;
    expect(p.destinatario?.errores.cuenta).toBe('Escribe al menos los últimos 4 dígitos de la cuenta o CLABE.');
    expect(p.primario.habilitado).toBe(false);
    const ok = aplicar([{ tipo: 'destinatarioCampo', campo: 'cuenta', valor: '072180000123456789' }, { tipo: 'guardarDestinatario' }], lleno);
    expect(ok.datos.destinatarios.at(-1)).toEqual({ id: 'd1', nombre: 'Maderas del Sur', divisa: 'USD', banco: 'Banorte', mascara: '6789' });
    expect(vistaPanel(ok)).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Maderas del Sur' });
    expect(vistaPanel(ok)!.origenes.map((o) => o.pagas)).toEqual(['El monto se elige después', 'El monto se elige después', 'El monto se elige después']);
  });
  it('desde Destinatarios el alta solo guarda y avisa; "Pagar" de la lista abre el panel sin monto', () => {
    const e = aplicar([{ tipo: 'seccion', seccion: 'destinatarios' }, { tipo: 'abrirDestinatarioNuevo' }, { tipo: 'destinatarioCampo', campo: 'nombre', valor: 'Textiles Oaxaca' }, { tipo: 'destinatarioCampo', campo: 'banco', valor: 'HSBC México' }, { tipo: 'destinatarioCampo', campo: 'cuenta', valor: '4410' }, { tipo: 'guardarDestinatario' }], base);
    expect(e.panel.abierto).toBe(false);
    expect(e.aviso).toEqual({ tipo: 'success', texto: 'Agregaste a Textiles Oaxaca (HSBC México **** 4410, MXN).' });
    const d = vistaDestinatarios(e);
    expect(d.items.at(-1)).toMatchObject({ nombre: 'Textiles Oaxaca', cuenta: 'HSBC México · **** 4410', pendientes: null });
    expect(d.items[0]).toMatchObject({ nombre: 'Shenzhen Parts Co.', pendientes: '1 pago pendiente · 1,500.00 USD' });
    const pagar = aplicar([{ tipo: 'pagarA', destinatarioId: 'sz' }], e);
    expect(vistaPanel(pagar)).toMatchObject({ tipo: 'pago', paso: 'origen', titulo: 'Pagar a Shenzhen Parts Co.' });
    expect(pagar.panel.orden).toMatchObject({ monto: 0, conFactura: false });
  });
  it('Control de operaciones agrupa por estado y Monitoreo lista los pares con su ejecutable', () => {
    const c = vistaControl(estadoDeEscenario('pactada'));
    expect(c.resumen).toBe('1 operación hoy · 0 en proceso · 1 pactada');
    expect(c.grupos.map((g) => [g.titulo, g.filas.length])).toEqual([['Pactadas (1)', 1], ['En proceso (0)', 0], ['Realizadas (3)', 3]]);
    expect(c.grupos[0].filas[0]).toMatchObject({ nombre: 'Shenzhen Parts Co.', badge: { texto: 'Pactada', tono: 'pactada' }, detalle: '1,500.00 USD a 18.092415' });
    const m = vistaMonitoreo(base);
    expect(m.pares.map((p) => p.par)).toEqual(['USD/MXN', 'EUR/MXN', 'EUR/USD']);
    expect(fmt.tdc(m.pares[0].ejecutableCompra)).toBe('18.092415');
    expect(m.pares[2]).toMatchObject({ compra: 1_175_000, venta: 1_171_000, enPosiciones: false });
  });
  it('las notificaciones salen del estado y abren el movimiento', () => {
    const n = notificaciones(base);
    expect(n.map((x) => x.texto)).toEqual([
      'Entró el cobro de Comercial Norte: 180,000.00 MXN (10:42).',
      'Faltan 1,000.00 USD para los pagos de la semana.',
      'Vence el jue 8: Shenzhen Parts Co., 1,500.00 USD.',
      'Vence el vie 9: Logística Pacífico, 1,000.00 USD.',
      'Vence el vie 9: Asia Packaging, 500.00 USD.',
    ]);
    expect(n[0].movimientoId).toBe('r1');
    const p = vistaPanel(aplicar([{ tipo: 'abrirNotificaciones' }], base))!;
    expect(p).toMatchObject({ tipo: 'notificaciones', sub: '5 avisos de hoy y de la semana' });
    expect(notificaciones(estadoDeEscenario('pactada')).map((x) => x.texto)).toContain('Pactado: 27,138.62 MXN salen el jue 8 para Shenzhen Parts Co..');
  });
  it('transferencia con saldo insuficiente: la cuenta queda deshabilitada y la revisión no deja continuar', () => {
    // Tras pagar a Shenzhen desde USD quedan 500.00 USD: Logística Pacífico (1,000 USD) ya no se puede pagar desde ahí.
    const pagado = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], base);
    const log = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(pagado, 'p2')!) }], pagado);
    const usd = vistaPanel(log)!.origenes.find((o) => o.id === 'usd')!;
    expect(usd).toMatchObject({ deshabilitada: true, consecuencia: { texto: 'No alcanza el saldo', tono: 'neutral' } });
    expect(aplicar([{ tipo: 'elegirOrigen', origenId: 'usd' }], log).panel.origenId).toBe('mxn');
    // Sin monto al entrar (destinatario sin pago), la revisión avisa y bloquea cuando el monto escrito supera el saldo.
    const sinMonto = aplicar([{ tipo: 'pagarA', destinatarioId: 'log' }, { tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'monto', lado: 'recibe', valor: centavos(800) }], pagado);
    const r = vistaPanel(sinMonto)!;
    expect(r.revision?.error).toBe('No alcanza el saldo de tu Cuenta USD (500.00 USD).');
    expect(r.primario.habilitado).toBe(false);
  });
  it('"Ver todas mis cuentas" lista las cuentas con CLABE y ?seccion= acepta las secciones nuevas', () => {
    const p = vistaPanel(aplicar([{ tipo: 'abrirCuentas' }], base))!;
    expect(p.cuentas?.map((c) => [c.nombre, c.saldo, c.clabe])).toEqual([['Cuenta Principal MXN', '1,180,000.00 MXN', '012180000010250014'], ['Cuenta USD', '2,000.00 USD', null], ['Cuenta EUR', '50,000.00 EUR', null]]);
    expect(aplicar([{ tipo: 'seccion', seccion: 'monitoreo' }], base).seccion).toBe('monitoreo');
  });
});

describe('ningún recorrido deja saldo negativo (C-37)', () => {
  type Estado = ReturnType<typeof estadoInicial>;
  const TOKEN_CLASICO: Accion[] = [{ tipo: 'opToken', token: '123456' }, { tipo: 'opConfirmar' }, { tipo: 'opConfirmado', hora: '10:43' }];
  const saldos = (e: Estado) => Object.fromEntries(cuentasActuales(e).map((c) => [c.id, c.saldo]));
  const sinNegativos = (e: Estado, paso: string) => {
    for (const c of cuentasActuales(e)) expect(c.saldo, `${e.arquetipo} · ${paso} · ${c.nombre}`).toBeGreaterThanOrEqual(0);
  };
  /** Paga un pago cargado desde una cuenta por el panel, forzando cada acción aunque la vista la muestre deshabilitada: el reducer tiene que resistir. */
  const pagarPorPanel = (e: Estado, pagoId: string, cuentaId: 'mxn' | 'usd' | 'eur'): Estado => {
    const pago = pagoPorId(e, pagoId);
    if (!pago) return e;
    const pasos: Accion[][] = [
      [{ tipo: 'abrirPanel', orden: ordenDePago(pago) }],
      [{ tipo: 'elegirOrigen', origenId: cuentaId }],
      [{ tipo: 'irPaso', paso: 'revision' }],
      [{ tipo: 'fechaValor', fecha: new Date(2026, 9, 6) }],
      [{ tipo: 'pedirPrecio' }],
      TOKEN,
      [{ tipo: 'volverInicio' }],
    ];
    let s = e;
    for (const acciones of pasos) {
      s = aplicar(acciones, s);
      sinNegativos(s, `${pago.destinatario} desde ${cuentaId} · ${acciones[0].tipo}`);
    }
    return s;
  };
  /** Transferencia, compra o venta por el clásico, también forzada. */
  const operarClasico = (e: Estado, tipo: 'transferir' | 'comprar' | 'vender', origenId: 'mxn' | 'usd' | 'eur', destinoId: string, monto: string, par?: string): Estado => {
    const pasos: Accion[][] = [
      [{ tipo: 'opTipo', valor: tipo }, ...(par ? [{ tipo: 'opPar' as const, par }] : [])],
      [{ tipo: 'opMonto', lado: 'izq', valor: monto }, { tipo: 'opMontoEditando', lado: null }],
      [{ tipo: 'opOrigen', origenId }],
      [{ tipo: 'opDestino', destinoId }],
      [{ tipo: 'opMotivo', motivo: 'Pago a proveedores' }],
      [tipo === 'transferir' ? { tipo: 'opContinuar' } : { tipo: 'opPedirPrecio' }],
      TOKEN_CLASICO,
      [{ tipo: 'opNueva' }],
    ];
    let s = e;
    for (const acciones of pasos) {
      s = aplicar(acciones, s);
      sinNegativos(s, `clásico ${tipo} ${monto} desde ${origenId} a ${destinoId} · ${acciones[0].tipo}`);
    }
    return s;
  };

  for (const arquetipo of ARQUETIPO_IDS) {
    const inicio = estadoInicial('faltante', {}, arquetipo);
    const cuentas = inicio.datos.cuentas.map((c) => c.id);
    it(`${arquetipo}: cada pago cargado desde cada cuenta, uno por uno y encadenados, por el panel`, () => {
      for (const c of cuentas) {
        let encadenado = inicio;
        for (const p of inicio.datos.pagosFuturos) {
          pagarPorPanel(inicio, p.id, c);
          encadenado = pagarPorPanel(encadenado, p.id, c);
        }
      }
    });
    it(`${arquetipo}: transferencias, compras y ventas por el clásico con montos que superan el saldo`, () => {
      for (const c of inicio.datos.cuentas) {
        for (const d of inicio.datos.destinatarios.filter((x) => x.divisa === c.divisa)) {
          operarClasico(inicio, 'transferir', c.id, d.id, String(c.saldo / 100 + 1));
          operarClasico(inicio, 'transferir', c.id, d.id, String(Math.max(c.saldo / 100, 1)));
        }
      }
      let s = operarClasico(inicio, 'comprar', 'mxn', 'usd', '1000000', 'USD/MXN');
      s = operarClasico(s, 'comprar', 'mxn', 'usd', '1000', 'USD/MXN');
      s = operarClasico(s, 'vender', 'usd', 'mxn', '1000000', 'USD/MXN');
      operarClasico(s, 'comprar', 'usd', 'eur', '100000', 'EUR/USD');
    });
  }

  it('importadora: Shenzhen desde Cuenta USD deja 500.00 y Logística Pacífico desde la misma cuenta no se puede pagar', () => {
    const unoPagado = pagarPorPanel(base, 'p1', 'usd');
    expect(saldos(unoPagado).usd).toBe(centavos(500));
    expect(unoPagado.operaciones).toHaveLength(1);
    const abierto = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(unoPagado, 'p2')!) }], unoPagado);
    const usd = vistaPanel(abierto)!.origenes.find((o) => o.nombre === 'Cuenta USD')!;
    expect(usd).toMatchObject({ saldo: 'Saldo 500.00 USD', deshabilitada: true, consecuencia: { texto: 'No alcanza el saldo', tono: 'neutral' } });
    expect(aplicar([{ tipo: 'elegirOrigen', origenId: 'usd' }], abierto).panel.origenId).toBe('mxn');
    // Forzando el recorrido, el pago sale de la cuenta en pesos (el origen por defecto); la Cuenta USD no se toca.
    const dosPagados = pagarPorPanel(unoPagado, 'p2', 'usd');
    expect(saldos(dosPagados).usd).toBe(centavos(500));
    expect(dosPagados.operaciones.map((o) => o.origenId)).toEqual(['mxn', 'usd']);
  });
  it('clásico · Transferir: la cuenta sin saldo para el monto queda deshabilitada con su motivo y el reducer la rechaza', () => {
    const e = aplicar([{ tipo: 'opTipo', valor: 'transferir' }, { tipo: 'opMonto', lado: 'izq', valor: '2500' }, { tipo: 'opMontoEditando', lado: null }], base);
    const v = vistaOperar(e);
    expect(v.origen.opciones.map((o) => [o.nombre, o.deshabilitado, o.motivo])).toEqual([['Cuenta Principal MXN', false, null], ['Cuenta USD', true, 'No alcanza el saldo'], ['Cuenta EUR', false, null]]);
    expect(aplicar([{ tipo: 'opOrigen', origenId: 'usd' }], e).operar.origenId).toBeNull();
    const t = estadoInicial('faltante', {}, 'turismo');
    expect(vistaOperar(aplicar([{ tipo: 'opTipo', valor: 'transferir' }], t)).origen.opciones.find((o) => o.id === 'eur')).toMatchObject({ deshabilitado: true, motivo: 'Sin saldo' });
  });
});

describe('ventana de pago · columna derecha de Origen, Revisión y Precio (C-47)', () => {
  const VIE9 = new Date(2026, 9, 9);
  const indicativo = (valor: number, unidad: string) => ({ valor, unidad, estado: 'indicativo', segundos: 0, porVencer: false, pausado: false });
  const origen = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }], base);
  it('Origen: tipo de cambio indicativo del par de la cuenta elegida, lo que recibe Shenzhen y el vencimiento', () => {
    expect(vistaPanel(origen)!.resumen).toEqual({
      tdc: indicativo(18_091_183, 'MXN por USD'), sinPrecio: null,
      filas: [{ k: 'Shenzhen Parts Co. recibe', v: '1,500.00 USD' }, { k: 'Vence', v: 'jueves 8 de octubre' }], aviso: null, nota: null,
    });
    expect(vistaPanel(aplicar([{ tipo: 'elegirOrigen', origenId: 'eur' }], origen))!.resumen?.tdc).toEqual(indicativo(1_171_000, 'USD por EUR'));
    expect(vistaPanel(aplicar([{ tipo: 'elegirOrigen', origenId: 'usd' }], origen))!.resumen).toMatchObject({ tdc: null, sinPrecio: 'Sin tipo de cambio' });
    const sinCuenta = aplicar([{ tipo: 'abrirPanel', orden: shenzhen }], estadoDeEscenario('sin-saldo'));
    expect(sinCuenta.panel.origenId).toBeNull();
    expect(vistaPanel(sinCuenta)!.resumen).toMatchObject({ tdc: null, sinPrecio: 'Depende de la cuenta que elijas.' });
  });
  const revision = aplicar([{ tipo: 'irPaso', paso: 'revision' }], origen);
  it('Revisión con Hoy: de dónde y cuándo sale el dinero, cómo queda la cuenta y la nota del token', () => {
    expect(vistaPanel(revision)!.resumen).toEqual({
      tdc: indicativo(18_091_183, 'MXN por USD'), sinPrecio: null,
      filas: [{ k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }],
      aviso: null, nota: 'Ten tu token a mano: el precio dura 2 minutos.',
    });
  });
  it('Revisión con fecha valor: la fila lleva el día y, después del vencimiento, el aviso', () => {
    expect(vistaPanel(aplicar([{ tipo: 'fechaValor', fecha: JUE8 }], revision))!.resumen).toMatchObject({
      filas: [{ k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'jue 8' }, { k: 'El jue 8 tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }], aviso: null,
    });
    expect(vistaPanel(aplicar([{ tipo: 'fechaValor', fecha: VIE9 }], revision))!.resumen).toMatchObject({
      filas: [{ k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'vie 9' }, { k: 'El vie 9 tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }],
      aviso: 'El dinero sale después del vencimiento (jue 8).',
    });
  });
  const precio = aplicar([{ tipo: 'pedirPrecio' }], revision);
  it('Precio: el tipo de cambio fijo con su cuenta regresiva y la cuenta con el monto exacto; vencido, vuelve al indicativo', () => {
    const p = vistaPanel(precio)!;
    expect(p.resumen).toEqual({
      tdc: { valor: 18_092_415, unidad: 'MXN por USD', estado: 'fijo', segundos: 120, porVencer: false, pausado: false }, sinPrecio: null,
      filas: [{ k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '1,152,861.38 MXN' }],
      aviso: null, nota: null,
    });
    expect(p.precio).toMatchObject({ pagas: centavos(27_138.62), recibe: centavos(1500), ladoFijo: 'recibe', pagasAprox: false });
    const vencido = vistaPanel(aplicar(tick(120), precio))!;
    expect(vencido.resumen).toMatchObject({ tdc: { valor: 18_092_415, estado: 'vencido' }, filas: [{ k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }] });
    expect(vencido.precio).toMatchObject({ pagas: centavos(27_136.77), pagasAprox: true });
  });
  it('transferencia en la misma divisa: "Sin tipo de cambio" en lugar del precio y montos exactos', () => {
    const t = aplicar([{ tipo: 'elegirOrigen', origenId: 'usd' }, { tipo: 'irPaso', paso: 'revision' }], origen);
    expect(vistaPanel(t)!.resumen).toEqual({
      tdc: null, sinPrecio: 'Sin tipo de cambio',
      filas: [{ k: 'Sale de', v: 'Cuenta USD' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '500.00 USD' }],
      aviso: null, nota: null,
    });
    expect(vistaPanel(aplicar([{ tipo: 'pedirPrecio' }], t))!.resumen).toMatchObject({ tdc: null, sinPrecio: 'Sin tipo de cambio', filas: [{ k: 'Sale de', v: 'Cuenta USD' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '500.00 USD' }] });
  });
  it('los pasos de una columna no llevan columna derecha', () => {
    expect(vistaPanel(aplicar([{ tipo: 'abrirPanel', orden: null }], base))!.resumen).toBeNull();
    expect(vistaPanel(aplicar([...TOKEN], precio))!.resumen).toBeNull();
  });
});
