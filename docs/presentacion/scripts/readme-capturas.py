"""Genera docs/presentacion/capturas/README.md con las medidas reales de cada PNG y arma docs/presentacion/capturas-deck.zip con los del deck.
Uso: python3 readme-capturas.py <dir-capturas> <ids-del-tablero-separados-por-coma>
"""
import sys, pathlib, zipfile
from PIL import Image

root = pathlib.Path(sys.argv[1])

def medidas(rel):
    with Image.open(root / rel) as im:
        return f"{im.width} × {im.height}"

DECK = [
    ("inicio-importadora.png", "Inicio de la importadora: posición por divisa con el faltante de 1,000.00 USD, Cobraste hoy (+180,000.00 MXN), Movimientos y el tipo de cambio (USD/MXN 18.091183 / 18.032135, EUR/MXN 21.250000 / 21.100000) con \"Operar con este par\" desplegado; en el menú lateral, \"Tus cuentas\" con los saldos (C-56).", "Frame 01 de `/tablero/alta`, entero", "Deck · inicio"),
    ("turismo-cobro.png", "Inicio de la minorista de turismo con la ventana de pago en \"¿Qué pagas con este cobro?\" sobre el cobro de 95,000.00 MXN de Familia Ortega; el hotel (4,200.00 EUR) preseleccionado. La ventana se centra a la derecha del menú, donde se ve \"Tus cuentas\" (C-56).", "Frame S02 de `/tablero/alta`, entero", "Deck · turismo"),
    ("d1-posicion.png", "Sección Posición por divisa: título y las tres tarjetas (USD faltan 1,000.00 con la proyección, MXN sobran 1,099,649.50, EUR sin pendientes); las filas con cantidad llevan el chevron que abre su desglose.", "Frame 01 · `[data-tour=\"posicion\"]` con 16 px de aire", "Decisión 1 · posición por divisa"),
    ("d1-otras-divisas.png", "Tarjeta en pesos con un pago de 40,000.00 GBP sin cuenta en libras: \"Pagos en otras divisas (1) ≈ −972,000.00\" al indicativo de compra GBP/MXN 24.300000, la proyección de la semana y \"Sobran ≈ 127,649.50\".", "Frame O1 (`?escenario=otras-divisas`) · TarjetaPosicion en pesos con 16 px de aire", "Decisión 1 · posición por divisa"),
    ("d1-desglose.png", "Desglose de \"Pagos futuros (3)\" de la tarjeta en dólares, en la ventana de pago (una columna, 560 px): \"Pagos futuros en USD\", 3 pagos · −3,000.00 USD; por fecha, Shenzhen Parts Co., Logística Pacífico y Asia Packaging con su referencia, su monto y \"Pagar\"; pie con \"Cerrar\".", "Frame G1 · ModalOperar entera", "Decisión 1 · posición por divisa"),
    ("d2-destino.png", "Ventana de pago en el paso Destino, \"¿A quién le pagas?\" (una columna, 560 px): encabezado, buscador y el grupo Destinatarios con los tres en USD (Shenzhen Parts Co., Logística Pacífico, Asia Packaging).", "`/importadora?congelar=1&recorrido=0` a 1440 × 900, \"Pagar\" del encabezado; del borde superior de la ventana a 8 px bajo la fila de Asia Packaging", "Decisión 2 · destino y origen"),
    ("d2-origen.png", "Ventana de pago en el paso Origen, en dos columnas: a la izquierda las tres cuentas con lo que pagas y un chip como mucho (MXN ≈ 27,136.77 y EUR ≈ 1,280.96 con \"Cubre el faltante en USD\", USD 1,500.00 con \"Te faltarían 1,000.00 USD para tus pagos del vie 9\"); a la derecha el tipo de cambio indicativo 18.091183 MXN por USD, Comisión 0%, Shenzhen Parts Co. recibe 1,500.00 USD y el vencimiento.", "Frame 02 · ModalOperar entera", "Decisión 2 · destino y origen"),
    ("d3-precio-token.png", "Paso Precio en dos columnas: a la derecha el precio ejecutable 18.092415 MXN por USD con \"Confirma en 2:00\" y \"Se mueve con el mercado hasta que confirmas.\", Comisión 0%, de qué cuenta y cuándo sale el dinero y la cuenta en 1,152,861.38 MXN; a la izquierda Pagas 27,138.62 MXN (se actualiza en vivo), Shenzhen Parts Co. recibe 1,500.00 USD (Fijo) y las seis casillas del token.", "Frame 04 · ModalOperar entera", "Decisión 3 · precio y token"),
    ("d4-cotizador.png", "Tarjeta Tipo de cambio: el par USD/MXN con sus dos lados y la tendencia, EUR/MXN compacto y \"Operar con este par\" desplegado con Recibes 10,000.00 USD, Pagas 180,911.83 MXN, \"Desde Cuenta Principal MXN · saldo 1,180,000.00\" y Continuar.", "Frame C1 · TarjetaTipoDeCambio con 16 px de aire", "Decisión 4 · cotizador y recorrido"),
    ("d4-recorrido.png", "Onboarding, paso 3 de 3 (\"El tipo de cambio, y operar desde ahí\") con el recorte sobre la tarjeta de tipo de cambio entera y la tarjeta del recorrido a su izquierda.", "Frame 19 · columna principal (del sidebar al borde derecho), de 24 px sobre el recorte a 24 px debajo", "Decisión 4 · cotizador y recorrido"),
    ("d5-fecha-valor.png", "Revisión con \"jue 8 · vence\" elegido en \"¿Cuándo sale el dinero?\": a la izquierda los montos, la fecha y \"Cierras el precio hoy y el dinero sale el jue 8. No necesitas tener el saldo hasta ese día.\"; a la derecha el indicativo, Comisión 0%, \"Sale el dinero jue 8\" y \"El jue 8 tu cuenta queda en ≈ 1,152,863.23 MXN\".", "Frame 03B · ModalOperar entera", "Decisión 5 · fecha valor"),
    ("d5-pactada-inicio.png", "Inicio con el pago pactado: aviso \"Pactaste el pago…\", MXN con \"Pactadas por liquidar (1) −27,138.62\" y USD con sobran 500.00.", "Frame 07B · columna principal, del borde superior a 16 px bajo Posición por divisa", "Decisión 5 · fecha valor"),
]

