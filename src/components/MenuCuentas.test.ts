import { describe, it, expect } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { aplicar, estadoInicial, pagoPorId, type Accion, type EstadoApp } from '@/state/estado';
import { ordenDePago } from '@/state/derivados';
import { vistaHome, vistaPanel } from '@/state/vistas';
import { Boton } from './ui/Boton';
import { MenuCuentas } from './MenuCuentas';

// "Tus cuentas" en el menú lateral (C-56). Sin DOM (los tests corren en node): el HTML sale de renderToStaticMarkup y los clics,
// del onClick de cada elemento del árbol que devuelve el componente; la acción que despacha pasa por el reducer.
const base = estadoInicial('faltante');
const TOKEN: Accion[] = [{ tipo: 'token', token: '123456' }, { tipo: 'confirmar' }, { tipo: 'confirmado', hora: '10:43' }];
/** Shenzhen (1,500.00 USD) desde la Cuenta Principal MXN, con precio y token: salen 27,138.62 MXN. */
const pagado = aplicar([{ tipo: 'abrirPanel', orden: ordenDePago(pagoPorId(base, 'p1')!) }, { tipo: 'irPaso', paso: 'revision' }, { tipo: 'pedirPrecio' }, ...TOKEN, { tipo: 'volverInicio' }], base);

type Props = { children?: ReactNode; onClick?: () => void; title?: string; className?: string };
const elementos = (n: ReactNode): ReactElement<Props>[] => (Array.isArray(n) ? n.flatMap(elementos) : isValidElement<Props>(n) ? [n, ...elementos(n.props.children)] : []);
const texto = (n: ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(texto).join(' ') : isValidElement<Props>(n) ? texto(n.props.children) : '');
const html = (e: EstadoApp) => renderToStaticMarkup(createElement(MenuCuentas, { vista: vistaHome(e).cuentas, dispatch: () => {} }));
/** "Clic" en el elemento elegido del bloque y estado después de la acción que despacha. */
const clic = (e: EstadoApp, elegir: (el: ReactElement<Props>) => boolean) => {
  const acciones: Accion[] = [];
  const el = elementos(MenuCuentas({ vista: vistaHome(e).cuentas, dispatch: (a) => acciones.push(a) }) as ReactNode).find(elegir);
  expect(el).toBeDefined();
  el!.props.onClick!();
  return aplicar(acciones, e);
};
const fila = (nombre: string) => (el: ReactElement<Props>) => el.type === 'button' && texto(el.props.children).startsWith(nombre);

