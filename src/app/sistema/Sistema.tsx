'use client';
import { useState, type FC, type ReactNode } from 'react';
import Link from 'next/link';
import { fechasLiquidacion } from '@/lib/fx';
import { HOY } from '@/data/escenario-importadora';
import { Boton } from '@/components/ui/Boton';
import { Badge } from '@/components/ui/Badge';
import { Alerta } from '@/components/ui/Alerta';
import { Pestanas } from '@/components/ui/Pestanas';
import { CampoTexto, CampoSelector, OpcionLista } from '@/components/ui/Campo';
import { Icono, ICONOS, type NombreIcono } from '@/components/ui/Icono';
import { ChipDivisa } from '@/components/ui/ChipDivisa';
import { Logo } from '@/components/ui/Logo';
import { TarjetaPosicion } from '@/components/TarjetaPosicion';
import { OpcionOrigen } from '@/components/OpcionOrigen';
import { FechaLiquidacion } from '@/components/FechaLiquidacion';
import { BloqueMonto } from '@/components/BloqueMonto';
import { PrecioEjecutable } from '@/components/PrecioEjecutable';
import { CampoToken } from '@/components/CampoToken';
import { CajaTdcValiu } from '@/components/CajaTdcValiu';
import { FranjaNuevo } from '@/components/FranjaNuevo';
import { FilaMovimiento } from '@/components/FilaMovimiento';
import { TarjetaTipoDeCambio } from '@/components/TarjetaTipoDeCambio';
import { ModuloCuentas } from '@/components/ModuloCuentas';

const Seccion: FC<{ id: string; titulo: string; nota?: string; children: ReactNode }> = ({ id, titulo, nota, children }) => (
  <section id={id} aria-labelledby={`${id}-t`} className="flex flex-col gap-4">
    <div className="flex flex-col gap-1 border-b border-app-divider pb-2">
      <h2 id={`${id}-t`} className="text-h2 font-semibold">{titulo}</h2>
      {nota ? <span className="text-caption text-app-ink-2">{nota}</span> : null}
    </div>
    {children}
  </section>
);

const Caso: FC<{ titulo: string; children: ReactNode; ancho?: string }> = ({ titulo, children, ancho }) => (
  <div className={['flex flex-col gap-2.5', ancho].filter(Boolean).join(' ')}>
    <span className="text-caption font-semibold">{titulo}</span>
    <div className="flex flex-col gap-3 rounded-sm bg-app-surface p-5 shadow-mid">{children}</div>
  </div>
);

const Muestra: FC<{ token: string; nombre: string; uso: string }> = ({ token, nombre, uso }) => (
  <div className="flex items-center gap-3">
    <span className="size-10 shrink-0 rounded-sm border border-app-divider" style={{ background: `var(${token})` }} />
    <div className="flex min-w-0 flex-col"><span className="text-body font-semibold">{nombre}</span><span className="truncate text-caption text-app-ink-2">{token} · {uso}</span></div>
  </div>
);

const COLORES: [string, string, string][] = [
  ['--app-primary', 'Indigo · acción', 'primario, borde secundario, seleccionado'],
  ['--app-accent', 'Core light · foco / activo', 'nav activo, subrayado de tab, foco, borde TDC'],
  ['--app-accent-bg', 'V20', 'nav activo, tab activa, hover de fila'],
  ['--app-selected-bg', 'Selected bg', 'opción seleccionada'],
  ['--app-ink', 'V Black', 'texto principal'],
  ['--app-ink-label', 'Dark Navy', 'label de inputs'],
  ['--app-ink-2', 'Grey1', 'texto secundario (D-18)'],
  ['--app-ink-3', 'Grey2', 'placeholder'],
  ['--app-ink-disabled', 'Grey3', 'inactivo'],
  ['--app-border-input', 'Navy', 'borde de input 0.5 px'],
  ['--app-divider', 'Divider', 'separadores'],
  ['--app-canvas', 'Grey4', 'fondo de app'],
  ['--app-success-strong', 'Success strong', 'montos positivos'],
  ['--app-danger', 'Danger', 'faltantes (D-19)'],
  ['--app-chart-accent', 'V80', 'gráficas'],
];