lineas = []
lineas.append("# Capturas para la presentación del challenge\n")
lineas.append("Generadas con Playwright (Chromium) con `scripts/presentacion.mjs` contra el build de producción del commit publicado (`npm run build && npm start`, nunca `next dev`), servido en localhost: producción (https://valiu-challenge.vercel.app) no es alcanzable desde el entorno donde corre el script (el proxy rechaza el túnel a `vercel.app`); el código es el mismo.\n")
lineas.append("Reglas aplicadas: PNG con `deviceScaleFactor` 2 (plan B a 1); frames de `/tablero/alta` a zoom 1 (ventana de 2700 px para que el tablero no escale) y recortes al frame, al componente o a la columna principal, sin títulos, notas ni fondo del tablero; `document.fonts.ready` esperado y Montserrat verificada en cada página; sin barras de scroll (ocultas por CSS), sin foco visible, sin toasts y sin el control de demo. Desde C-47 el pago va en una ventana centrada (`ModalOperar`; desde C-56, a la derecha del menú, que en los frames de 1280 px lleva \"Tus cuentas\"): `d2-origen`, `d3-precio-token` y `d5-fecha-valor` la toman entera (920 × 596 px css), `d1-desglose` también (560 px css, una columna) y `d2-destino` del borde superior hasta Asia Packaging. Sus esquinas redondeadas (16 px css, 32 px en el PNG) quedaron transparentes con `scripts/esquinas.py`, las cuatro en las enteras y las dos de arriba en `d2-destino`: fuera de la ventana solo había fondo oscurecido del prototipo. El script también comprueba que en los frames 17 a 19 la tarjeta del recorrido esté junto a su objetivo y con el recorte (C-46), y que en el 19 el recorte rodee la tarjeta de tipo de cambio entera (C-53). Este README y `capturas-deck.zip` salen de `scripts/readme-capturas.py`, con las medidas reales de cada archivo.\n")
lineas.append(f"## Deck (los {len(DECK)} archivos de `capturas-deck.zip`)\n")
lineas.append("| # | Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |")
lineas.append("|---|---|---|---|---|---|")
for i, (f, que, de, slide) in enumerate(DECK, 1):
    lineas.append(f"| {i} | `{f}` | {que} | {de} | {slide} | {medidas(f)} |")
lineas.append("")
lineas.append("## Plan B (`plan-b/`, respaldo si falla la demo en vivo)\n")
lineas.append("Todos los frames de `/tablero/alta` a escala 1 y `deviceScaleFactor` 1, uno por archivo, con el id del frame como nombre; `Estados.png` es la hoja de estados de componentes (no es un frame de 1280 px). Van en la slide de respaldo de la demo.\n")
lineas.append("| Archivo | Frame | Medidas (px) |")
lineas.append("|---|---|---|")
ids = sys.argv[2].split(',') if len(sys.argv) > 2 else sorted(p.stem for p in (root / 'plan-b').glob('*.png'))
for fid in ids:
    f = f"plan-b/{fid}.png"
    if (root / f).exists():
        lineas.append(f"| `{f}` | {fid} | {medidas(f)} |")
lineas.append("")
(root / 'README.md').write_text("\n".join(lineas) + "\n")

zip_path = root.parent / 'capturas-deck.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for f, *_ in DECK:
        z.write(root / f, f)
print('README escrito con', len(DECK), 'del deck y', len(ids), 'del plan B;', zip_path.name, 'con', len(DECK), 'archivos')