describe('"Tus cuentas" en el menú lateral (C-56)', () => {
  it('una fila por cuenta, en el orden de siempre: nombre y, debajo, el saldo con su divisa y la máscara', () => {
    expect(vistaHome(base).cuentas).toEqual({
      items: [
        { id: 'mxn', nombre: 'Cuenta Principal MXN', saldo: '1,180,000.00 MXN', mascara: '····1025' },
        { id: 'usd', nombre: 'Cuenta USD', saldo: '2,000.00 USD', mascara: '····2024' },
        { id: 'eur', nombre: 'Cuenta EUR', saldo: '50,000.00 EUR', mascara: '····3033' },
      ],
      verTodas: 'Ver todas mis cuentas',
    });
    const h = html(base);
    expect(h).toContain('Tus cuentas');
    expect(h).toMatch(/Cuenta Principal MXN<\/span><span[^>]*><span[^>]*>1,180,000.00 MXN<\/span><span[^>]*>····1025<\/span>/);
    expect(h).toContain('>Ver todas mis cuentas</button>');
  });

  it('los saldos cambian con lo operado en la sesión: después de pagar a Shenzhen, la Cuenta Principal MXN muestra 1,152,861.38 MXN', () => {
    expect(html(base)).toContain('1,180,000.00 MXN');
    const h = html(pagado);
    expect(h).toContain('>1,152,861.38 MXN<');
    expect(h).not.toContain('1,180,000.00 MXN');
    // Los mismos saldos que el panel "Tus cuentas".
    expect(vistaHome(pagado).cuentas.items.map((c) => c.saldo)).toEqual(vistaPanel(aplicar([{ tipo: 'abrirCuentas' }], pagado))!.cuentas!.map((c) => c.saldo));
  });

  it('una fila abre el panel "Tus cuentas" con esa cuenta primero y el foco en ella; las demás siguen en su orden', () => {
    const e = clic(base, fila('Cuenta EUR'));
    expect(e.panel).toMatchObject({ abierto: true, tipo: 'cuentas', cuentaElegida: 'eur' });
    const p = vistaPanel(e)!;
    expect(p.titulo).toBe('Tus cuentas');
    expect(p.cuentas!.map((c) => [c.nombre, c.saldo, c.elegida])).toEqual([['Cuenta EUR', '50,000.00 EUR', true], ['Cuenta Principal MXN', '1,180,000.00 MXN', false], ['Cuenta USD', '2,000.00 USD', false]]);
    expect(vistaPanel(clic(base, fila('Cuenta Principal MXN')))!.cuentas!.map((c) => c.id)).toEqual(['mxn', 'usd', 'eur']);
  });

  it('"Ver todas mis cuentas" abre el mismo panel en el orden de siempre, sin cuenta elegida', () => {
    const e = clic(base, (el) => el.type === Boton && texto(el.props.children) === 'Ver todas mis cuentas');
    expect(e.panel).toMatchObject({ abierto: true, tipo: 'cuentas', cuentaElegida: null });
    expect(vistaPanel(e)!.cuentas!.map((c) => [c.id, c.elegida])).toEqual([['mxn', false], ['usd', false], ['eur', false]]);
  });

  it('con el menú colapsado, un ítem de ícono con nombre accesible y title "Tus cuentas" abre el panel', () => {
    // Oculto con el menú expandido; se muestra cuando el shell baja de 1100 px (menú de 64 px), donde el bloque se oculta.
    expect(html(base)).toMatch(/<section[^>]*class="[^"]*@max-lg\/shell:hidden/);
    const item = elementos(MenuCuentas({ vista: vistaHome(base).cuentas, dispatch: () => {} }) as ReactNode).find((el) => el.props.title === 'Tus cuentas')!;
    expect(item.props).toMatchObject({ 'aria-label': 'Tus cuentas', title: 'Tus cuentas' });
    expect(item.props.className).toMatch(/(^| )hidden( |$)/);
    expect(item.props.className).toContain('@max-lg/shell:flex');
    const e = clic(base, (el) => el.props.title === 'Tus cuentas');
    expect(e.panel).toMatchObject({ abierto: true, tipo: 'cuentas', cuentaElegida: null });
    expect(vistaPanel(e)!.titulo).toBe('Tus cuentas');
  });

  it('con más de tres cuentas se ven las tres primeras y el link dice cuántas hay', () => {
    const eur = base.datos.cuentas.find((c) => c.id === 'eur')!;
    const cuatro: EstadoApp = { ...base, datos: { ...base.datos, cuentas: [...base.datos.cuentas, { ...eur, nombre: 'Cuenta EUR Viajes', mascara: '7781' }] } };
    const m = vistaHome(cuatro).cuentas;
    expect(m.items.map((c) => c.nombre)).toEqual(['Cuenta Principal MXN', 'Cuenta USD', 'Cuenta EUR']);
    expect(m.verTodas).toBe('Ver todas mis cuentas (4)');
    expect(vistaPanel(aplicar([{ tipo: 'abrirCuentas' }], cuatro))!.cuentas).toHaveLength(4);
  });

  it('turismo: sus tres cuentas con sus saldos', () => {
    expect(vistaHome(estadoInicial('faltante', {}, 'turismo')).cuentas.items.map((c) => [c.nombre, c.saldo, c.mascara])).toEqual([
      ['Cuenta Principal MXN', '420,000.00 MXN', '····4410'],
      ['Cuenta USD', '6,000.00 USD', '····8821'],
      ['Cuenta EUR', '0.00 EUR', '····9034'],
    ]);
  });
});
