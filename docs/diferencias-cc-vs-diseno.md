# Diferencias entre el código y el archivo de diseño · Flujo secundario (turismo)

Regla de precedencia del handoff: **el código manda**. Donde `prototipo/Flujo secundario.dc.html` o `docs/componentes.md` difieren de lo que ya existía en el codebase, se conservó el código y la diferencia quedó anotada acá para sincronizar el archivo de diseño después. Lo nuevo del diseño (escenario turismo, paso "¿Qué pagas con este cobro?", OpcionOrigen deshabilitada, `pares[]` en la tarjeta de tipo de cambio, TDC en vivo, casos nuevos de TarjetaPosicion, pantalla inicial) se construyó extendiendo los componentes existentes.

Frames: S01–S08 del archivo de diseño (capturas en `docs/design/frames/S0*.png`); S07H y S08H son la variante con Hoy en `/tablero/alta`. "Inicio" es la pantalla de arquetipos (sin frame de diseño).

## Diferencias

| Componente | Propiedad | Valor en código | Valor en diseño | Frame |
|---|---|---|---|---|
| ModalOperar (ventana de pago) | Título y textos con el destinatario | "Pagar a Hotel Gran Vía Madrid", "se envía el pago a Hotel…", "Pactaste el pago a Hotel…" (`tituloDe`: "Pagar a {destinatario}") | "Pagar al Hotel Gran Vía Madrid", "al Hotel" | S03–S08 |
| ResumenPago | Precio ejecutable y montos derivados | 21.251447 = indicativo 21.250000 × 1.0000681 (`ejecutable()`, mismo factor del flujo principal) → Pagas 89,256.08 MXN, pesos después 330,743.92 | 21.251450 (inventado) → 89,256.09 y 330,743.91 | S05, S07, S08 |
| ResumenPago | Unidad del precio | "MXN por EUR" (C-42; ya coincide con el diseño) | "MXN por EUR" | S05, S06 |
| ResumenPago | Cuenta regresiva inicial | 2:00 (C-08) | 1:59 | S05 |
| ModalOperar · pie | Botón secundario en precio y vencido | "Volver" (regresa a la revisión y descarta el precio, C-03) | "Cancelar" | S05, S06 |
| ResumenPago / Alerta | Precio vencido | Alert info, badge neutral "Vencido" sobre el precio que venció, precio tachado, sin casillas de token (C-04) | Alert error (#770505 / #F0CECE), badge error, precio en Grey1, casillas deshabilitadas | S06 |
| CampoToken | Anatomía | Un solo input con seis casillas visuales, admite pegar (C-09) | Seis casillas con caret | S05 |
| ResumenPago | Tipo de cambio en la revisión | "Tipo de cambio" con badge "Precio indicativo", arriba de la columna derecha sobre fondo canvas, sin borde (C-47, reemplaza a C-07) | "TDC Valiu · EUR/MXN", borde 2 px #0086FF | S04 |
| Revisión | Campo de concepto | "Motivo de pago", lista cerrada precargada (C-05) | "Concepto" | S04 |
| Confirmación (Hoy) | Título y fila TDC | "Pago en proceso" (C-02) · fila "TDC" | "Pago enviado" · fila "TDC EUR/MXN" | S07H |
| Confirmación (pactada) | Botón secundario | "Descargar confirmación" (C-10) | "Descargar comprobante" | S07 |
| AvisoResultado (Hoy) | Texto | "Pago en proceso. Ya te alcanza para los pagos en EUR de la semana." (C-12) | "Pago enviado. Ya no tienes pagos pendientes en euros." | S08H |
| OpcionOrigen · Cuenta USD | Consecuencia | "Te faltarían 1,435.00 USD el jue 8" (día con fecha, como el flujo principal; monto con EUR/USD 1.175000, ver sección 7) | "Te faltarían 1,057.00 USD el jueves" | S03 |
| OpcionPago | Orden de las opciones | Por fecha de vencimiento, como Próximos (Mayorista Caribe jue 8, Hotel vie 9); el faltante va seleccionado aunque no sea el primero | El faltante primero (Hotel, Mayorista) | S02 |
| OpcionPago | "Pagar a otro destinatario" | Link Button del DS: tinta #151522, 600, subrayado (C-13); abre el paso Destino "¿A quién le pagas?" (sección 7) | 700 14 #3D46CC subrayado, sin destino | S02 |
| TarjetaTipoDeCambio | Pares secundarios | Una línea compacta por par: "USD/MXN · comprar USD 18.091183 · vender USD 18.032135" (forma que ya tenía el código con `otros[]`) | Bloque con dos filas "Para comprar USD" / "Para vender USD", separado por divisor con padding-top 12 | S01 |
| TarjetaTipoDeCambio | Hora de la tendencia | "10:42" (`HORA_TDC`, compartida por los dos arquetipos) | "09:40" | S01 |
| TarjetaTipoDeCambio | Badge | "En vivo" · "Congelado" (`?congelar=1`) · "En pausa" (tecla P, solo con `?demo=1`, C-40) | "En vivo" siempre | S01 |
| TDC en vivo | Banda, ritmo y pares | ±0.002 % cada 3–5 s sobre todos los pares (`useTdcEnVivo`, `OSCILACION_*`); sigue moviéndose al pedir precio (durante los 2 minutos para confirmar el ejecutable lo sigue, C-48) y después de confirmar | ±0.0012 cada 2 s solo en EUR/MXN; se congela al pedir precio y después de confirmar | S01, S04, S06 |
| TarjetaPosicion · EUR | Eje de la proyección | "vie 9 · faltante" en `--danger` (C-19) | "vie 9" en #B40909 600, sin "faltante" | S01 |
| TarjetaPosicion · USD | Eje de la proyección | "jue 8" en 400 | "jue 8" en 600 (día del pago) | S01 |
| TarjetaPosicion · MXN y EUR sin pendientes | Fila "Pagos futuros" | Oculta cuando no hay pagos (cada fila aparece solo con movimientos) | "Pagos futuros 0.00" | S01, S08 |
| TarjetaPosicion · EUR | "Comprar 4,200 EUR" | Funciona: abre la ventana de pago "Pasar a tu Cuenta EUR" con pesos (compra a cuenta propia del flujo principal) | Pendiente, sin acción | S01 |
| FilaMovimiento · Mayorista Caribe | "Pagar" | Funciona: ventana de pago en Origen con la Cuenta USD elegible, sin tipo de cambio | Pendiente, sin acción | S01 |
| FilaMovimiento | Fila y título de Movimientos | Cada fila abre su detalle en el panel lateral; "+" junto al título carga un pago en la ventana de pago (features del código) | Sin detalle ni "+" | S01, S08 |
| Home · encabezado | Empresa y hora de entrada | "Viajes Altavista S.A. de C.V. · martes 6 de octubre"; reloj del escenario 10:42 (`HOY` compartido) | "Viajes Altavista · martes 6 de octubre"; entra a las 09:40 | S01 |
| FranjaNuevo · importadora | "Usar para pagar" | ~~Paso Destino con la cuenta en pesos preseleccionada~~ Desde C-38, paso "¿Qué pagas con este cobro?" en los dos arquetipos, como en el diseño | Paso "¿Qué pagas con este cobro?" en los dos | S02 (importadora) |
| Pantalla inicial | Logo | 22 px (`--app-logo-h`, el mismo del sidebar) | 28 px | Inicio |
| Pantalla inicial | Persistencia del arquetipo | Ninguna: la ruta (`/importadora`, `/turismo`) lleva el arquetipo y nada se guarda (C-23, sin localStorage); el recorrido se muestra una vez por arquetipo dentro de la sesión | Cookie o localStorage | Inicio |

## Datos del escenario que se completaron

| Dato | Valor en código | Origen |
|---|---|---|
| EUR/USD | 1.175000 / 1.171000 en los dos arquetipos | Sección 7 del brief: el cross cierra con USD/MXN y EUR/MXN (18.091183 × 1.175 ≈ 21.26). Reemplaza al 1.0845 / 1.08 del flujo principal y al 1.085 del pedido de turismo. |
| CLABE de la Cuenta Principal MXN | `012180000044100017` | Inventada, para "Ver datos para depositar". |
| Destinatario Familia Ortega | BBVA México **** 7702 | Inventado, para el detalle del cobro. |
| Realizados Aerolínea Centro y Familia Ríos | Hora, banco, cuenta y referencia | Inventados, para el detalle del movimiento. |
| Contexto de la tarjeta de arquetipo | Tres líneas calculadas desde los datos (`contexto` en `IMPORTADORA` y `TURISMO`) | Copy del README del handoff con los montos formateados desde los datos. |

## Ambigüedades resueltas con el menor cambio al código

- **Precio ejecutable**: el código ya calcula el ejecutable con un factor único (`ejecutable()`); el 21.251450 del diseño era un valor inventado, así que no se agregó un ejecutable por escenario.
- **Cuenta sin saldo**: se deshabilita solo cuando la cuenta está en la divisa del pago y su saldo es 0 (transferencia sin fondos, D-31). Con saldo insuficiente pero mayor a cero sigue el comportamiento previo del código ("Hoy no alcanza" cuando hay tipo de cambio).
- **"Incluye el cobro de hoy"** aparece en la cuenta donde entró el cobro solo al entrar desde el cobro (`panel.cobroId`); desde "Pagar" de la fila no, para no cambiar las pantallas de la importadora.
- **Tecla P**: ~~pausa en cualquier parte salvo en campos de texto libre~~ Desde la sección 7 nunca se dispara con el foco en un campo, y desde C-40 solo funciona con `?demo=1`.
- **Escenarios por URL** (`?escenario=`) funcionan también en `/turismo`: resuelta y pactada pagan el Hotel desde la cuenta en pesos; sin-saldo deja la cuenta en pesos en 20,000.00 sin el cobro.
- ~~**Operar clásico** en `/turismo` usa las cuentas y el tipo de cambio de Viajes Altavista con el mismo formulario del flujo principal.~~ Desde C-53 no hay clásico: el cotizador de la tarjeta de tipo de cambio usa los pares y las cuentas de Viajes Altavista (EUR/MXN primero).

## Sección 7 del brief (aplicada después del flujo secundario)

Cambios pedidos sobre el brief original, en orden, con lo que había antes en el código y en los archivos de diseño.

| Componente | Propiedad | Valor en código (ahora) | Valor anterior / en diseño | Frame |
|---|---|---|---|---|
| Ventana de pago | Transferencia por la misma ventana | Origen en la divisa del pago (Shenzhen desde Cuenta USD; Mayorista Caribe desde Cuenta USD en turismo): revisión sin tipo de cambio ni fecha valor, "Continuar" en lugar de "Pedir precio", resumen + token al confirmar, "Pago en proceso" sin TDC | Ya funcionaba así en el código; el diseño del flujo principal solo mostraba la compra | 02–06, S03 |
| Paso Destino | "Pagar" del encabezado y "Pagar a otro destinatario" | "¿A quién le pagas?" con buscador y dos grupos, primero Destinatarios y después Tus cuentas (C-49), con el selector del clásico; desde el cobro, la cuenta del cobro queda como origen y "Volver" regresa al paso Pago | "Pagar a otro destinatario" estaba deshabilitado con tooltip | S02 |
| Paso Destino → Origen | Cuenta propia en otra divisa | Es una compra o una venta por la misma ventana de pago; desde Origen se puede continuar sin monto (cada cuenta muestra solo nombre y saldo, C-49) y en la revisión se escribe | Antes "Continuar" quedaba deshabilitado sin monto, así que solo "Comprar X" (con monto) llegaba a la revisión | — |
| BloqueMonto | Lado fijo sin factura | Dos campos, "Pagas" arriba y "Recibe · {destino}" abajo (C-39, como en el diseño); el que el usuario escribe queda fijo (tag Fijo) y el otro se recalcula en vivo con el indicativo. Con factura sigue "Pagas" en vivo y "{destinatario} recibe" fijo | Los dos campos ya eran editables; el orden era Pagas / recibe en ambos casos | 03 (Comprar 1,000 USD) |
| fx.ts | EUR/USD | 1.175000 / 1.171000 en los dos arquetipos: Shenzhen desde Cuenta EUR ≈ 1,280.96 EUR; Hotel desde Cuenta USD ≈ 4,935.00 USD y "Te faltarían 1,435.00 USD el jue 8"; muestras de /sistema calculadas con `cotizar()` | 1.0845 / 1.080000 (flujo principal: 1,388.89 EUR) y 1.085 (turismo: 4,557.00 USD, 1,057.00) | 02, S03 |
| Tecla P (D-32) | Dónde se dispara | Nunca con el foco en un campo (input, textarea, select, contenteditable) | Pausaba también desde el token y los campos numéricos | — |
| Revisión y Cargar un pago | "Concepto" | Campo de texto opcional "Concepto", precargado solo con el pago cargado (vacío sin factura); las filas del detalle y la confirmación dicen "Concepto"; ~~el clásico conserva "Motivo de pago"~~ (sin clásico desde C-53) | "Motivo de pago", lista cerrada precargada según el caso (C-05, del handoff de alta) | 03, 06, A2 |
| FranjaNuevo | "Comprobante" | Abre el detalle del cobro de hoy; "Descargar comprobante" y "Descargar confirmación" (ventana de pago y detalle) descargan un .html con las mismas filas que muestra la pantalla | Toast "Esta sección no está en el prototipo." | 01, 06, D2 |
| Estados de token incorrecto, origen sin saldo y pactada sin saldo | Alcance | Se dejan como están (000000, "Hoy no alcanza" / escenario sin-saldo, "Sin saldo" en turismo), sin seguir desarrollándolos | — | — |

## Ventana de pago (C-47)

Operar pasa del panel lateral a una ventana centrada; consultar sigue en el panel lateral. Motivo y alcance en `docs/decisiones.md` (C-47). Los frames del archivo de diseño (`docs/design/frames/`) siguen mostrando el panel lateral.

| Componente | Propiedad | Valor en código (ahora) | Valor anterior / en diseño | Frame |
|---|---|---|---|---|
| ModalOperar | Contenedor del pago, Cargar un pago y Agregar destinatario | Ventana centrada, radio 16 en las cuatro esquinas, `--shadow-lg`, mismo overlay: 920 px en Origen, Revisión, Precio y (desde C-50) Confirmación, 560 px en el resto; encabezado y pie fijos y, si algo no entra, scroll solo en el cuerpo | Panel lateral de 480 px a la derecha, con los pasos apilados y scroll en todo el panel | 02–06, 03B–06B, S02–S07, A1–A3 |
| ModalOperar · pie | Botones | Alineados a la derecha: secundario (140 px mínimo) y primario (220 px mínimo) | Dos botones al 50 % | 02–06, S03–S06 |
| ResumenPago | Columna derecha de Origen, Revisión y Precio | Tipo de cambio siempre arriba ("Precio indicativo", "Confirma en m:ss" con "Se mueve con el mercado hasta que confirmas." desde C-48, "Vencido" o "Sin tipo de cambio") y debajo "Comisión" (C-50); en Origen, con monto, "{destinatario} recibe" y "Vence"; en Revisión y Precio "Sale de", "Sale el dinero" y "Tu cuenta queda en" ("El vie 9 tu cuenta queda en" con fecha valor), el aviso de pago después del vencimiento y "Ten tu token a mano: tienes 2 minutos para confirmar." | Caja TDC y precio ejecutable entre los montos y el token; línea "Tu cuenta en pesos queda en ≈ X" debajo de la fecha | 02–05, 03B, 04B, S03–S06 |
| Revisión | Frase de resumen | Sin frase | "Vas a pagar 4,200.00 EUR con pesos. Compras los euros a … MXN." (y "Vas a pagar 1,500.00 USD con pesos…" en el flujo principal) | 03, S04 |
| Confirmación (ventana de pago) | Encabezado | Ícono al lado del título y del badge | Ícono arriba, título y badge centrados debajo | 06, 06B, S07, S07H |
| PanelOperar | Qué muestra | Solo consultar: detalle de un movimiento, notificaciones, todas las cuentas y los datos para depositar pedidos desde el inicio o desde las cuentas; "Pagar" en el detalle cierra el panel y abre la ventana | Todo el flujo de pago | D1–D3, N4, N5 |

## Check-in con Mateo (C-48 a C-52)

Precio en vivo, menos contenido, qué sale y qué llega, fecha de liquidación y menú. Motivo y alcance de cada cambio en `docs/decisiones.md` (C-48 a C-52); los frames del archivo de diseño siguen con los textos anteriores.

| Componente | Propiedad | Valor en código (ahora) | Valor anterior / en diseño | Frame |
|---|---|---|---|---|
| ResumenPago | Precio pedido | "Confirma en m:ss" (Success; Warning en los últimos 30 s) y "Se mueve con el mercado hasta que confirmas."; el ejecutable sigue al indicativo hasta confirmar (C-48) | "Precio fijo por m:ss"; el precio quedaba fijo al pedirlo | 04, 04B, 11, S05 |
| BloqueMonto | Paso Precio | "Fijo" en el lado que eligió el usuario y "se actualiza en vivo" en el otro, sin "≈" (C-48) | Los dos montos exactos y fijos | 04, 04B, S05 |
| OpcionOrigen / OpcionPago | Contenido | Sin monto, solo nombre y saldo; con monto, "Pagas ≈ X" y como mucho un chip Success o Warning (C-49) | "El monto se elige después" y chips neutros ("Te quedan X", "Sale de tu Cuenta USD, sin tipo de cambio") | 02, S02, S03 |
| Revisión | Pago cargado del destinatario | "Tienes un pago cargado para … vence …" con "Usar este pago" sobre el monto (C-49) | Grupo "Pagos próximos" en el paso Destino | — |
| ResumenPago, confirmación, comprobante y detalle | Comisión | "Comisión 0%" siempre (C-50) | Sin comisión | 02–06, 11, 12, S03–S07 |
| Confirmación | Montos y filas | BloqueMonto de solo lectura con los montos finales; "Sale de", "Sale el dinero", "Tipo de cambio", "Comisión", "Concepto" y "Referencia"; en la ventana, dos columnas (C-50) | "Enviaste" / "Pagaste" y la frase "Cerraste el precio…" de la pactada | 06, 06B, 12, S07, S07H |
| FechaLiquidacion | Texto bajo el control | Según lo elegido: el beneficio de elegir otro día (C-51) | "El precio queda cerrado hoy, elijas el día que elijas." | 03, 03B, S04 |
| Aviso de fondeo | Pactada | "Ten 27,138.62 MXN en tu Cuenta Principal MXN el jue 8." (C-51) | "… para que el pago salga." | 06B, 07B, S07 |
| AppShell | Menú lateral | Solo Inicio navega; las otras entradas, deshabilitadas (C-52) | Todas navegaban | todos |
| Inicio | Cobro de hoy y TarjetaPosicion | "Cobraste hoy"; sin "Incluye los 180,000.00 de Comercial Norte" (C-49) | "Lo nuevo" y la línea "Incluye los …" | 01, S01 |

## Cotizador, pagos en otras divisas y desglose (C-53 a C-55)

Motivo y alcance en `docs/decisiones.md` (C-53 a C-55). Los frames del archivo de diseño (`docs/design/frames/`) siguen mostrando la pestaña Operar clásico (08–16) y el recorrido de 4 pasos (17–20); en `/tablero/alta` esos frames ya no están y en su lugar van C1–C4, O1–O4, G1 y 17–19.

| Componente | Propiedad | Valor en código (ahora) | Valor anterior / en diseño | Frame |
|---|---|---|---|---|
| Inicio | Pestañas | Sin pestañas: la posición y el resto del inicio van directo (C-53) | "Posición consolidada" / "Operar clásico" | 01, 08–16 |
| TarjetaTipoDeCambio | Par | Selector con "Tus pares" (posiciones y pagos cargados) y "Otros pares" (el resto de `PARES`); debajo, en una línea, los demás de "Tus pares"; sin "Solo los pares de tus posiciones" (C-53) | Par fijo de la decisión con EUR/MXN debajo y la nota "Solo los pares de tus posiciones" | 01, S01 |
| TarjetaTipoDeCambio | Operar | "Operar con este par", desplegado al entrar: Recibes y Pagas apilados, invertir, "Desde {cuenta} · saldo X" y Continuar, que abre la ventana de pago en Destino (C-53) | Formulario de Operar clásico (Comprar, Vender, Transferir) en otra pestaña | 08–16 |
| ModalOperar · Destino | Desde el cotizador | "¿A dónde llegan los 10,000.00 USD?", "Tus cuentas" en esa divisa y "Destinatarios en USD"; después Revisión, Precio y Confirmación sin Origen (C-53) | — | — |
| fx.ts | GBP/MXN y CAD/MXN | Operables: 24.300000 / 24.100000 y 13.200000 / 13.050000, de ejemplo (C-53) | "Este par no está en el prototipo." | 09 |
| TarjetaPosicion | Pagos en otras divisas | "Pagos en otras divisas (n) ≈ −X" en la cuenta de fondeo, y "≈" en el resultado (C-54) | — | — |
| FilaMovimiento | Pago en una divisa sin cuenta | Monto en su divisa y debajo "≈ X MXN hoy"; sin par, "Sin par disponible" (C-54) | — | — |
| OpcionOrigen | Cuenta sin par con la divisa del pago | Deshabilitada con "Sin par disponible"; la de fondeo, preseleccionada (C-54) | — | — |
| TarjetaPosicion | Filas con cantidad | Botones con chevron a la derecha del monto que abren su desglose en la ventana de pago; "Saldo" no (C-55) | Texto | 01, S01 |
| PasoOnboarding | Pasos | Tres: el 3 rodea la tarjeta de tipo de cambio entera, "El tipo de cambio, y operar desde ahí" (C-53) | Cuatro: el 3 sobre el tipo de cambio y el 4 sobre la pestaña Operar clásico | 17–20 |

## Cuentas al menú lateral (C-56)

Motivo y alcance en `docs/decisiones.md` (C-56). Los frames del archivo de diseño (`docs/design/frames/`) muestran el módulo Cuentas en la columna derecha; en `/tablero/alta` las cuentas van en el menú lateral.

| Componente | Propiedad | Valor en código (ahora) | Valor anterior / en diseño | Frame |
|---|---|---|---|---|
| AppShell | Menú lateral | "Tus cuentas" debajo de las entradas: nombre, saldo y máscara de cada cuenta (hasta tres) y "Ver todas mis cuentas"; cada fila abre el panel con su cuenta primero; con el menú colapsado, un ícono (C-56) | Solo las entradas y "Cerrar sesión" | todos |
| Inicio | Columna derecha | Solo la tarjeta de tipo de cambio (C-56) | Tipo de cambio y ModuloCuentas | 01, S01 |
| ModalOperar | Posición | Centrada a la derecha del menú cuando entra (shell de 1208 px o más), sin tapar "Tus cuentas" (C-56) | Centrada en la pantalla | 02–06, S02–S08 |