const TIPOS: [string, string, string][] = [
  ['text-display font-bold', 'Display 32/36 · 700', 'cifra protagonista'],
  ['text-h1 font-bold', 'H1 24/28 · 700', 'título de página'],
  ['text-h2 font-semibold', 'H2 20/24 · 600', 'título de panel'],
  ['text-h3 font-semibold', 'H3 16/24 · 600', 'títulos de tarjeta'],
  ['text-amount font-semibold tabular-nums', 'Monto 24/32 · 600', 'resultado, precio'],
  ['text-tdc font-bold tabular-nums', 'TDC 18/24 · 700', 'caja TDC Valiu'],
  ['text-body-lg font-semibold', 'Body 1 16/20 · 600', 'saldos, montos de inputs'],
  ['text-body', 'Body 2 14/20 · 400', 'base, celdas, nav'],
  ['text-body font-semibold', 'Body 2 14/20 · 600', 'montos de tabla'],
  ['text-caption font-bold text-app-ink-label', 'Label 12/16 · 700', 'labels de formulario'],
  ['text-caption text-app-ink-2', 'Caption 12/16 · 400', 'ayudas, footer'],
  ['text-overline font-semibold tracking-overline text-app-currency', 'Overline 10/12 · 600 · 1.5', 'código de divisa en inputs'],
];

const fechas = fechasLiquidacion(HOY, new Date(2026, 9, 8));
const fechasSinVence = fechasLiquidacion(HOY);

