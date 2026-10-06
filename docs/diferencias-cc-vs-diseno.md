# Diferencias entre el código y el archivo de diseño · Flujo secundario (turismo)

Regla de precedencia del handoff: **el código manda**. Donde `prototipo/Flujo secundario.dc.html` o `docs/componentes.md` difieren de lo que ya existía en el codebase, se conservó el código y la diferencia quedó anotada acá para sincronizar el archivo de diseño después. Lo nuevo del diseño (escenario turismo, paso "¿Qué pagas con este cobro?", OpcionOrigen deshabilitada, `pares[]` en la tarjeta de tipo de cambio, TDC en vivo, casos nuevos de TarjetaPosicion, pantalla inicial) se construyó extendiendo los componentes existentes.

Frames: S01–S08 del archivo de diseño (capturas en `docs/design/frames/S0*.png`); S07H y S08H son la variante con Hoy en `/tablero/alta`. "Inicio" es la pantalla de arquetipos (sin frame de diseño).

## Diferencias

| Componente | Propiedad | Valor en código | Valor en diseño | Frame |
|---|---|---|---|---|
| PanelOperar | Título y textos con el destinatario | "Pagar a Hotel Gran Vía Madrid", "se envía el pago a Hotel…", "Pactaste el pago a Hotel…" (`tituloDe`: "Pagar a {destinatario}") | "Pagar al Hotel Gran Vía Madrid", "al Hotel" | S03–S08 |
| PrecioEjecutable | Precio ejecutable y montos derivados | 21.251447 = indicativo 21.250000 × 1.0000681 (`ejecutable()`, mismo factor del flujo principal) → Pagas 89,256.08 MXN, pesos después 330,743.92 | 21.251450 (inventado) → 89,256.09 y 330,743.91 | S05, S07, S08 |
| PrecioEjecutable | Unidad del precio | "MXN" | "MXN por EUR" | S05, S06 |
| PrecioEjecutable | Cuenta regresiva inicial | 2:00 (C-08) | 1:59 | S05 |
| PrecioEjecutable | Botón secundario en precio y vencido | "Volver" (regresa a la revisión y descarta el precio, C-03) | "Cancelar" | S05, S06 |
| PrecioEjecutable / Alerta | Precio vencido | Alert info, badge neutral "Vencido" sobre el precio que venció, precio tachado, sin casillas de token (C-04) | Alert error (#770505 / #F0CECE), badge error, precio en Grey1, casillas deshabilitadas | S06 |
| CampoToken | Anatomía | Un solo input con seis casillas visuales, admite pegar (C-09) | Seis casillas con caret | S05 |
| CajaTdcValiu | Rótulo y borde en el panel | "TDC Valiu" · "Precio indicativo", sin borde (C-07) | "TDC Valiu · EUR/MXN", borde 2 px #0086FF | S04 |
| Revisión | Campo de concepto | "Motivo de pago", lista cerrada precargada (C-05) | "Concepto" | S04 |
| Confirmación (Hoy) | Título y fila TDC | "Pago en proceso" (C-02) · fila "TDC" | "Pago enviado" · fila "TDC EUR/MXN" | S07H |
| Confirmación (pactada) | Botón secundario | "Descargar confirmación" (C-10) | "Descargar comprobante" | S07 |
| AvisoResultado (Hoy) | Texto | "Pago en proceso. Ya te alcanza para los pagos en EUR de la semana." (C-12) | "Pago enviado. Ya no tienes pagos pendientes en euros." | S08H |
| OpcionOrigen · Cuenta USD | Consecuencia | "Te faltarían 1,057.00 USD el jue 8" (día con fecha, como el flujo principal) | "Te faltarían 1,057.00 USD el jueves" | S03 |
| OpcionPago | Orden de las opciones | Por fecha de vencimiento, como Próximos (Mayorista Caribe jue 8, Hotel vie 9); el faltante va seleccionado aunque no sea el primero | El faltante primero (Hotel, Mayorista) | S02 |
| OpcionPago | "Pagar a otro destinatario" | Link Button del DS: tinta #151522, 600, subrayado (C-13), deshabilitado con `aria-disabled` y tooltip "Todavía no está en el prototipo." (sin destino) | 700 14 #3D46CC subrayado, habilitado sin destino | S02 |
| TarjetaTipoDeCambio | Pares secundarios | Una línea compacta por par: "USD/MXN · comprar USD 18.091183 · vender USD 18.032135" (forma que ya tenía el código con `otros[]`) | Bloque con dos filas "Para comprar USD" / "Para vender USD", separado por divisor con padding-top 12 | S01 |
| TarjetaTipoDeCambio | Hora de la tendencia | "10:42" (`HORA_TDC`, compartida por los dos arquetipos) | "09:40" | S01 |
| TarjetaTipoDeCambio | Badge | "En vivo" · "Congelado" (`?congelar=1`) · "En pausa" (tecla P) | "En vivo" siempre | S01 |
| TDC en vivo | Banda, ritmo y pares | ±0.002 % cada 3–5 s sobre todos los pares (`useTdcEnVivo`, `OSCILACION_*`); sigue moviéndose con un precio fijo y después de confirmar (el precio fijo no cambia: tiene su propio valor) | ±0.0012 cada 2 s solo en EUR/MXN; se congela al pedir precio y después de confirmar | S01, S04, S06 |
| TarjetaPosicion · EUR | Eje de la proyección | "vie 9 · faltante" en `--danger` (C-19) | "vie 9" en #B40909 600, sin "faltante" | S01 |
| TarjetaPosicion · USD | Eje de la proyección | "jue 8" en 400 | "jue 8" en 600 (día del pago) | S01 |
| TarjetaPosicion · MXN y EUR sin pendientes | Fila "Pagos futuros" | Oculta cuando no hay pagos (cada fila aparece solo con movimientos) | "Pagos futuros 0.00" | S01, S08 |
| TarjetaPosicion · EUR | "Comprar 4,200 EUR" | Funciona: abre el panel "Pasar a tu Cuenta EUR" con pesos (compra a cuenta propia del flujo principal) | Pendiente, sin acción | S01 |
| FilaMovimiento · Mayorista Caribe | "Pagar" | Funciona: panel en Origen con la Cuenta USD elegible, sin tipo de cambio | Pendiente, sin acción | S01 |
| FilaMovimiento | Fila y título de Movimientos | Cada fila abre su detalle en el panel; "+" junto al título agenda un pago (features del código) | Sin detalle ni "+" | S01, S08 |
| Home · encabezado | Empresa y hora de entrada | "Viajes Altavista S.A. de C.V. · martes 6 de octubre"; reloj del escenario 10:42 (`HOY` compartido) | "Viajes Altavista · martes 6 de octubre"; entra a las 09:40 | S01 |
| FranjaNuevo · importadora | "Usar para pagar" | Paso Destino con la cuenta en pesos preseleccionada (como quedó en el código); en turismo sí abre el paso "¿Qué pagas con este cobro?" (`entradaCobro` del arquetipo) | Paso "¿Qué pagas con este cobro?" en los dos | S02 (importadora) |
| Pantalla inicial | Logo | 22 px (`--app-logo-h`, el mismo del sidebar) | 28 px | Inicio |
| Pantalla inicial | Persistencia del arquetipo | Ninguna: la ruta (`/importadora`, `/turismo`) lleva el arquetipo y nada se guarda (C-23, sin localStorage); el recorrido se muestra una vez por arquetipo dentro de la sesión | Cookie o localStorage | Inicio |

## Datos del escenario que se completaron

| Dato | Valor en código | Origen |
|---|---|---|
| EUR/USD venta | 1.085, igual a la compra | El pedido da un solo cross (1.085); la venta no se usa en el flujo. |
| CLABE de la Cuenta Principal MXN | `012180000044100017` | Inventada, para "Ver datos para depositar". |
| Destinatario Familia Ortega | BBVA México **** 7702 | Inventado, para el detalle del cobro. |
| Realizados Aerolínea Centro y Familia Ríos | Hora, banco, cuenta y referencia | Inventados, para el detalle del movimiento. |
| Contexto de la tarjeta de arquetipo | Tres líneas calculadas desde los datos (`contexto` en `IMPORTADORA` y `TURISMO`) | Copy del README del handoff con los montos formateados desde los datos. |

## Ambigüedades resueltas con el menor cambio al código

- **Precio ejecutable**: el código ya calcula el ejecutable con un factor único (`ejecutable()`); el 21.251450 del diseño era un valor inventado, así que no se agregó un ejecutable por escenario.
- **Cuenta sin saldo**: se deshabilita solo cuando la cuenta está en la divisa del pago y su saldo es 0 (transferencia sin fondos, D-31). Con saldo insuficiente pero mayor a cero sigue el comportamiento previo del código ("Hoy no alcanza" cuando hay tipo de cambio).
- **"Incluye el cobro de hoy"** aparece en la cuenta donde entró el cobro solo al entrar desde el cobro (`panel.cobroId`); desde "Pagar" de la fila no, para no cambiar las pantallas de la importadora.
- **Tecla P**: pausa en cualquier parte salvo en campos de texto libre; en el token y los montos (numéricos) la P no es un carácter válido, así que también pausa.
- **Escenarios por URL** (`?escenario=`) funcionan también en `/turismo`: resuelta y pactada pagan el Hotel desde la cuenta en pesos; sin-saldo deja la cuenta en pesos en 20,000.00 sin el cobro.
- **Operar clásico** en `/turismo` usa las cuentas y el tipo de cambio de Viajes Altavista con el mismo formulario del flujo principal.
