"""Deja transparente la esquina superior izquierda redondeada de una captura del PanelOperar (fuera del panel solo hay fondo oscurecido).
Uso: python3 esquinas.py <dir> <radio-px> <archivo.png> [más archivos]
"""
import sys, pathlib
from PIL import Image, ImageDraw

root = pathlib.Path(sys.argv[1])
r = int(sys.argv[2])
for name in sys.argv[3:]:
    p = root / name
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    mask = Image.new('L', (w, h), 255)
    d = ImageDraw.Draw(mask)
    d.rectangle((0, 0, r, r), fill=0)
    d.pieslice((0, 0, 2 * r, 2 * r), 180, 270, fill=255)
    im.putalpha(mask)
    im.save(p)
    print(f"esquina transparente: {name} ({w} × {h})")
