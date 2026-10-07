'use client';
import { useState, type FC, type ReactNode } from 'react';
import Link from 'next/link';
import { centavos } from '@/lib/dinero';
import * as fmt from '@/lib/format';
import { cotizar } from '@/lib/fx';

/** 1,500.00 USD pagados desde la Cuenta EUR, con el lado vender de EUR/USD (la muestra sale de fx.ts, no de un número escrito a mano). */
const pagasEur = cotizar({ origen: 'EUR', destino: 'USD', monto: centavos(1500), ladoFijo: 'recibe' })!.pagas;
import { Boton } from '@/components/ui/Boton';
import { Badge } from '@/components/ui/Badge';
import { Alerta } from '@/components/ui/Alerta';
import { Pestanas } from '@/components/ui/Pestanas';
import { CampoTexto, CampoSelector, OpcionLista } from '@/components/ui/Campo';
import { Icono, ICONOS, type NombreIcono } from '@/components/ui/Icono';
import { ChipDivisa } from '@/components/ui/ChipDivisa';
import { Logo } from '@/components/ui/Logo';
import { TarjetaPosicion } from '@/components/TarjetaPosicion';
import { GrupoPago, OpcionOrigen } from '@/components/OpcionOrigen';
import { BloqueMonto } from '@/components/BloqueMonto';
import { ResumenPago } from '@/components/ResumenPago';
import { CampoToken } from '@/components/CampoToken';
import { CajaTdcValiu } from '@/components/CajaTdcValiu';
import { FranjaNuevo } from '@/components/FranjaNuevo';
import { FilaMovimiento } from '@/components/FilaMovimiento';
import { TarjetaTipoDeCambio } from '@/components/TarjetaTipoDeCambio';
import { ModuloCuentas } from '@/components/ModuloCuentas';
import { HojaEstados, Caso } from '@/components/HojaEstados';

