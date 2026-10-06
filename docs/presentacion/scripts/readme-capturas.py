"""Genera docs/presentacion/capturas/README.md con las medidas reales de cada PNG y arma docs/presentacion/capturas-deck.zip con los diez del deck.
Uso: python3 readme-capturas.py <dir-capturas> <ids-del-tablero-separados-por-coma>
"""
import sys, pathlib, zipfile
from PIL import Image

root = pathlib.Path(sys.argv[1])

def medidas(rel):
    with Image.open(root / rel) as im:
        return f"{im.width} × {im.height}"

DECK = [
    ("inicio-importadora.png", "Inicio de la importadora: posición por divisa con el faltante de 1,000.00 USD, Lo nuevo (+180,000.00 MXN), Movimientos y el tipo de cambio (USD/MXN 18.091183 / 18.032135, EUR/MXN 21.250000 / 21.100000).", "Frame 01 de `/tablero/alta`, entero", "Deck · inicio"),
    ("turismo-cobro.png", "Inicio de la minorista de turismo con el panel \"¿Qué pagas con este cobro?\" sobre el cobro de 95,000.00 MXN de Familia Ortega; el hotel (4,200.00 EUR) preseleccionado.", "Frame S02 de `/tablero/alta`, entero", "Deck · turismo"),
    ("d1-posicion.png", "Sección Posición por divisa: título y las tres tarjetas (USD faltan 1,000.00 con la proyección, MXN sobran 1,099,649.50, EUR sin pendientes).", "Frame 01 · `[data-tour=\"posicion\"]` con 16 px de aire", "Decisión 1 · posición por divisa"),
    ("d2-destino.png", "PanelOperar en el paso Destino, \"¿A quién le pagas?\": encabezado, buscador y los tres pagos en USD (Shenzhen, Logística Pacífico, Asia Packaging).", "`/importadora?congelar=1&recorrido=0` a 1440 × 900, \"Pagar\" del encabezado; del borde superior del panel a 8 px bajo la fila de Asia Packaging", "Decisión 2 · destino y origen"),
    ("d2-origen.png", "PanelOperar en el paso Origen con las tres cuentas y sus consecuencias: MXN ≈ 27,136.77 (cubre el faltante), USD 1,500.00 sin tipo de cambio (te faltarían 1,000.00 el vie 9), EUR ≈ 1,280.96.", "Frame 02 · PanelOperar, del borde superior a 32 px bajo la Cuenta EUR", "Decisión 2 · destino y origen"),
    ("d3-precio-token.png", "Precio ejecutable 18.092415 MXN por USD fijo por 2:00, Pagas 27,138.62 MXN y las seis casillas del token.", "Frame 04 · PanelOperar, del borde superior a 32 px bajo el token", "Decisión 3 · precio y token"),
    ("d4-recorrido.png", "Onboarding, paso 4 de 4 (\"¿Prefieres operar como siempre?\") con el recorte sobre la pestaña Operar clásico y la tarjeta debajo.", "Frame 20 · columna principal (del sidebar al borde derecho), del borde superior a 24 px bajo la tarjeta", "Decisión 4 · clásico y recorrido"),
    ("d4-operar-clasico.png", "Pestaña Operar clásico con el aviso de la vista anterior, \"Probar el nuevo flujo\" y la fila Comprar / Vender / Transferir.", "Frame 08 · columna principal, del borde superior a 8 px bajo las pestañas", "Decisión 4 · clásico y recorrido"),
    ("d5-fecha-valor.png", "Bloque FechaLiquidacion \"¿Cuándo sale el dinero?\" con \"jue 8 · vence\" elegido.", "Frame 03B · `[data-component=\"FechaLiquidacion\"]`", "Decisión 5 · fecha valor"),
    ("d5-pactada-inicio.png", "Inicio con el pago pactado: aviso \"Pactaste el pago…\", MXN con \"Pactadas por liquidar (1) −27,138.62\" y USD con sobran 500.00.", "Frame 07B · columna principal, del borde superior a 16 px bajo Posición por divisa", "Decisión 5 · fecha valor"),
]

lineas = []
lineas.append("# Capturas para la presentación del challenge\n")
lineas.append("Generadas con Playwright (Chromium) con `scripts/presentacion.mjs` contra el build de producción del commit publicado (`npm run build && npm start`, nunca `next dev`), servido en localhost: producción (https://valiu-challenge.vercel.app) no es alcanzable desde el entorno donde corre el script (el proxy rechaza el túnel a `vercel.app`); el código es el mismo.\n")
lineas.append("Reglas aplicadas: PNG con `deviceScaleFactor` 2 (plan B a 1); frames de `/tablero/alta` a zoom 1 (ventana de 2700 px para que el tablero no escale) y recortes al frame, al componente o a la columna principal, sin títulos, notas ni fondo del tablero; `document.fonts.ready` esperado y Montserrat verificada en cada página; sin barras de scroll (ocultas por CSS), sin foco visible, sin toasts y sin el control de demo. En las tres capturas del panel (`d2-destino`, `d2-origen`, `d3-precio-token`) la esquina superior izquierda redondeada quedó transparente (`scripts/esquinas.py`): fuera del panel solo había fondo oscurecido del prototipo. El script también comprueba que en los frames 17 a 20 la tarjeta del recorrido esté junto a su objetivo y con el recorte (C-46). Este README y `capturas-deck.zip` salen de `scripts/readme-capturas.py`, con las medidas reales de cada archivo.\n")
lineas.append("## Deck (los diez archivos de `capturas-deck.zip`)\n")
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
