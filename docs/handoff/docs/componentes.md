# Handoff · Flujo principal (challenge 1)

Archivo de diseño: `Flujo principal.dc.html` (7 frames de 1280 px, modo Tablero y modo Prototipo). Cada componente lleva `data-component="Nombre"` en el HTML con el nombre que va a tener en el código.

## Frames

| # | Vista | Qué cambia respecto al anterior | Hotspots (prototipo) |
|---|---|---|---|
| 01 | Home con faltante | — | "Pagar" en la fila Shenzhen Parts Co. → 02 |
| 02 | Panel · Origen | Panel 480 px sobre el home atenuado; Cuenta Principal MXN seleccionada | Continuar → 03 · Cancelar / × / fondo → 01 |
| 03 | Panel · Revisión | BloqueMonto, consecuencia, TDC Valiu indicativo, concepto y referencia | Pedir precio → 04 · Volver → 02 |
| 04 | Panel · Precio y token | Precio ejecutable 18.092415 fijo por 1:59 (cuenta regresiva real en prototipo; P la pausa), token | Confirmar pago → 06 · Cancelar → 01 · al llegar a 0:00 → 05 |
| 05 | Panel · Precio vencido | Alert error, montos vuelven al indicativo, token deshabilitado | Pedir precio → 04 (reinicia 1:59) · Cancelar → 01 |
| 06 | Confirmación | "Pago enviado" + badge En proceso, detalle; el home detrás ya está actualizado | Volver al inicio → 07 |
| 07 | Home con la posición resuelta | Aviso success, USD "Alcanza", Shenzhen pasa a Realizados con "En proceso", MXN 1,152,861.38 | pestaña Operar clásico → 08 |
| 08 | Pestaña Operar clásico | El formulario Operar del producto actual llevado al DS: tabs Comprar / Vender / Transferir, par, Compras / Pagas, Origen / Destino, Motivo / Referencia, cotización con TDC Valiu, Mis cuentas | pestaña Posición consolidada → 01 · par → 09 · tab Vender → 13 · tab Transferir → 14 |
| 09 | Operar · Selector de par | Dropdown agrupado (tus posiciones / otros pares) | USD/MXN → 10 |
| 10 | Operar · Compra completa | Precio indicativo, lado activo con borde 1.5 px #0086FF, CTA habilitado | Pedir precio → 11 |
| 11 | Operar · Precio fijo y token | Badge "Precio fijo por 1:59" (cuenta regresiva real en prototipo), TDC ejecutable 18.092415, token inline | Confirmar compra → 08 · 0:00 → 12 |
| 12 | Operar · Precio vencido | Alert error, montos al indicativo, TDC en gris | Pedir precio → 11 |
| 13 | Operar · Vender con error | Error inline "Supera tu saldo disponible", CTA deshabilitado | tab Comprar → 08 |
| 14 | Operar · Transferir, selector de destino | Sin par ni TDC; destino con buscador y grupos; "Disponible en origen" | Logística Pacífico → 15 |
| 15 | Operar · Transferencia lista | Resumen sin tipo de cambio + token | Confirmar transferencia → 08 |
| 16 | Operar · Mercado cerrado | Alert warning con próxima apertura, chip "Programar · Futuro", CTA deshabilitado | — |
| 17–20 | Onboarding · pasos 1–4 | Primera pantalla del prototipo. Recorrido contextual sobre el home: posición por divisa → movimientos → tipo de cambio → pestaña Operar clásico. Overlay rgba(21,21,34,.55) con recorte sobre el elemento (outline 2 px #0086FF) y tarjeta de 320 px al lado | Siguiente → paso +1 · Atrás → paso −1 · × / fondo / Empezar → 01 |

El home tiene dos pestañas (tabs del DS: 16/600 sobre #F6FBFF con subrayado 2 px #0086FF): **Posición consolidada** (frames 01–07) y **Operar clásico** (frame 08). El panel lateral sigue siendo el camino desde un pago cargado; la pestaña Operar cubre la operación libre.

## Componentes

**AppShell** (todos los frames): sidebar 240 (`border-right 0.5px #E2E4E9`, ítem 40 px radio 8, activo bg #F6FBFF texto/ícono #0086FF 14/600, inactivo 14/500 #151522), header 48 (Contáctanos = Floating button del DS, campana 22 px), main `padding 24px 32px 32px`, footer 40 (Caption 12 Grey1).

**TarjetaPosicion** · props: `divisa`, `nombre`, `saldo`, `pagosFuturos {cantidad, total}`, `resultado {tipo: 'faltan'|'sobran'|'nada', monto}`, `proyeccion?: number[]` (mar→vie; solo se pasa en la divisa donde los pagos futuros mueven la decisión, hoy USD), `linea?`, `accion? {label, onClick}`. Blanca, radio 8, Shadow Mid, padding 20. Resultado en 24/600; `faltan` en #B40909 con badge Error "Falta"; `sobran` con badge Success "Alcanza". Proyección escalonada (el saldo se mantiene hasta el día del pago y cae ese día), 269×48, línea de cero punteada con rótulo "0" y marcador rojo el día que cruza. Un solo primario por vista: `accion` solo cuando hay faltante.

**FranjaNuevo** · props: `monto`, `origen`, `meta` (hora · banco · referencia), `onComprobante`, `onUsar`. Fondo #F6FBFF, borde #DCDCDE, radio 8. "Usar para pagar" es Secondary Mid.

**FilaMovimiento** · props: `fecha`, `nombre`, `detalle?`, `monto` (string firmado), `estado?` (badge), `onPagar?`, `onClick`. Grid `56px 1fr 160px 120px`, min-height 44, hover #F6FBFF, toda la fila clicable; "Pagar" es un link de texto (14/700 indigo, subrayado al hover), no un botón con borde. Las listas llevan rótulos "Próximos" y "Realizados" (Caption Bold Grey1) alineados a la izquierda arriba de cada una, con el separador "Hoy" entre ambas. Monto 14/600 tabular; `+` en #177B4B, `−` en #151522.

> **Desvío del sistema (D-19).** El DS pide color de signo en montos. En FilaMovimiento y TarjetaPosicion los negativos se quedan en el color de texto: en pagos programados, el rojo alarma sobre salidas que son normales y le quita fuerza al único dato de peligro real, el faltante (`--danger` #B40909). Reversible cambiando un token.

**TarjetaTipoDeCambio** · props: `par`, `compra`, `venta`, `tendencia: number[]`, `hora`, `enVivo`. Borde 1 px #E2E4E9 (sin sombra: no compite con la posición). Seis decimales siempre.

**ModuloCuentas** · props: `cuentas[] {nombre, numero, saldo}`, `onVerTodas`. Mismo contenedor que TarjetaTipoDeCambio (blanco, borde 1 px, radio 8, padding 16); filas de dos líneas (nombre / máscara + saldo) y botón secundario "Ver todas mis cuentas" al pie. Es el mismo componente en Posición consolidada y en la pestaña Operar (reemplaza a las tres TarjetaCuenta del producto actual). La grilla inferior del home y la de Operar usan las mismas tres columnas que la posición (`repeat(3, 1fr)`, izquierda `span 2`), así el módulo queda alineado en ambas pestañas.

**PanelOperar** · props: `titulo`, `sub`, `paso: 'origen'|'revision'|'precio'|'confirmacion'`, `primario`, `secundario?`, `onCerrar`. 480 px, radio 16 a la izquierda, `--shadow-lg`, overlay rgba(21,21,34,.4); footer con secundario + primario (ExtraLarge 16/700). Esc cierra, Tab recorre opciones y botones.

**OpcionOrigen** · props: `cuenta`, `saldo`, `pagas`, `consecuencia {texto, tono: 'ok'|'warn'|'neutro'}`, `seleccionada`. Radio 20 px; seleccionada = borde #3D46CC + bg #F0F1FD. La consecuencia va en badge (Success / Warning / Neutral), nunca solo en color de texto.

**BloqueMonto** · props: `pagas {monto, divisa, enVivo}`, `recibe {monto, divisa, fijo, destinatario}`. Dos bloques separados por divisor; el lado fijo lleva candado + tag "Fijo"; el otro, la marca "se actualiza en vivo".

**PrecioEjecutable** · props: `estado: 'fijo'|'vencido'`, `tdc`, `segundos`, `pagas`, `recibe`, `desde`. Badge Success "Precio fijo por m:ss" (Warning en los últimos 30 s), Error "Vencido". Al vencer, los montos vuelven al indicativo y el precio se pinta en Grey1.

**CampoToken** · props: `valor`, `habilitado`, `onChange`. Seis casillas 48×48, borde 0.5 px #021734, activa 1 px #0086FF; deshabilitada bg #F5F7FA borde #DCDCDE.

**PasoOnboarding** · props: `paso`, `total` (4), `objetivo` (selector del elemento a resaltar), `lado: 'abajo'|'derecha'|'izquierda'`, `titulo`, `texto`, `onSiguiente`, `onAtras`, `onCerrar`. Mide el elemento objetivo en runtime (getBoundingClientRect) y dibuja el recorte con `box-shadow: 0 0 0 2000px` sobre un rect transparente; la tarjeta (320 px, radio 8, `--shadow-lg`) se coloca al lado indicado y se acota al viewport. Paso 1 sin Atrás; paso 4 con CTA "Empezar". Se muestra una vez (flag en el perfil) y queda accesible desde Ayuda.

**FormularioOperar** (pestaña Operar clásico) · props: `tipo: 'comprar'|'vender'|'transferir'`, `par`, `montos {compras, pagas}`, `origen`, `destino`, `motivo`, `referencia`, `tdc`, `mercado: 'abierto'|'cerrado'`, `precio: 'indicativo'|'fijo'|'vencido'`, `error?`. Tarjeta blanca radio 8 + Shadow Mid; tabs internas con el estilo de tabs del DS; un solo primario (Pedir precio / Confirmar). Subcomponentes: **SelectorPar** (dropdown agrupado), **SelectorDestino** (buscador + grupos "Tus cuentas" / "Destinatarios" + "Agregar destinatario"), **CampoMontoDoble** (split Compras / Pagas, borde activo 1.5 px #0086FF, error 1 px #B40909 con mensaje inline), **Cotizacion** (barra gris + CajaTdcValiu; en transferencias solo la barra, radio 8) y **CampoToken** (el mismo del panel, en línea con Cancelar + CTA).

**CajaTdcValiu** · props: `tdc`, `divisa`, `disponible`. Borde 2 px #0086FF, radio 0 8 8 0 pegada a la barra de cotización; "TDC Valiu" 10/700 y valor 18/700.

**AvisoVistaAnterior** (pestaña Operar clásico, arriba del formulario) · Alert Info del DS (borde 1 px #3D46CC, fondo #F6FBFF, ícono info) con el texto "Estás en la vista anterior de Operar. Puedes seguir usándola mientras te acostumbras al nuevo flujo de pago." y el link "Probar el nuevo flujo", que abre el panel de pago. La pestaña va segunda, con el estilo de tab inactiva del DS cuando no está seleccionada.

~~TarjetaCuenta~~ · retirada: en la pestaña Operar la reemplaza ModuloCuentas (un componente de cuentas para todo el home). Las acciones Recibe / Detalles pasan al detalle de cuenta ("Ver todas mis cuentas").

## Tokens usados (colors_and_type.css)

`--valiu-indigo` #3D46CC (primario, borde secundario, seleccionado) · `--valiu-blue` #0086FF (activo, hover de primario, borde TDC Valiu, foco) · `--valiu-blue-bg` #F6FBFF (nav activo, hover de fila, FranjaNuevo) · `--ink-900` #151522 · `--ink-600` #1C293B (labels) · `--ink-500` #5B5B64 (secundario) · `--ink-400` #8492A6 (solo deshabilitado) · `--ink-300` #DCDCDE · `--ink-100` #F5F7FA (fondo) · divisor #E2E4E9 · `--success-strong` #177B4B (montos positivos) · `--danger` #B40909 (faltantes) · tags Success #EBFFF6/#82DAB5, Warning #FCEFCE/#F5CE6C, Error #FFF1F1/#D26B6B, Neutral #F5F7FA/#8492A6 · alerts Success #D5F3E6/#17714B, Error #F0CECE/#770505 · Shadow Mid `0 3px 6px rgba(0,0,0,.08)` · `--shadow-lg` para el panel · radios 4 (botones), 8 (inputs, tarjetas, alerts), 16 (tags, panel), 40 (flotante). Sin mint.

## Pendiente para código

- Íconos: Unicons Line por CDN en el diseño; en Next.js `@iconscout/react-unicons` (ver D-17).
- La cuenta regresiva y el "en vivo" del TDC se implementan en la etapa 4 (banda chica de variación, atajo P para pausar; ya funciona en el modo Prototipo del archivo).
- Datos inventados para la gráfica: reparto diario de los 7 pagos en MXN y la tendencia intradía del TDC. Todo lo demás sale del brief.


## Fecha valor (03B, 04B, 06B, 07B)

Valiu está por liberar la elección de cuándo sale el dinero: el precio se cierra hoy y el dinero sale hoy o en los próximos tres días hábiles. En el tablero, la fila "Flujo principal · Fecha valor" pone cada variante debajo del frame que reemplaza, con la hoja de estados a la izquierda.

| # | Vista | Cambia respecto al base | Hotspots (prototipo) |
|---|---|---|---|
| 03 | Revisión | Suma FechaLiquidacion con Hoy elegido | mié 7 / jue 8 / vie 9 → 03B con esa fecha |
| 03B | Revisión con fecha | jue 8 elegido; consecuencia "Cierras hoy el precio…"; "Hoy tienes el saldo…" | Hoy → 03 · Pedir precio → 04B · Volver → 02 |
| 04B | Precio y token con fecha | Resumen con "El dinero sale el jue 8" | Confirmar pago → 06B · Cancelar → 01 · 0:00 → 05 (Pedir precio vuelve a 04B) |
| 06B | Confirmación · Pago pactado | Badge Pactada, texto del pacto, aviso de fondeo | Volver al inicio / × → 07B |
| 07B | Home con el pago pactado | Aviso info; USD "Alcanza"; MXN con "Pactadas por liquidar (1)"; Shenzhen en Próximos con badge Pactada | — |

Reglas: solo con tipo de cambio (oculto en transferencias en la misma divisa); fechas reales, nunca T+n; por defecto Hoy; "vence" en el día de vencimiento si cae en la ventana; se elige antes de pedir precio; si no es hoy, la operación queda Pactada hasta que sale el dinero.

**FechaLiquidacion** · props: opciones (hoy + 3 días hábiles, cada una con fecha, etiqueta y vence), valor, onChange, visible (false sin tipo de cambio). Label 700 12/16 #1C293B "¿Cuándo sale el dinero?". Segmented del DS a todo el ancho: contenedor #F5F7FA, radio 999, padding 4, gap 4, Shadow Mid; opción radio 999, padding 6 12, 14/20, sin wrap. Elegida: fondo #F6FBFF, borde 1 px #3D46CC, texto 600 #3D46CC (D-28). No elegida: transparente, 400 #5B5B64. Hover: fondo #FFF, texto #151522. Foco: outline 2 px #0086FF, offset 2. "· vence" en 400. Ayuda 400 12/16 #5B5B64: "El precio queda cerrado hoy, elijas el día que elijas." Accesibilidad: role radiogroup, opciones role radio, ← → mueven la selección.

**Badge Pactada** · fondo #EDF3FF, punto #0086FF (D-29). En FilaMovimiento reemplaza al link "Pagar" y la fila suma el detalle "27,138.62 MXN a 18.092415".

**TarjetaPosicion** · prop nueva pactadas (cantidad, total): fila "Pactadas por liquidar (n)" entre Saldo y Pagos futuros; el resultado las descuenta. Estado sin saldo: resultado "Faltan", línea "Fondea 27,138.62 MXN antes del jue 8" y link "Ver datos para depositar".

**OpcionOrigen** · estado hoyNoAlcanza: se puede elegir; badge Warning "Hoy no alcanza" y ayuda "Puedes cerrar el precio y fondear antes del día que elijas."

**AvisoResultado** · variante info (borde 1 px #3D46CC, fondo #F6FBFF, uil-calendar-alt) para el pago pactado; la success queda para el pago enviado.

**Confirmación pactada (06B)** · uil-calendar-alt 48 #3D46CC, "Pago pactado" 600 20/24, badge Pactada, texto 400 14/20 centrado y alert info con el monto a tener en la cuenta el día elegido.