const Seccion: FC<{ id: string; titulo: string; nota?: string; children: ReactNode }> = ({ id, titulo, nota, children }) => (
  <section id={id} aria-labelledby={`${id}-t`} className="flex flex-col gap-4">
    <div className="flex flex-col gap-1 border-b border-app-divider pb-2">
      <h2 id={`${id}-t`} className="text-h2 font-semibold">{titulo}</h2>
      {nota ? <span className="text-caption text-app-ink-2">{nota}</span> : null}
    </div>
    {children}
  </section>
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
  ['--app-ink', 'V Black', 'texto principal, Link Button'],
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
  ['text-h2 font-semibold', 'H2 20/24 · 600', 'título de la ventana de pago y del panel'],
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

/** Guía viva: tokens (src/styles/tokens.css) y componentes del flujo en sus estados. */
export const Sistema: FC = () => {
  const [token, setToken] = useState('47');
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a');
  const [texto, setTexto] = useState('');
  const [selAbierto, setSelAbierto] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [origen, setOrigen] = useState('mxn');
  const [pago, setPago] = useState<string | null>('t-p1');

  return (
    <div className="flex min-h-dvh flex-col bg-app-canvas text-app-ink">
      <header className="flex flex-wrap items-center gap-6 border-b border-app-ink-disabled bg-app-surface px-6 py-3.5">
        <Logo />
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-bold">Sistema · tokens y componentes</span>
          <span className="text-caption text-app-ink-2">Todo sale de src/styles/tokens.css (copia del DS oficial + alias --app-*) y de los mismos componentes que usa el prototipo.</span>
        </div>
        <nav className="ml-auto flex gap-4">
          <Link href="/" className="text-caption font-semibold text-app-ink underline hover:text-app-primary">Prototipo</Link>
          <Link href="/tablero/alta" className="text-caption font-semibold text-app-ink underline hover:text-app-primary">Tablero</Link>
        </nav>
      </header>

      <div className="flex flex-col gap-12 p-8">
        <Seccion id="color" titulo="Color" nota="Dos tintas que no se intercambian: indigo = acción · core light = foco, activo y ON (D-16). Sin mint todavía.">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{COLORES.map(([t, n, u]) => <Muestra key={t} token={t} nombre={n} uso={u} />)}</div>
          <div className="flex flex-wrap gap-3">
            <Badge tono="success">Success · Alcanza, En vivo, Confirma en 1:59</Badge>
            <Badge tono="warning">Warning · En proceso, Hoy no alcanza</Badge>
            <Badge tono="error">Error · Falta</Badge>
            <Badge tono="neutral">Neutral · Fijo, Vencido, Sin tipo de cambio</Badge>
            <Badge tono="pactada">Pactada (D-29)</Badge>
            <Badge tono="info">Info · Precio indicativo</Badge>
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

        <Seccion id="iconos" titulo="Íconos" nota="Unicons Line (@iconscout/react-unicons, D-17): 14 info · 16 inputs · 18 sidebar · 20 módulos · 22 campana · 24 acciones · 48 confirmación.">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(ICONOS) as NombreIcono[]).map((n) => (
              <div key={n} className="flex w-28 flex-col items-center gap-1.5 rounded-sm bg-app-surface p-3 shadow-mid"><Icono nombre={n} tamano="2xl" /><span className="text-caption text-app-ink-2">{n}</span></div>
            ))}
          </div>
        </Seccion>

        <Seccion id="botones" titulo="Botones y acciones de texto" nota="Primary (hover #0086FF) · Secondary (hover #F6FBFF) · deshabilitado #F5F7FA / #DCDCDE. Mid 32 · Large 36 · ExtraLarge 40. Link Button del DS: tinta, 600, subrayado; “Pagar” de fila: índigo sin subrayado.">
          <div className="flex flex-wrap items-center gap-4">
            <Boton tamano="mid">Primary Mid</Boton><Boton>Primary Large</Boton><Boton tamano="xl">Primary ExtraLarge</Boton><Boton disabled>Deshabilitado</Boton>
            <Boton variante="secondary" tamano="mid">Secondary Mid</Boton><Boton variante="secondary">Secondary Large</Boton><Boton variante="secondary" disabled>Deshabilitado</Boton>
            <Boton variante="link">Link Button</Boton><Boton variante="link-caption">Link Button 12</Boton><Boton variante="fila">Pagar</Boton>
          </div>
        </Seccion>

        <Seccion id="alertas" titulo="Alerts" nota="Padding 16, gap 16, borde 1 px del color fuerte, radio 8. Compactas para AvisoResultado. El precio vencido es informativo, no un error.">
          <div className="grid grid-cols-2 gap-4">
            <Alerta tono="success" compacta titulo="Pago en proceso. Ya te alcanza para los pagos en USD de la semana." onCerrar={() => {}} />
            <Alerta tono="info" compacta icono="calendar-alt" titulo="Pactaste el pago a Shenzhen Parts Co. El dinero sale el jue 8." onCerrar={() => {}} />
            <Alerta tono="info" titulo="Se acabó el tiempo para confirmar.">Pide precio de nuevo. Los montos volvieron al indicativo.</Alerta>
            <Alerta tono="warning" titulo="Mercado cerrado.">No se puede pedir precio hasta que abra. Puedes dejar el formulario listo.</Alerta>
            <Alerta tono="error" titulo="El código no coincide.">Revisa tu token y vuelve a intentarlo.</Alerta>
            <Alerta tono="info">Estás en la vista anterior de Operar. Puedes seguir usándola mientras te acostumbras al nuevo flujo de pago.</Alerta>
          </div>
        </Seccion>

        <Seccion id="controles" titulo="Inputs, selectores, tabs y token" nota="Input min-height 48, padding 12, radio 8, borde 0.5 px #021734; activo 1 px #0086FF; error 1 px #B40909 con mensaje 12/500. Token: un solo input con seis casillas visuales.">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <CampoTexto etiqueta="Referencia" opcional valor={texto} onCambiar={setTexto} placeholder="Ej. Factura 0457" />
            <CampoTexto etiqueta="Con error" valor="5,000.00" onCambiar={() => {}} monto sufijo="USD" error="Supera tu saldo disponible: 2,000.00 USD." />
            <CampoTexto etiqueta="Deshabilitado" valor="" onCambiar={() => {}} placeholder="Placeholder" disabled />
            <CampoSelector etiqueta="Motivo de pago" valor={sel} placeholder="Elige un motivo" abierto={selAbierto} onAbrir={setSelAbierto}>
              {['Pago a proveedores', 'Compra de divisas', 'Venta de divisas'].map((m) => <OpcionLista key={m} seleccionada={m === sel} onElegir={() => { setSel(m); setSelAbierto(false); }}><span className="text-body">{m}</span></OpcionLista>)}
            </CampoSelector>
            <div className="col-span-2 flex flex-col gap-1.5">
              <span className="text-caption font-bold text-app-ink-label">Tabs</span>
              <div className="rounded-sm bg-app-surface"><Pestanas etiqueta="Ejemplo" llenas pestanas={[{ id: 'a', label: 'Comprar' }, { id: 'b', label: 'Vender' }, { id: 'c', label: 'Transferir' }]} activa={tab} onCambiar={setTab} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <Caso titulo="CampoToken · habilitado"><CampoToken valor={token} habilitado onChange={setToken} /></Caso>
            <Caso titulo="CampoToken · token incorrecto"><CampoToken valor="" habilitado onChange={() => {}} error="El código no coincide. Revisa tu token y vuelve a intentarlo." /></Caso>
            <Caso titulo="CampoToken · deshabilitado (confirmando)"><CampoToken valor="123456" habilitado={false} onChange={() => {}} /></Caso>
          </div>
        </Seccion>

        <Seccion id="estados" titulo="Hoja de estados" nota="FechaLiquidacion (segmented del DS, D-28; role=radiogroup, ← → mueven la selección, oculto sin tipo de cambio), OpcionOrigen cuando hoy no alcanza y TarjetaPosicion con una pactada sin saldo.">
          <HojaEstados />
        </Seccion>

        <Seccion id="posicion" titulo="TarjetaPosicion" nota="Protagonista: blanca, radio 8, Shadow Mid. Resultado 24/600; faltan en #B40909 con badge Error; línea de 0 siempre visible y “faltante” en el día que cruza; un solo primario por vista.">
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
            <TarjetaPosicion divisa="USD" nombre="Dólares" saldo={centavos(2000)} pagosFuturos={{ cantidad: 3, total: centavos(3000) }} resultado={{ tipo: 'faltan', monto: centavos(1000) }} proyeccion={{ serie: [2000, 2000, 500, -1000].map(centavos), etiquetas: ['mar 6', 'mié 7', 'jue 8', 'vie 9'], etiquetaCruce: 'faltante' }} linea="≈ 18,091.18 MXN a precio de compra" accion={{ label: 'Comprar 1,000 USD', onClick: () => {} }} />
            <TarjetaPosicion divisa="MXN" nombre="Pesos" saldo={centavos(1_180_000)} pactadasLiquidar={{ cantidad: 1, total: centavos(27_138.62) }} pagosFuturos={{ cantidad: 7, total: centavos(80_350.5) }} resultado={{ tipo: 'sobran', monto: centavos(1_072_510.88) }} />
            <TarjetaPosicion divisa="USD" nombre="Dólares" saldo={centavos(2000)} pactadasRecibir={{ cantidad: 1, total: centavos(1000) }} pagosFuturos={{ cantidad: 3, total: centavos(3000) }} resultado={{ tipo: 'sobran', monto: 0 }} proyeccion={{ serie: [2000, 2000, 500, 0].map(centavos), etiquetas: ['mar 6', 'mié 7', 'jue 8', 'vie 9'] }} />
            <TarjetaPosicion divisa="EUR" nombre="Euros" saldo={centavos(50_000)} resultado={{ tipo: 'nada', monto: 0 }} />
            <TarjetaPosicion divisa="EUR" nombre="Euros" saldo={0} pagosFuturos={{ cantidad: 1, total: centavos(4200) }} resultado={{ tipo: 'faltan', monto: centavos(4200) }} proyeccion={{ serie: [0, 0, 0, -4200].map(centavos), etiquetas: ['mar 6', 'mié 7', 'jue 8', 'vie 9'], etiquetaCruce: 'faltante' }} linea="≈ 89,250.00 MXN a precio de compra" accion={{ label: 'Comprar 4,200 EUR', onClick: () => {} }} />
            <TarjetaPosicion divisa="MXN" nombre="Pesos" saldo={centavos(420_000)} resultado={{ tipo: 'nada', monto: 0 }} />
            <TarjetaPosicion divisa="EUR" nombre="Euros" saldo={0} resultado={{ tipo: 'nada', monto: 0 }} linea="Hotel Gran Vía Madrid: pactado en pesos, sale el vie 9" />
          </div>
        </Seccion>

        <Seccion id="origen" titulo="OpcionOrigen" nota="Radio 20 px; seleccionada = borde indigo + bg #F0F1FD. El chip sale del cálculo de posición: cubre el faltante, te faltarían X el día que cruza, o te quedan X.">
          <div role="radiogroup" aria-label="Ejemplo" className="grid grid-cols-2 gap-2.5">
            <OpcionOrigen cuenta="Cuenta Principal MXN" saldo="Saldo 1,180,000.00 MXN" pagas="Pagas ≈ 27,136.77 MXN" consecuencia={{ texto: 'Cubre el faltante en USD', tono: 'success' }} seleccionada={origen === 'mxn'} onElegir={() => setOrigen('mxn')} />
            <OpcionOrigen cuenta="Cuenta USD" saldo="Saldo 2,000.00 USD" pagas="Pagas 1,500.00 USD" consecuencia={{ texto: 'Te faltarían 1,000.00 USD para tus pagos del vie 9', tono: 'warning' }} seleccionada={origen === 'usd'} onElegir={() => setOrigen('usd')} />
            <OpcionOrigen cuenta="Cuenta EUR" saldo="Saldo 50,000.00 EUR" pagas={`Pagas ≈ ${fmt.monto(pagasEur, 'EUR')}`} consecuencia={{ texto: 'Cubre el faltante en USD', tono: 'success' }} seleccionada={origen === 'eur'} onElegir={() => setOrigen('eur')} />
            <OpcionOrigen cuenta="Cuenta EUR" saldo="Saldo 50,000.00 EUR" pagas={`Pagas ≈ ${fmt.monto(pagasEur, 'EUR')}`} consecuencia={null} seleccionada={false} onElegir={() => {}} />
            <OpcionOrigen cuenta="Cuenta Principal MXN" saldo="Saldo 420,000.00 MXN · incluye el cobro de hoy" pagas="Pagas ≈ 89,250.00 MXN" consecuencia={{ texto: 'Cubre el faltante en EUR', tono: 'success' }} seleccionada onElegir={() => {}} />
            <OpcionOrigen cuenta="Cuenta EUR" saldo="Saldo 0.00 EUR" pagas="Pagas 4,200.00 EUR" consecuencia={{ texto: 'Sin saldo', tono: 'neutral' }} seleccionada={false} deshabilitada onElegir={() => {}} />
          </div>
        </Seccion>

        <Seccion id="pago" titulo="OpcionPago" nota="Paso “¿Qué pagas con este cobro?” (D-30): misma anatomía que OpcionOrigen; nombre y monto del pago, línea con vencimiento, referencia y cuánto del cobro usa, consecuencia en badge. Una sola selección; el faltante viene seleccionado.">
          <div className="max-w-(--app-modal-w-sm)">
            <GrupoPago
              valor={pago}
              onCambiar={setPago}
              opciones={[
                { id: 't-p2', destinatario: 'Mayorista Caribe', monto: '2,500.00 USD', linea: `Vence jue 8 · Bloqueo nov-26 · ${pago === 't-p2' ? 'usa' : 'usaría'} ≈ 45,227.96 MXN`, consecuencia: null },
                { id: 't-p1', destinatario: 'Hotel Gran Vía Madrid', monto: '4,200.00 EUR', linea: `Vence vie 9 · Reserva 88213 · ${pago === 't-p1' ? 'usa' : 'usaría'} ≈ 89,250.00 MXN`, consecuencia: { texto: 'Cubre el faltante en EUR', tono: 'success' } },
              ]}
            />
          </div>
        </Seccion>

        <Seccion id="ventana" titulo="Bloques de la ventana de pago" nota="Origen, Revisión, Precio y Confirmación van en dos columnas (C-47, C-50): a la izquierda BloqueMonto (con factura, editable sin factura, de solo lectura con el precio ejecutable en vivo o un solo monto en la misma divisa); a la derecha ResumenPago, con el tipo de cambio siempre arriba (indicativo, ejecutable con la cuenta regresiva para confirmar, en los últimos 30 s, vencido o sin tipo de cambio), la comisión y las filas de lo que significa la decisión. CajaTdcValiu queda para Operar clásico.">
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
            <Caso titulo="BloqueMonto · con factura"><BloqueMonto pagas={{ monto: centavos(27_136.77), divisa: 'MXN' }} recibe={{ monto: centavos(1500), divisa: 'USD', destinatario: 'Shenzhen Parts Co. recibe' }} ladoFijo="recibe" conTdc /></Caso>
            <Caso titulo="BloqueMonto · sin factura (editable)"><BloqueMonto pagas={{ monto: centavos(18_091.18), divisa: 'MXN' }} recibe={{ monto: centavos(1000), divisa: 'USD', destinatario: 'Tu Cuenta USD recibe' }} ladoFijo="recibe" conTdc editable onCambiar={() => {}} /></Caso>
            <Caso titulo="BloqueMonto · precio ejecutable (solo lectura, exacto en cada instante)"><BloqueMonto pagas={{ monto: centavos(27_138.62), divisa: 'MXN' }} recibe={{ monto: centavos(1500), divisa: 'USD', destinatario: 'Shenzhen Parts Co. recibe' }} ladoFijo="recibe" conTdc exacto /></Caso>
            <Caso titulo="BloqueMonto · transferencia en la misma divisa"><BloqueMonto pagas={{ monto: centavos(500), divisa: 'USD' }} recibe={{ monto: centavos(500), divisa: 'USD', destinatario: 'Asia Packaging recibe' }} ladoFijo="pagas" conTdc={false} unico editable onCambiar={() => {}} /></Caso>
            <Caso titulo="ResumenPago · Origen"><ResumenPago vista={{ tdc: { valor: 18_091_183, unidad: 'MXN por USD', estado: 'indicativo', segundos: 0, porVencer: false, pausado: false }, sinPrecio: null, filas: [{ k: 'Comisión', v: '0%' }, { k: 'Shenzhen Parts Co. recibe', v: '1,500.00 USD' }, { k: 'Vence', v: 'jueves 8 de octubre' }], aviso: null, nota: null }} /></Caso>
            <Caso titulo="ResumenPago · Revisión con fecha valor"><ResumenPago vista={{ tdc: { valor: 18_091_183, unidad: 'MXN por USD', estado: 'indicativo', segundos: 0, porVencer: false, pausado: false }, sinPrecio: null, filas: [{ k: 'Comisión', v: '0%' }, { k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'vie 9' }, { k: 'El vie 9 tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }], aviso: 'El dinero sale después del vencimiento (jue 8).', nota: 'Ten tu token a mano: tienes 2 minutos para confirmar.' }} /></Caso>
            <Caso titulo="ResumenPago · precio ejecutable en vivo"><ResumenPago vista={{ tdc: { valor: 18_092_415, unidad: 'MXN por USD', estado: 'ejecutable', segundos: 120, porVencer: false, pausado: false }, linea: 'Se mueve con el mercado hasta que confirmas.', sinPrecio: null, filas: [{ k: 'Comisión', v: '0%' }, { k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '1,152,861.38 MXN' }], aviso: null, nota: null }} /></Caso>
            <Caso titulo="ResumenPago · últimos 30 s para confirmar"><ResumenPago vista={{ tdc: { valor: 18_092_415, unidad: 'MXN por USD', estado: 'ejecutable', segundos: 28, porVencer: true, pausado: false }, linea: 'Se mueve con el mercado hasta que confirmas.', sinPrecio: null, filas: [{ k: 'Comisión', v: '0%' }, { k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '1,152,861.38 MXN' }], aviso: null, nota: null }} /></Caso>
            <Caso titulo="ResumenPago · vencido (badge sobre el precio que venció)"><ResumenPago vista={{ tdc: { valor: 18_092_415, unidad: 'MXN por USD', estado: 'vencido', segundos: 0, porVencer: false, pausado: false }, sinPrecio: null, filas: [{ k: 'Comisión', v: '0%' }, { k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '≈ 1,152,863.23 MXN' }], aviso: null, nota: null }} /></Caso>
            <Caso titulo="ResumenPago · transferencia en la misma divisa"><ResumenPago vista={{ tdc: null, sinPrecio: 'Sin tipo de cambio', filas: [{ k: 'Comisión', v: '0%' }, { k: 'Shenzhen Parts Co. recibe', v: '1,500.00 USD' }, { k: 'Sale de', v: 'Cuenta USD' }, { k: 'Tu cuenta queda en', v: '500.00 USD' }], aviso: null, nota: null }} />
            <Caso titulo="ResumenPago · comisión distinta de 0 (ejemplo)"><ResumenPago vista={{ tdc: { valor: 18_092_415, unidad: 'MXN por USD', estado: 'ejecutable', segundos: 95, porVencer: false, pausado: false }, linea: 'Se mueve con el mercado hasta que confirmas.', sinPrecio: null, filas: [{ k: 'Comisión', v: `${fmt.tasa(50)} · ${fmt.monto(centavos(135.69), 'MXN')}` }, { k: 'Sale de', v: 'Cuenta Principal MXN' }, { k: 'Sale el dinero', v: 'Hoy' }, { k: 'Tu cuenta queda en', v: '1,152,725.69 MXN' }], aviso: null, nota: null }} /></Caso></Caso>
            <Caso titulo="CajaTdcValiu · Operar clásico"><div className="flex flex-wrap gap-3"><CajaTdcValiu tdc={18_091_183} unidad="MXN por USD" tipo="Indicativo" /><CajaTdcValiu tdc={18_092_415} unidad="MXN por USD" tipo="Ejecutable" /><CajaTdcValiu tdc={18_091_183} unidad="MXN por USD" tipo="Último cierre" apagada /></div></Caso>
          </div>
        </Seccion>

        <Seccion id="home" titulo="Módulos del inicio" nota="FranjaNuevo, FilaMovimiento (badge solo en estados no finales, D-23), TarjetaTipoDeCambio con el par de la decisión primero y los demás pares de las posiciones compactos (D-33), y ModuloCuentas.">
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
            <div className="col-span-2 flex flex-col gap-4">
              <FranjaNuevo monto={centavos(180_000)} divisa="MXN" origen="Comercial Norte" meta="Hoy 10:42 · BBVA México · Ref. factura 2231" onUsar={() => {}} />
              <div className="flex flex-col rounded-sm bg-app-surface px-6 py-2">
                <FilaMovimiento fecha="jue 8" nombre="Shenzhen Parts Co." monto={centavos(-1500)} divisa="USD" onPagar={() => {}} />
                <FilaMovimiento fecha="jue 8" nombre="Shenzhen Parts Co." detalle="27,138.62 MXN a 18.092415" monto={centavos(-1500)} divisa="USD" estado={{ texto: 'Pactada', tono: 'pactada' }} />
                <FilaMovimiento fecha="Hoy" nombre="Shenzhen Parts Co." detalle="1,500.00 USD a 18.092415" monto={centavos(-27_138.62)} divisa="MXN" estado={{ texto: 'En proceso', tono: 'warning' }} />
                <FilaMovimiento fecha="Hoy" nombre="Comercial Norte" monto={centavos(180_000)} divisa="MXN" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TarjetaTipoDeCambio par="USD/MXN" compra={18_091_183} venta={18_032_135} tendencia={[18.062, 18.071, 18.068, 18.084, 18.079, 18.095, 18.088, 18.091]} hora="10:42" enVivo otros={[{ par: 'EUR/MXN', base: 'EUR', compra: 21_250_000, venta: 21_100_000 }]} />
              <TarjetaTipoDeCambio par="EUR/MXN" compra={21_250_000} venta={21_100_000} tendencia={[21.231, 21.238, 21.235, 21.246, 21.242, 21.255, 21.249, 21.25]} hora="10:42" enVivo otros={[{ par: 'USD/MXN', base: 'USD', compra: 18_091_183, venta: 18_032_135 }]} />
              <ModuloCuentas cuentas={[{ id: 'mxn', nombre: 'Cuenta Principal MXN', mascara: '1025', saldo: centavos(1_180_000), divisa: 'MXN' }, { id: 'usd', nombre: 'Cuenta USD', mascara: '2024', saldo: centavos(2000), divisa: 'USD' }]} />
            </div>
          </div>
          <div className="flex items-center gap-3"><ChipDivisa divisa="USD" /><ChipDivisa divisa="MXN" chico /><span className="text-caption text-app-ink-2">ChipDivisa: bg Grey4, radio 4, Shadow Mid</span></div>
        </Seccion>
      </div>
    </div>
  );
};