/** Guía viva: tokens (src/styles/tokens.css) y componentes del flujo en sus estados. */
export const Sistema: FC = () => {
  const [fecha, setFecha] = useState(fechas[0].fecha);
  const [token, setToken] = useState('47');
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a');
  const [texto, setTexto] = useState('');
  const [selAbierto, setSelAbierto] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [origen, setOrigen] = useState('mxn');

  return (
    <div className="flex min-h-dvh flex-col bg-app-canvas text-app-ink">
      <header className="flex flex-wrap items-center gap-6 border-b border-app-ink-disabled bg-app-surface px-6 py-3.5">
        <Logo />
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-bold">Sistema · tokens y componentes</span>
          <span className="text-caption text-app-ink-2">Todo sale de src/styles/tokens.css (copia del DS oficial + alias --app-*) y de los mismos componentes que usa la app.</span>
        </div>
        <nav className="ml-auto flex gap-4 text-caption font-semibold">
          <Link href="/" className="text-app-primary underline">App</Link>
          <Link href="/tablero" className="text-app-primary underline">Tablero</Link>
        </nav>
      </header>

      <div className="flex flex-col gap-12 p-8">
        <Seccion id="color" titulo="Color" nota="Dos tintas que no se intercambian: indigo = acción · core light = foco, activo y ON (D-16). Sin mint todavía.">
          <div className="grid grid-cols-3 gap-4 @max-md/shell:grid-cols-1">{COLORES.map(([t, n, u]) => <Muestra key={t} token={t} nombre={n} uso={u} />)}</div>
          <div className="flex flex-wrap gap-3">
            <Badge tono="success">Success · Alcanza, En vivo, Precio fijo</Badge>
            <Badge tono="warning">Warning · En proceso, Hoy no alcanza</Badge>
            <Badge tono="error">Error · Falta, Vencido</Badge>
            <Badge tono="neutral">Neutral · Fijo, Sin tipo de cambio</Badge>
            <Badge tono="pactada">Pactada (D-29)</Badge>
            <Badge tono="info">Info · Precio indicativo</Badge>
            <Badge tono="neutral" futuro>Programar · Futuro</Badge>
            <Badge tono="neutral" icono="lock">Fijo</Badge>
          </div>
        </Seccion>

        <Seccion id="tipografia" titulo="Tipografía" nota="Montserrat 400 / 500 / 600 / 700 vía next/font. Números con tabular-nums.">
          <div className="flex flex-col gap-3 rounded-sm bg-app-surface p-5 shadow-mid">
            {TIPOS.map(([c, n, u]) => (
              <div key={n} className="grid grid-cols-[minmax(0,1fr)_260px] items-baseline gap-4">
                <span className={c}>1,180,000.00 MXN · Posición por divisa</span>
                <span className="text-caption text-app-ink-2">{n} · {u}</span>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion id="geometria" titulo="Geometría y elevación" nota="Radios 4 / 8 / 16 / 40 · Shadow Mid / High · --shadow-md / --shadow-lg · espaciado 4 / 8 / 12 / 16 / 24 / 32 / 40 / 64.">
          <div className="flex flex-wrap items-end gap-6">
            {(['xs', 'sm', 'md', 'lg', '2xl'] as const).map((r) => (
              <div key={r} className="flex flex-col items-center gap-2"><span className={`size-16 border border-app-primary bg-app-accent-bg rounded-${r}`} /><span className="text-caption text-app-ink-2">rounded-{r}</span></div>
            ))}
            {(['mid', 'high', 'md', 'lg'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-2"><span className={`size-16 rounded-sm bg-app-surface shadow-${s}`} /><span className="text-caption text-app-ink-2">shadow-{s}</span></div>
            ))}
          </div>
        </Seccion>

        <Seccion id="iconos" titulo="Íconos" nota="Unicons Line (@iconscout/react-unicons, D-17): 14 info · 16 inputs · 18 sidebar · 20 módulos · 22 campana · 24 acciones · 48 confirmación. El ícono custom de IA sigue pendiente (placeholder lightbulb-alt).">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(ICONOS) as NombreIcono[]).map((n) => (
              <div key={n} className="flex w-28 flex-col items-center gap-1.5 rounded-sm bg-app-surface p-3 shadow-mid"><Icono nombre={n} tamano="2xl" /><span className="text-caption text-app-ink-2">{n}</span></div>
            ))}
          </div>
        </Seccion>

        <Seccion id="botones" titulo="Botones" nota="Primary (hover #0086FF) · Secondary (hover #F6FBFF) · deshabilitado #F5F7FA / #DCDCDE · link de texto. Mid 32 · Large 36 · ExtraLarge 40.">
          <div className="flex flex-wrap items-center gap-4">
            <Boton tamano="mid">Primary Mid</Boton><Boton>Primary Large</Boton><Boton tamano="xl">Primary ExtraLarge</Boton><Boton disabled>Deshabilitado</Boton>
            <Boton variante="secondary" tamano="mid">Secondary Mid</Boton><Boton variante="secondary">Secondary Large</Boton><Boton variante="secondary" disabled>Deshabilitado</Boton>
            <Boton variante="link" className="font-bold">Pagar</Boton><Boton variante="link-caption">Comprobante</Boton>
          </div>
        </Seccion>

        <Seccion id="alertas" titulo="Alerts" nota="Padding 16, gap 16, borde 1 px del color fuerte, radio 8. Compactas para AvisoResultado.">
          <div className="grid grid-cols-2 gap-4 @max-md/shell:grid-cols-1">
            <Alerta tono="success" compacta titulo="Pago enviado. Ya te alcanza para los pagos en USD de la semana." onCerrar={() => {}} />
            <Alerta tono="info" compacta icono="calendar-alt" titulo="Pactaste el pago a Shenzhen Parts Co. El dinero sale el jue 8." onCerrar={() => {}} />
            <Alerta tono="error" titulo="El precio venció. Pide uno nuevo.">El precio fijo dura 2 minutos. Los montos volvieron al indicativo.</Alerta>
            <Alerta tono="warning" titulo="Mercado cerrado. Abre mañana a las 6:30." extra={<Badge tono="neutral" futuro className="self-center">Programar · Futuro</Badge>} className="items-center">Operas de lunes a viernes de 6:30 a 16:30, hora de CDMX.</Alerta>
            <Alerta tono="info">Estás en la vista anterior de Operar. Puedes seguir usándola mientras te acostumbras al nuevo flujo de pago.</Alerta>
          </div>
        </Seccion>

        <Seccion id="controles" titulo="Inputs, selectores y tabs" nota="Input min-height 48, padding 12, radio 8, borde 0.5 px #021734; activo 1 px #0086FF; error 1 px #B40909 con mensaje 12/500. Foco visible en todo control.">
          <div className="grid grid-cols-3 gap-4 @max-md/shell:grid-cols-1">
            <CampoTexto etiqueta="Referencia" opcional valor={texto} onCambiar={setTexto} placeholder="Ej. Factura 0457" />
            <CampoTexto etiqueta="Con error" valor="5,000.00" onCambiar={() => {}} monto sufijo="USD" error="Supera tu saldo disponible: 2,000.00 USD." />
            <CampoTexto etiqueta="Deshabilitado" valor="" onCambiar={() => {}} placeholder="Placeholder" disabled />
            <CampoSelector etiqueta="Motivo de pago" valor={sel} placeholder="Elige un motivo" abierto={selAbierto} onAbrir={setSelAbierto}>
              {['Pago de factura', 'Pago a proveedores', 'Compra de divisas'].map((m) => <OpcionLista key={m} seleccionada={m === sel} onElegir={() => { setSel(m); setSelAbierto(false); }}><span className="text-body">{m}</span></OpcionLista>)}
            </CampoSelector>
            <div className="col-span-2 flex flex-col gap-1.5 @max-md/shell:col-span-1">
              <span className="text-caption font-bold text-app-ink-label">Tabs</span>
              <div className="rounded-sm bg-app-surface"><Pestanas etiqueta="Ejemplo" llenas pestanas={[{ id: 'a', label: 'Comprar' }, { id: 'b', label: 'Vender' }, { id: 'c', label: 'Transferir' }]} activa={tab} onCambiar={setTab} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 @max-md/shell:grid-cols-1">
            <Caso titulo="CampoToken · habilitado"><CampoToken valor={token} habilitado onChange={setToken} /></Caso>
            <Caso titulo="CampoToken · deshabilitado (precio vencido)"><CampoToken valor="" habilitado={false} onChange={() => {}} /></Caso>
          </div>
        </Seccion>

        <Seccion id="fecha" titulo="FechaLiquidacion" nota="Segmented del DS a todo el ancho; elegida con el color del Figma (D-28). role=radiogroup, ← → mueven la selección. Oculto sin tipo de cambio.">
          <div className="grid grid-cols-2 gap-6 @max-md/shell:grid-cols-1">
            <Caso titulo="Interactivo · el pago vence el jue 8"><FechaLiquidacion opciones={fechas} valor={fecha} onChange={setFecha} /></Caso>
            <Caso titulo="Otra fecha: jue 8 · la operación queda Pactada"><FechaLiquidacion opciones={fechas} valor={fechas[2].fecha} onChange={() => {}} /></Caso>
            <Caso titulo="Vence después del vie 9: ninguna opción lleva “vence”"><FechaLiquidacion opciones={fechasSinVence} valor={fechasSinVence[0].fecha} onChange={() => {}} /></Caso>
            <Caso titulo="Hover (mié 7)"><FechaLiquidacion opciones={fechas} valor={fechas[0].fecha} onChange={() => {}} demoHover={1} /></Caso>
            <Caso titulo="Foco con teclado (mié 7)"><FechaLiquidacion opciones={fechas} valor={fechas[0].fecha} onChange={() => {}} demoFoco={1} /></Caso>
            <Caso titulo="Transferencia en la misma divisa"><div className="flex min-h-[86px] items-center rounded-sm border border-dashed border-app-ink-3 p-4 text-pretty text-caption text-app-ink-2">No se muestra: sin tipo de cambio no hay precio que cerrar ni fecha que elegir.</div></Caso>
          </div>
        </Seccion>

        <Seccion id="posicion" titulo="TarjetaPosicion" nota="Protagonista: blanca, radio 8, Shadow Mid. Resultado 24/600; faltan en #B40909 con badge Error; un solo primario por vista.">
          <div className="grid grid-cols-3 gap-6 @max-md/shell:grid-cols-1">
            <TarjetaPosicion divisa="USD" nombre="Dólares" saldo={2000} pagosFuturos={{ cantidad: 3, total: 3000 }} resultado={{ tipo: 'faltan', monto: 1000 }} proyeccion={{ serie: [2000, 2000, 500, -1000], etiquetas: ['mar 6', 'mié 7', 'jue 8', 'vie 9'] }} linea="≈ 18,091.18 MXN a precio de compra" accion={{ label: 'Comprar 1,000 USD', onClick: () => {} }} />
            <TarjetaPosicion divisa="MXN" nombre="Pesos" saldo={1180000} pactadas={{ cantidad: 1, total: 27138.62 }} pagosFuturos={{ cantidad: 7, total: 80350.5 }} resultado={{ tipo: 'sobran', monto: 1072510.88 }} linea="Incluye los 180,000.00 de Comercial Norte" />
            <TarjetaPosicion divisa="MXN" nombre="Pesos" saldo={0} pactadas={{ cantidad: 1, total: 27138.62 }} pagosFuturos={{ cantidad: 0, total: 0 }} resultado={{ tipo: 'faltan', monto: 27138.62 }} linea="Fondea 27,138.62 MXN antes del jue 8" enlace={{ label: 'Ver datos para depositar' }} />
            <TarjetaPosicion divisa="EUR" nombre="Euros" saldo={50000} pagosFuturos={{ cantidad: 0, total: 0 }} resultado={{ tipo: 'nada', monto: 0 }} />
          </div>
        </Seccion>

        <Seccion id="origen" titulo="OpcionOrigen" nota="Radio 20 px; seleccionada = borde indigo + bg #F0F1FD. La consecuencia va en badge (D-20); “Hoy no alcanza” se puede elegir igual.">
          <div className="grid grid-cols-2 gap-6 @max-md/shell:grid-cols-1">
            <div role="radiogroup" aria-label="Ejemplo" className="flex flex-col gap-2.5">
              <OpcionOrigen cuenta="Cuenta Principal MXN" saldo="Saldo 1,180,000.00 MXN" pagas="Pagas ≈ 27,136.77 MXN" consecuencia={{ texto: 'Cubre el faltante en USD', tono: 'success' }} seleccionada={origen === 'mxn'} onElegir={() => setOrigen('mxn')} />
              <OpcionOrigen cuenta="Cuenta USD" saldo="Saldo 2,000.00 USD" pagas="Pagas 1,500.00 USD, sin tipo de cambio" consecuencia={{ texto: 'Te faltarían 1,000.00 USD el viernes', tono: 'warning' }} seleccionada={origen === 'usd'} onElegir={() => setOrigen('usd')} />
              <OpcionOrigen cuenta="Cuenta EUR" saldo="Saldo 50,000.00 EUR" pagas="Pagas ≈ 1,390.18 EUR" consecuencia={{ texto: 'Sin pagos pendientes en euros', tono: 'neutral' }} seleccionada={origen === 'eur'} onElegir={() => setOrigen('eur')} />
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-caption font-semibold">Hoy no alcanza el saldo · se puede elegir igual</span>
              <OpcionOrigen cuenta="Cuenta Principal MXN" saldo="Saldo 20,000.00 MXN" pagas="Pagas ≈ 27,136.77 MXN" consecuencia={{ texto: 'Hoy no alcanza', tono: 'warning', ayuda: 'Puedes cerrar el precio y fondear antes del día que elijas.' }} seleccionada onElegir={() => {}} />
            </div>
          </div>
        </Seccion>

        <Seccion id="panel" titulo="Bloques del panel" nota="BloqueMonto, PrecioEjecutable (fijo / últimos 30 s / vencido) y CajaTdcValiu.">
          <div className="grid grid-cols-3 gap-6 @max-md/shell:grid-cols-1">
            <Caso titulo="BloqueMonto"><BloqueMonto pagas={{ monto: 27136.77, divisa: 'MXN', enVivo: true }} recibe={{ monto: 1500, divisa: 'USD', fijo: true, destinatario: 'Shenzhen Parts Co. recibe' }} /></Caso>
            <Caso titulo="PrecioEjecutable · fijo"><PrecioEjecutable estado="fijo" tdc={18.092415} segundos={119} pagas={27138.62} pagasDivisa="MXN" recibe={1500} recibeDivisa="USD" destinatario="Shenzhen Parts Co. recibe" desde="Cuenta Principal MXN" sale="El dinero sale el jue 8" /></Caso>
            <Caso titulo="PrecioEjecutable · últimos 30 s"><PrecioEjecutable estado="fijo" tdc={18.092415} segundos={28} porVencer pagas={27138.62} pagasDivisa="MXN" recibe={1500} recibeDivisa="USD" destinatario="Shenzhen Parts Co. recibe" desde="Cuenta Principal MXN" /></Caso>
            <Caso titulo="PrecioEjecutable · vencido"><PrecioEjecutable estado="vencido" tdc={18.091183} segundos={0} pagas={27136.77} pagasAprox pagasDivisa="MXN" recibe={1500} recibeDivisa="USD" destinatario="Shenzhen Parts Co. recibe" desde="Cuenta Principal MXN" /></Caso>
            <Caso titulo="CajaTdcValiu"><div className="flex flex-wrap gap-3"><CajaTdcValiu tdc={18.091183} tipo="Indicativo" /><CajaTdcValiu tdc={18.092415} tipo="Ejecutable" /><CajaTdcValiu tdc={18.091183} tipo="Último cierre" apagada /></div></Caso>
          </div>
        </Seccion>

        <Seccion id="home" titulo="Módulos del home" nota="FranjaNuevo, FilaMovimiento (badge solo en estados no finales, D-23), TarjetaTipoDeCambio y ModuloCuentas.">
          <div className="grid grid-cols-3 gap-6 @max-md/shell:grid-cols-1">
            <div className="col-span-2 flex flex-col gap-4 @max-md/shell:col-span-1">
              <FranjaNuevo monto={180000} divisa="MXN" origen="Comercial Norte" meta="Hoy 10:42 · BBVA México · Ref. factura 2231" onUsar={() => {}} />
              <div className="flex flex-col rounded-sm bg-app-surface px-6 py-2">
                <FilaMovimiento fecha="jue 8" nombre="Shenzhen Parts Co." monto={-1500} divisa="USD" onPagar={() => {}} />
                <FilaMovimiento fecha="jue 8" nombre="Shenzhen Parts Co." detalle="27,138.62 MXN a 18.092415" monto={-1500} divisa="USD" estado={{ texto: 'Pactada', tono: 'pactada' }} />
                <FilaMovimiento fecha="Hoy" nombre="Shenzhen Parts Co." detalle="1,500.00 USD a 18.092415" monto={-27138.62} divisa="MXN" estado={{ texto: 'En proceso', tono: 'warning' }} />
                <FilaMovimiento fecha="Hoy" nombre="Comercial Norte" monto={180000} divisa="MXN" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TarjetaTipoDeCambio par="USD/MXN" compra={18.091183} venta={18.032135} tendencia={[18.062, 18.071, 18.068, 18.084, 18.079, 18.095, 18.088, 18.091]} hora="10:42" enVivo />
              <ModuloCuentas cuentas={[{ id: 'mxn', nombre: 'Cuenta Principal MXN', mascara: '1025', saldo: 1180000, divisa: 'MXN' }, { id: 'usd', nombre: 'Cuenta USD', mascara: '2024', saldo: 2000, divisa: 'USD' }]} />
            </div>
          </div>
          <div className="flex items-center gap-3"><ChipDivisa divisa="USD" /><ChipDivisa divisa="MXN" chico /><span className="text-caption text-app-ink-2">ChipDivisa: bg Grey4, radio 4, Shadow Mid</span></div>
        </Seccion>
      </div>
    </div>
  );
};
