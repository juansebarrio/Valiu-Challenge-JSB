# Capturas para la presentación del challenge

Generadas con Playwright (Chromium) contra el commit `0154d41` servido en localhost con `npm run build && npm start`, porque producción (https://valiu-challenge.vercel.app) no es alcanzable desde el entorno donde corrió el script (el proxy rechaza el túnel a `vercel.app`). El código es el mismo que está publicado en ese commit.

Reglas aplicadas: PNG con `deviceScaleFactor` 2 (plan B a 1); frames de `/tablero/alta` capturados a zoom 1 (ventana de 2700 px para que el tablero no escale) y recortados a la raíz del frame o al componente (`data-component`), sin títulos, notas ni fondo del tablero; `document.fonts.ready` esperado y Montserrat verificada en cada página; sin barras de scroll (ocultas por CSS), sin foco visible, sin toasts y sin el control de demo. En las tres capturas del panel (`d2-destino`, `d2-origen`, `d3-precio-token`) las dos esquinas redondeadas de la izquierda quedaron transparentes: fuera del panel solo había fondo oscurecido del prototipo. Scripts en `../scripts/`: `presentacion.mjs` (todas las capturas, Playwright contra `http://127.0.0.1:3000`), `presentacion-compacto.mjs` (la variante compacta) y `readme-capturas.py` (este README, con las medidas reales de cada archivo).

## Deck (archivos 1 a 11, en `capturas-deck.zip`)

| # | Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |
|---|---|---|---|---|---|
| 1 | `inicio-importadora.png` | Inicio de la importadora: posición por divisa con el faltante de 1,000.00 USD, Lo nuevo (+180,000.00 MXN) y Movimientos. | Frame 01 de `/tablero/alta` | Deck · inicio | 2560 × 2662 |
| 2 | `turismo-cobro.png` | Inicio de la minorista de turismo con el panel "¿Qué pagas con este cobro?" sobre el cobro de 95,000.00 MXN de Familia Ortega; el hotel (4,200.00 EUR) preseleccionado. | Frame S02 de `/tablero/alta` | Deck · turismo | 2560 × 2662 |
| 3 | `d1-posicion-usd.png` | TarjetaPosicion de USD: saldo 2,000.00, pagos futuros −3,000.00, faltan 1,000.00, proyección de la semana y "Comprar 1,000 USD". | Frame 01 · `[data-component="TarjetaPosicion"]` de dólares | Decisión 1 · posición por divisa | 620 × 690 |
| 4 | `d2-destino.png` | PanelOperar en el paso Destino, "¿A quién le pagas?": buscador y grupos Pagos próximos, Tus cuentas y Destinatarios. | `/importadora?congelar=1&recorrido=0` a 1440 × 900, "Pagar" del encabezado (no hay frame) | Decisión 2 · destino y origen | 960 × 1800 |
| 5 | `d2-origen.png` | PanelOperar en el paso Origen con las tres cuentas y sus consecuencias: MXN ≈ 27,136.77 (cubre el faltante), USD 1,500.00 sin tipo de cambio (te faltarían 1,000.00 el vie 9), EUR ≈ 1,280.96. | Frame 02 · `[data-component="PanelOperar"]` | Decisión 2 · destino y origen | 960 × 2662 |
| 6 | `d3-precio-token.png` | PanelOperar con el precio ejecutable 18.092415 MXN por USD fijo por 2:00, Pagas 27,138.62 MXN y el token de 6 dígitos. | Frame 04 · `[data-component="PanelOperar"]` | Decisión 3 · precio y token | 960 × 2662 |
| 7 | `d4-operar-clasico.png` | Pestaña Operar clásico vacía, con el aviso de la vista anterior y "Probar el nuevo flujo". | Frame 08 de `/tablero/alta` | Decisión 4 · clásico y recorrido | 2560 × 1894 |
| 8 | `d4-recorrido.png` | Onboarding, paso 1 de 4 ("Tu posición por divisa, de un vistazo") sobre el inicio. | Frame 17 de `/tablero/alta` | Decisión 4 · clásico y recorrido | 2560 × 2662 |
| 9 | `d5-fecha-valor.png` | Bloque FechaLiquidacion "¿Cuándo sale el dinero?" con "jue 8 · vence" elegido. | Frame 03B · `[data-component="FechaLiquidacion"]` | Decisión 5 · fecha valor | 864 × 180 |
| 10 | `d5-pactada-inicio.png` | Inicio con el pago pactado: aviso, MXN con "Pactadas por liquidar (1) −27,138.62", Shenzhen con badge Pactada. | Frame 07B de `/tablero/alta` | Decisión 5 · fecha valor | 2560 × 2694 |
| 11 | `tablero-completo.png` | `/tablero/alta` entero en una sola imagen, con el layout del tablero (dos columnas). | `/tablero/alta` a 1500 px de ancho, página completa | Qué hice | 3000 × 41874 |

## Extra

| Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |
|---|---|---|---|---|
| `tablero-completo-compacto.png` | Extra opcional, no está en el zip: el mismo tablero reflowado a seis columnas para que entre en una slide. | `/tablero/alta` a 1500 px de ancho con la grilla forzada a 6 columnas | Qué hice (alternativa) | 3000 × 12418 |

## Plan B (`plan-b/`, respaldo si falla la demo en vivo)

Todos los frames de `/tablero/alta` a escala 1 y `deviceScaleFactor` 1, uno por archivo, con el id del frame como nombre; `Estados.png` es la hoja de estados de componentes (no es un frame de 1280 px). Van en la slide de respaldo de la demo.

| Archivo | Frame | Medidas (px) |
|---|---|---|
| `plan-b/01.png` | 01 | 1280 × 1331 |
| `plan-b/02.png` | 02 | 1280 × 1331 |
| `plan-b/03.png` | 03 | 1280 × 1331 |
| `plan-b/04.png` | 04 | 1280 × 1331 |
| `plan-b/05.png` | 05 | 1280 × 1331 |
| `plan-b/06.png` | 06 | 1280 × 1281 |
| `plan-b/07.png` | 07 | 1280 × 1347 |
| `plan-b/03B.png` | 03B | 1280 × 1331 |
| `plan-b/04B.png` | 04B | 1280 × 1331 |
| `plan-b/06B.png` | 06B | 1280 × 1281 |
| `plan-b/07B.png` | 07B | 1280 × 1347 |
| `plan-b/08.png` | 08 | 1280 × 947 |
| `plan-b/09.png` | 09 | 1280 × 947 |
| `plan-b/10.png` | 10 | 1280 × 947 |
| `plan-b/11.png` | 11 | 1280 × 1000 |
| `plan-b/12.png` | 12 | 1280 × 1035 |
| `plan-b/13.png` | 13 | 1280 × 969 |
| `plan-b/14.png` | 14 | 1280 × 964 |
| `plan-b/15.png` | 15 | 1280 × 1017 |
| `plan-b/16.png` | 16 | 1280 × 1035 |
| `plan-b/D1.png` | D1 | 1280 × 1331 |
| `plan-b/D2.png` | D2 | 1280 × 1331 |
| `plan-b/D3.png` | D3 | 1280 × 1347 |
| `plan-b/A1.png` | A1 | 1280 × 1331 |
| `plan-b/A2.png` | A2 | 1280 × 1331 |
| `plan-b/A3.png` | A3 | 1280 × 1331 |
| `plan-b/A4.png` | A4 | 1280 × 1397 |
| `plan-b/S01.png` | S01 | 1280 × 1331 |
| `plan-b/S02.png` | S02 | 1280 × 1331 |
| `plan-b/S03.png` | S03 | 1280 × 1331 |
| `plan-b/S04.png` | S04 | 1280 × 1331 |
| `plan-b/S05.png` | S05 | 1280 × 1331 |
| `plan-b/S06.png` | S06 | 1280 × 1331 |
| `plan-b/S07.png` | S07 | 1280 × 1281 |
| `plan-b/S08.png` | S08 | 1280 × 1347 |
| `plan-b/S07H.png` | S07H | 1280 × 1281 |
| `plan-b/S08H.png` | S08H | 1280 × 1347 |
| `plan-b/N1.png` | N1 | 1280 × 927 |
| `plan-b/N2.png` | N2 | 1280 × 861 |
| `plan-b/N3.png` | N3 | 1280 × 491 |
| `plan-b/N4.png` | N4 | 1280 × 1331 |
| `plan-b/N5.png` | N5 | 1280 × 1331 |
| `plan-b/N6.png` | N6 | 1280 × 1331 |
| `plan-b/17.png` | 17 | 1280 × 1331 |
| `plan-b/18.png` | 18 | 1280 × 1331 |
| `plan-b/19.png` | 19 | 1280 × 1331 |
| `plan-b/20.png` | 20 | 1280 × 1331 |
| `plan-b/Estados.png` | Estados | 2636 × 773 |

