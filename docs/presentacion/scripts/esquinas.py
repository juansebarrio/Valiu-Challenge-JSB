"""Deja transparentes las esquinas redondeadas de una captura de la ventana de pago (fuera de la ventana solo hay fondo oscurecido).
Uso: python3 esquinas.py <dir> <radio-px> <archivo.png>[=todas|arriba] [más archivos]
Por defecto las cuatro esquinas; "=arriba" solo las dos de arriba (recortes que cortan la ventana por debajo).
La máscara se dibuja a 4× y se reduce, para que el borde quede suavizado.
"""
import sys, pathlib
from PIL import Image, ImageDraw

root = pathlib.Path(sys.argv[1])
r = int(sys.argv[2])
K = 4
for arg in sys.argv[3:]:
    name, _, cuales = arg.partition('=')
    cuales = cuales or 'todas'
    p = root / name
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    mask = Image.new('L', (w * K, h * K), 255)
    d = ImageDraw.Draw(mask)
    R = r * K
    esquinas = [(0, 0, 180), (w * K - 2 * R, 0, 270)]
    if cuales == 'todas':
        esquinas += [(0, h * K - 2 * R, 90), (w * K - 2 * R, h * K - 2 * R, 0)]
    for x, y, inicio in esquinas:
        # cuadrado de la esquina en negro y el cuarto de círculo en blanco
        cx = x if inicio in (180, 90) else x + R
        cy = y if inicio in (180, 270) else y + R
        d.rectangle((cx, cy, cx + R - 1, cy + R - 1), fill=0)
        d.pieslice((x, y, x + 2 * R - 1, y + 2 * R - 1), inicio, inicio + 90, fill=255)
    alfa = mask.resize((w, h), Image.LANCZOS)
    im.putalpha(alfa)
    im.save(p)
    print(f"esquinas transparentes ({cuales}): {name} ({w} × {h})")
