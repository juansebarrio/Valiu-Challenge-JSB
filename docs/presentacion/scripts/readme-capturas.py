"""Genera docs/presentacion/capturas/README.md con las medidas reales de cada PNG. Uso: python3 readme-capturas.py <dir-capturas>"""
import sys, pathlib
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
root = pathlib.Path(sys.argv[1])

def medidas(rel):
    with Image.open(root / rel) as im:
        return f"{im.width} × {im.height}"

DECK = [
    ("inicio-importadora.png", "Inicio de la importadora: posición por divisa con el faltante de 1,000.00 USD, Lo nuevo (+180,000.00 MXN) y Movimientos.", "Frame 01 de `/tablero/alta`", "Deck · inicio"),
    ("turismo-cobro.png", "Inicio de la minorista de turismo con el panel \"¿Qué pagas con este cobro?\" sobre el cobro de 95,000.00 MXN de Familia Ortega; el hotel (4,200.00 EUR) preseleccionado.", "Frame S02 de `/tablero/alta`", "Deck · turismo"),
    ("d1-posicion-usd.png", "TarjetaPosicion de USD: saldo 2,000.00, pagos futuros −3,000.00, faltan 1,000.00, proyección de la semana y \"Comprar 1,000 USD\".", "Frame 01 · `[data-component=\"TarjetaPosicion\"]` de dólares", "Decisión 1 · posición por divisa"),
    ("d2-destino.png", "PanelOperar en el paso Destino, \"¿A quién le pagas?\": buscador y grupos Pagos próximos, Tus cuentas y Destinatarios.", "`/importadora?congelar=1&recorrido=0` a 1440 × 900, \"Pagar\" del encabezado (no hay frame)", "Decisión 2 · destino y origen"),
    ("d2-origen.png", "PanelOperar en el paso Origen con las tres cuentas y sus consecuencias: MXN ≈ 27,136.77 (cubre el faltante), USD 1,500.00 sin tipo de cambio (te faltarían 1,000.00 el vie 9), EUR ≈ 1,280.96.", "Frame 02 · `[data-component=\"PanelOperar\"]`", "Decisión 2 · destino y origen"),
    ("d3-precio-token.png", "PanelOperar con el precio ejecutable 18.092415 MXN por USD fijo por 2:00, Pagas 27,138.62 MXN y el token de 6 dígitos.", "Frame 04 · `[data-component=\"PanelOperar\"]`", "Decisión 3 · precio y token"),
    ("d4-operar-clasico.png", "Pestaña Operar clásico vacía, con el aviso de la vista anterior y \"Probar el nuevo flujo\".", "Frame 08 de `/tablero/alta`", "Decisión 4 · clásico y recorrido"),
    ("d4-recorrido.png", "Onboarding, paso 1 de 4 (\"Tu posición por divisa, de un vistazo\") sobre el inicio.", "Frame 17 de `/tablero/alta`", "Decisión 4 · clásico y recorrido"),
    ("d5-fecha-valor.png", "Bloque FechaLiquidacion \"¿Cuándo sale el dinero?\" con \"jue 8 · vence\" elegido.", "Frame 03B · `[data-component=\"FechaLiquidacion\"]`", "Decisión 5 · fecha valor"),
    ("d5-pactada-inicio.png", "Inicio con el pago pactado: aviso, MXN con \"Pactadas por liquidar (1) −27,138.62\", Shenzhen con badge Pactada.", "Frame 07B de `/tablero/alta`", "Decisión 5 · fecha valor"),
    ("tablero-completo.png", "`/tablero/alta` entero en una sola imagen, con el layout del tablero (dos columnas).", "`/tablero/alta` a 1500 px de ancho, página completa", "Qué hice"),
]
EXTRA = [
    ("tablero-completo-compacto.png", "Extra opcional, no está en el zip: el mismo tablero reflowado a seis columnas para que entre en una slide.", "`/tablero/alta` a 1500 px de ancho con la grilla forzada a 6 columnas", "Qué hice (alternativa)"),
]

lineas = []
lineas.append("# Capturas para la presentación del challenge\n")
lineas.append("Generadas con Playwright (Chromium) contra el commit `0154d41` servido en localhost con `npm run build && npm start`, porque producción (https://valiu-challenge.vercel.app) no es alcanzable desde el entorno donde corrió el script (el proxy rechaza el túnel a `vercel.app`). El código es el mismo que está publicado en ese commit.\n")
lineas.append("Reglas aplicadas: PNG con `deviceScaleFactor` 2 (plan B a 1); frames de `/tablero/alta` capturados a zoom 1 (ventana de 2700 px para que el tablero no escale) y recortados a la raíz del frame o al componente (`data-component`), sin títulos, notas ni fondo del tablero; `document.fonts.ready` esperado y Montserrat verificada en cada página; sin barras de scroll (ocultas por CSS), sin foco visible, sin toasts y sin el control de demo. En las tres capturas del panel (`d2-destino`, `d2-origen`, `d3-precio-token`) las dos esquinas redondeadas de la izquierda quedaron transparentes: fuera del panel solo había fondo oscurecido del prototipo. Script: `presentacion.mjs` (Playwright) y este README se generan desde el repo de trabajo; las medidas de abajo son las reales de cada archivo.\n")
lineas.append("## Deck (archivos 1 a 11, en `capturas-deck.zip`)\n")
lineas.append("| # | Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |")
lineas.append("|---|---|---|---|---|---|")
for i, (f, que, de, slide) in enumerate(DECK, 1):
    lineas.append(f"| {i} | `{f}` | {que} | {de} | {slide} | {medidas(f)} |")
lineas.append("")
lineas.append("## Extra\n")
lineas.append("| Archivo | Qué muestra | De dónde sale | Slide | Medidas (px) |")
lineas.append("|---|---|---|---|---|")
for f, que, de, slide in EXTRA:
    lineas.append(f"| `{f}` | {que} | {de} | {slide} | {medidas(f)} |")
lineas.append("")
lineas.append("## Plan B (`plan-b/`, respaldo si falla la demo en vivo)\n")
lineas.append("Todos los frames de `/tablero/alta` a escala 1 y `deviceScaleFactor` 1, uno por archivo, con el id del frame como nombre; `Estados.png` es la hoja de estados de componentes (no es un frame de 1280 px). Van en la slide de respaldo de la demo.\n")
lineas.append("| Archivo | Frame | Medidas (px) |")
lineas.append("|---|---|---|")
orden = {}
# orden del tablero: el que devuelve filasTablero (ids tal como aparecen en la página)
ids = sys.argv[2].split(',') if len(sys.argv) > 2 else sorted(p.stem for p in (root / 'plan-b').glob('*.png'))
for fid in ids:
    f = f"plan-b/{fid}.png"
    if (root / f).exists():
        lineas.append(f"| `{f}` | {fid} | {medidas(f)} |")
lineas.append("")
(root / 'README.md').write_text("\n".join(lineas) + "\n")
print('README escrito con', len(DECK), 'del deck,', len(EXTRA), 'extra y', len(ids), 'del plan B')
