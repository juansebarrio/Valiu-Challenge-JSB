# Capturas para la presentación del challenge

Generadas con Playwright (Chromium) con `scripts/presentacion.mjs` contra el build de producción del commit publicado (`npm run build && npm start`, nunca `next dev`), servido en localhost: producción (https://valiu-challenge.vercel.app) no es alcanzable desde el entorno donde corre el script (el proxy rechaza el túnel a `vercel.app`); el código es el mismo.

Reglas aplicadas: PNG con `deviceScaleFactor` 2 (plan B a 1); frames de `/tablero/alta` a zoom 1 (ventana de 2700 px para que el tablero no escale) y recortes al frame, al componente o a la columna principal, sin títulos, notas ni fondo del tablero; `document.fonts.ready` esperado y Montserrat verificada en cada página; sin barras de scroll (ocultas por CSS), sin foco visible, sin toasts y sin el control de demo. Desde C-47 el pago va en una ventana centrada (`ModalOperar`): `d2-origen`, `d3-precio-token` y `d5-fecha-valor` la toman entera (920 × 596 px css), `d1-desglose` también (560 px css, una columna) y `d2-destino` del borde superior hasta Asia Packaging. Sus esquinas redondeadas (16 px css, 32 px en el PNG) quedaron transparentes con `scripts/esquinas.py`, las cuatro en las enteras y las dos de arriba en `d2-destino`: fuera de la ventana solo había fondo oscurecido del prototipo. El script también comprueba que en los frames 17 a 19 la tarjeta del recorrido esté junto a su objetivo y con el recorte (C-46), y que en el 19 el recorte rodee la tarjeta de tipo de cambio entera (C-53). Este README y `capturas-deck.zip` salen de `scripts/readme-capturas.py`, con las medidas reales de cada archivo.

## Deck (los 12 archivos de `capturas-deck.zip`)

| # | Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |
|---|---|---|---|---|---|
| 1 | `inicio-importadora.png` | Inicio de la importadora: posición por divisa con el faltante de 1,000.00 USD, Cobraste hoy (+180,000.00 MXN), Movimientos y el tipo de cambio (USD/MXN 18.091183 / 18.032135, EUR/MXN 21.250000 / 21.100000) con "Operar con este par" desplegado. | Frame 01 de `/tablero/alta`, entero | Deck · inicio | 2560 × 3158 |
| 2 | `turismo-cobro.png` | Inicio de la minorista de turismo con la ventana de pago en "¿Qué pagas con este cobro?" sobre el cobro de 95,000.00 MXN de Familia Ortega; el hotel (4,200.00 EUR) preseleccionado. | Frame S02 de `/tablero/alta`, entero | Deck · turismo | 2560 × 3158 |
| 3 | `d1-posicion.png` | Sección Posición por divisa: título y las tres tarjetas (USD faltan 1,000.00 con la proyección, MXN sobran 1,099,649.50, EUR sin pendientes); las filas con cantidad llevan el chevron que abre su desglose. | Frame 01 · `[data-tour="posicion"]` con 16 px de aire | Decisión 1 · posición por divisa | 2016 × 824 |
| 4 | `d1-otras-divisas.png` | Tarjeta en pesos con un pago de 40,000.00 GBP sin cuenta en libras: "Pagos en otras divisas (1) ≈ −972,000.00" al indicativo de compra GBP/MXN 24.300000, la proyección de la semana y "Sobran ≈ 127,649.50". | Frame O1 (`?escenario=otras-divisas`) · TarjetaPosicion en pesos con 16 px de aire | Decisión 1 · posición por divisa | 682 × 754 |
| 5 | `d1-desglose.png` | Desglose de "Pagos futuros (3)" de la tarjeta en dólares, en la ventana de pago (una columna, 560 px): "Pagos futuros en USD", 3 pagos · −3,000.00 USD; por fecha, Shenzhen Parts Co., Logística Pacífico y Asia Packaging con su referencia, su monto y "Pagar"; pie con "Cerrar". | Frame G1 · ModalOperar entera | Decisión 1 · posición por divisa | 1120 × 736 |
| 6 | `d2-destino.png` | Ventana de pago en el paso Destino, "¿A quién le pagas?" (una columna, 560 px): encabezado, buscador y el grupo Destinatarios con los tres en USD (Shenzhen Parts Co., Logística Pacífico, Asia Packaging). | `/importadora?congelar=1&recorrido=0` a 1440 × 900, "Pagar" del encabezado; del borde superior de la ventana a 8 px bajo la fila de Asia Packaging | Decisión 2 · destino y origen | 1120 × 792 |
| 7 | `d2-origen.png` | Ventana de pago en el paso Origen, en dos columnas: a la izquierda las tres cuentas con lo que pagas y un chip como mucho (MXN ≈ 27,136.77 y EUR ≈ 1,280.96 con "Cubre el faltante en USD", USD 1,500.00 con "Te faltarían 1,000.00 USD para tus pagos del vie 9"); a la derecha el tipo de cambio indicativo 18.091183 MXN por USD, Comisión 0%, Shenzhen Parts Co. recibe 1,500.00 USD y el vencimiento. | Frame 02 · ModalOperar entera | Decisión 2 · destino y origen | 1840 × 1192 |
| 8 | `d3-precio-token.png` | Paso Precio en dos columnas: a la derecha el precio ejecutable 18.092415 MXN por USD con "Confirma en 2:00" y "Se mueve con el mercado hasta que confirmas.", Comisión 0%, de qué cuenta y cuándo sale el dinero y la cuenta en 1,152,861.38 MXN; a la izquierda Pagas 27,138.62 MXN (se actualiza en vivo), Shenzhen Parts Co. recibe 1,500.00 USD (Fijo) y las seis casillas del token. | Frame 04 · ModalOperar entera | Decisión 3 · precio y token | 1840 × 1192 |
| 9 | `d4-cotizador.png` | Tarjeta Tipo de cambio: el par USD/MXN con sus dos lados y la tendencia, EUR/MXN compacto y "Operar con este par" desplegado con Recibes 10,000.00 USD, Pagas 180,911.83 MXN, "Desde Cuenta Principal MXN · saldo 1,180,000.00" y Continuar. | Frame C1 · TarjetaTipoDeCambio con 16 px de aire | Decisión 4 · cotizador y recorrido | 682 × 1342 |
| 10 | `d4-recorrido.png` | Onboarding, paso 3 de 3 ("El tipo de cambio, y operar desde ahí") con el recorte sobre la tarjeta de tipo de cambio entera y la tarjeta del recorrido a su izquierda. | Frame 19 · columna principal (del sidebar al borde derecho), de 24 px sobre el recorte a 24 px debajo | Decisión 4 · cotizador y recorrido | 2080 × 1406 |
| 11 | `d5-fecha-valor.png` | Revisión con "jue 8 · vence" elegido en "¿Cuándo sale el dinero?": a la izquierda los montos, la fecha y "Cierras el precio hoy y el dinero sale el jue 8. No necesitas tener el saldo hasta ese día."; a la derecha el indicativo, Comisión 0%, "Sale el dinero jue 8" y "El jue 8 tu cuenta queda en ≈ 1,152,863.23 MXN". | Frame 03B · ModalOperar entera | Decisión 5 · fecha valor | 1840 × 1192 |
| 12 | `d5-pactada-inicio.png` | Inicio con el pago pactado: aviso "Pactaste el pago…", MXN con "Pactadas por liquidar (1) −27,138.62" y USD con sobran 500.00. | Frame 07B · columna principal, del borde superior a 16 px bajo Posición por divisa | Decisión 5 · fecha valor | 2080 × 1108 |

## Plan B (`plan-b/`, respaldo si falla la demo en vivo)

Todos los frames de `/tablero/alta` a escala 1 y `deviceScaleFactor` 1, uno por archivo, con el id del frame como nombre; `Estados.png` es la hoja de estados de componentes (no es un frame de 1280 px). Van en la slide de respaldo de la demo.

| Archivo | Frame | Medidas (px) |
|---|---|---|
| `plan-b/01.png` | 01 | 1280 × 1579 |
| `plan-b/02.png` | 02 | 1280 × 1579 |
| `plan-b/03.png` | 03 | 1280 × 1579 |
| `plan-b/04.png` | 04 | 1280 × 1579 |
| `plan-b/05.png` | 05 | 1280 × 1579 |
| `plan-b/06.png` | 06 | 1280 × 1529 |
| `plan-b/07.png` | 07 | 1280 × 1595 |
| `plan-b/03B.png` | 03B | 1280 × 1579 |
| `plan-b/04B.png` | 04B | 1280 × 1579 |
| `plan-b/06B.png` | 06B | 1280 × 1529 |
| `plan-b/07B.png` | 07B | 1280 × 1595 |
| `plan-b/C1.png` | C1 | 1280 × 1579 |
| `plan-b/C2.png` | C2 | 1280 × 1301 |
| `plan-b/C3.png` | C3 | 1280 × 1579 |
| `plan-b/C4.png` | C4 | 1280 × 1579 |
| `plan-b/O1.png` | O1 | 1280 × 1637 |
| `plan-b/O2.png` | O2 | 1280 × 1637 |
| `plan-b/O3.png` | O3 | 1280 × 1637 |
| `plan-b/O4.png` | O4 | 1280 × 1637 |
| `plan-b/G1.png` | G1 | 1280 × 1579 |
| `plan-b/D1.png` | D1 | 1280 × 1579 |
| `plan-b/D2.png` | D2 | 1280 × 1579 |
| `plan-b/D3.png` | D3 | 1280 × 1595 |
| `plan-b/A1.png` | A1 | 1280 × 1579 |
| `plan-b/A2.png` | A2 | 1280 × 1579 |
| `plan-b/A3.png` | A3 | 1280 × 1579 |
| `plan-b/A4.png` | A4 | 1280 × 1645 |
| `plan-b/S01.png` | S01 | 1280 × 1579 |
| `plan-b/S02.png` | S02 | 1280 × 1579 |
| `plan-b/S03.png` | S03 | 1280 × 1579 |
| `plan-b/S04.png` | S04 | 1280 × 1579 |
| `plan-b/S05.png` | S05 | 1280 × 1579 |
| `plan-b/S06.png` | S06 | 1280 × 1579 |
| `plan-b/S07.png` | S07 | 1280 × 1529 |
| `plan-b/S08.png` | S08 | 1280 × 1595 |
| `plan-b/S07H.png` | S07H | 1280 × 1529 |
| `plan-b/S08H.png` | S08H | 1280 × 1595 |
| `plan-b/N4.png` | N4 | 1280 × 1579 |
| `plan-b/N5.png` | N5 | 1280 × 1579 |
| `plan-b/N6.png` | N6 | 1280 × 1579 |
| `plan-b/17.png` | 17 | 1280 × 1579 |
| `plan-b/18.png` | 18 | 1280 × 1579 |
| `plan-b/19.png` | 19 | 1280 × 1579 |
| `plan-b/Estados.png` | Estados | 2636 × 773 |

