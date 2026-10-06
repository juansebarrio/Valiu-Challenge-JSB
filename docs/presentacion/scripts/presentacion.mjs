// Capturas para la presentación del challenge: frames de /tablero/alta a escala 1 (zoom 1) y deviceScaleFactor 2, recortadas al frame,
// al componente (data-component / data-tour) o a la columna principal; plan-b/ con todos los frames a deviceScaleFactor 1.
// Uso: node presentacion.mjs <dir-salida> [base-url]   (contra `npm run build && npm start`, nunca `next dev`)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const out = process.argv[2];
const base = process.argv[3] ?? 'http://127.0.0.1:3000';
const aqui = path.dirname(new URL(import.meta.url).pathname);
fs.mkdirSync(path.join(out, 'plan-b'), { recursive: true });
const browser = await chromium.launch();
const log = [];
const CSS = '*::-webkit-scrollbar{display:none!important} *{scrollbar-width:none!important}';
const SHOT = { animations: 'disabled', caret: 'hide' };

async function contexto(width, height, dsf) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem('valiu.onboarding.visto', '1'); } catch {} });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') log.push(`console error: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => log.push('pageerror: ' + String(e).slice(0, 200)));
  return { ctx, page };
}

/** Espera document.fonts.ready y exige que el cuerpo use Montserrat (familia de next/font) con la cara cargada. */
async function preparar(page) {
  await page.addStyleTag({ content: CSS });
  const fuente = await page.evaluate(async () => {
    await document.fonts.ready;
    const fam = getComputedStyle(document.body).fontFamily;
    const primera = fam.split(',')[0].trim().replace(/^["']|["']$/g, '');
    const caras = [...document.fonts].filter((f) => /montserrat/i.test(f.family));
    return { fam, primera, cargadas: caras.filter((f) => f.status === 'loaded').length, total: caras.length, check: document.fonts.check(`16px "${primera}"`) };
  });
  if (!/montserrat/i.test(fuente.fam) || fuente.cargadas === 0 || !fuente.check) throw new Error('Montserrat no se ve: ' + JSON.stringify(fuente));
  log.push(`fuente ok: ${fuente.primera} (${fuente.cargadas}/${fuente.total} caras cargadas)`);
}

const sinFoco = (page) => page.evaluate(() => { const a = document.activeElement; if (a && a !== document.body) a.blur(); return document.activeElement === document.body; });

/** Caja de un locator en coordenadas del viewport (css px). */
async function caja(loc, nombre) {
  if (!(await loc.count())) throw new Error(`no se encontró ${nombre}`);
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${nombre} no tiene caja`);
  return b;
}

/** Recorta un rectángulo del viewport. */
async function recortar(page, archivo, clip, origen) {
  if (clip.width <= 0 || clip.height <= 0) throw new Error(`${archivo}: recorte vacío`);
  await sinFoco(page);
  await page.screenshot({ path: path.join(out, archivo), clip, ...SHOT });
  log.push(`ok ${archivo} ← ${origen} · ${Math.round(clip.width)} × ${Math.round(clip.height)} css`);
}

/** Trae un frame del tablero al viewport (alto 2000: entra entero) y verifica que esté a zoom 1. */
async function frame(page, id) {
  const sec = page.locator(`section#frame-${id}`);
  if (!(await sec.count())) throw new Error(`no existe el frame ${id}`);
  const zoom = await sec.locator('[style*="zoom"]').first().evaluate((el) => getComputedStyle(el).zoom);
  if (String(zoom) !== '1') throw new Error(`frame ${id} con zoom ${zoom}`);
  const raiz = sec.locator('[data-shell="frame"]').first();
  await raiz.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(150);
  const f = await caja(raiz, `raíz del frame ${id}`);
  const aside = await caja(raiz.locator('aside'), `sidebar del frame ${id}`);
  // Columna principal: del borde derecho del sidebar al borde derecho del frame.
  const columna = { x: aside.x + aside.width, width: f.x + f.width - (aside.x + aside.width) };
  return { sec, raiz, f, columna };
}

async function frameEntero(page, id, archivo) {
  const { raiz } = await frame(page, id);
  await sinFoco(page);
  await raiz.screenshot({ path: path.join(out, archivo), ...SHOT });
  log.push(`ok ${archivo} ← frame ${id} entero`);
}

// ------------------------------------------------------------------ deck: tablero a zoom 1, deviceScaleFactor 2
{
  const { ctx, page } = await contexto(2700, 2000, 2);
  await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.waitForTimeout(600);

  await frameEntero(page, '01', 'inicio-importadora.png');
  await frameEntero(page, 'S02', 'turismo-cobro.png');

  // d1: sección Posición por divisa del frame 01 con 16 px de aire
  {
    const { sec } = await frame(page, '01');
    const s = await caja(sec.locator('[data-tour="posicion"]'), 'sección posición del frame 01');
    await recortar(page, 'd1-posicion.png', { x: s.x - 16, y: s.y - 16, width: s.width + 32, height: s.height + 32 }, 'frame 01 · [data-tour="posicion"] + 16 px');
  }
  // d2-origen: PanelOperar del frame 02 hasta 32 px debajo de la Cuenta EUR
  {
    const { sec } = await frame(page, '02');
    const p = await caja(sec.locator('[data-component="PanelOperar"]'), 'PanelOperar del frame 02');
    const eur = await caja(sec.getByRole('radio', { name: /Cuenta EUR/ }), 'Cuenta EUR del frame 02');
    await recortar(page, 'd2-origen.png', { x: p.x, y: p.y, width: p.width, height: eur.y + eur.height + 32 - p.y }, 'frame 02 · PanelOperar hasta Cuenta EUR + 32 px');
  }
  // d3: PanelOperar del frame 04 hasta 32 px debajo de las casillas del token
  {
    const { sec } = await frame(page, '04');
    const p = await caja(sec.locator('[data-component="PanelOperar"]'), 'PanelOperar del frame 04');
    const t = await caja(sec.locator('[data-component="CampoToken"]'), 'CampoToken del frame 04');
    await recortar(page, 'd3-precio-token.png', { x: p.x, y: p.y, width: p.width, height: t.y + t.height + 32 - p.y }, 'frame 04 · PanelOperar hasta el token + 32 px');
  }
  // d4-recorrido: frame 20, columna principal hasta 24 px debajo de la tarjeta del recorrido; exige el recorte sobre la pestaña
  {
    const { sec, f, columna } = await frame(page, '20');
    const c = await caja(sec.locator('[data-component="PasoOnboarding"]'), 'tarjeta del recorrido del frame 20');
    const pos = await sec.locator('[data-component="PasoOnboarding"]').evaluate((el) => `${el.style.left},${el.style.top}`);
    if (pos === '16px,16px') throw new Error('frame 20: la tarjeta del recorrido quedó en la posición de respaldo (16, 16)');
    const recorte = sec.locator('div[aria-hidden][style*="height"]');
    if (!(await recorte.count())) throw new Error('frame 20: no hay recorte sobre el objetivo');
    const r = await caja(recorte, 'recorte del frame 20');
    const tab = await caja(sec.getByRole('tab', { name: 'Operar clásico' }), 'pestaña Operar clásico del frame 20');
    if (!(r.x <= tab.x && r.y <= tab.y && r.x + r.width >= tab.x + tab.width && r.y + r.height >= tab.y + tab.height)) throw new Error('frame 20: el recorte no rodea la pestaña Operar clásico');
    if (c.y < tab.y + tab.height) throw new Error('frame 20: la tarjeta no queda debajo de la pestaña');
    log.push(`frame 20: recorte ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}×${Math.round(r.height)} rodea la pestaña; tarjeta en ${pos}`);
    await recortar(page, 'd4-recorrido.png', { x: columna.x, y: f.y, width: columna.width, height: c.y + c.height + 24 - f.y }, 'frame 20 · columna principal hasta la tarjeta + 24 px');
  }
  // d4-operar-clasico: frame 08, columna principal hasta 8 px debajo de Comprar / Vender / Transferir
  {
    const { sec, f, columna } = await frame(page, '08');
    const tab = await caja(sec.getByRole('tab', { name: 'Transferir' }), 'pestaña Transferir del frame 08');
    await recortar(page, 'd4-operar-clasico.png', { x: columna.x, y: f.y, width: columna.width, height: tab.y + tab.height + 8 - f.y }, 'frame 08 · columna principal hasta las pestañas + 8 px');
  }
  // d5-fecha-valor: bloque FechaLiquidacion del frame 03B
  {
    const { sec } = await frame(page, '03B');
    await sinFoco(page);
    await sec.locator('[data-component="FechaLiquidacion"]').first().screenshot({ path: path.join(out, 'd5-fecha-valor.png'), ...SHOT });
    log.push('ok d5-fecha-valor.png ← frame 03B · [data-component="FechaLiquidacion"]');
  }
  // d5-pactada-inicio: frame 07B, columna principal hasta 16 px debajo de Posición por divisa
  {
    const { sec, f, columna } = await frame(page, '07B');
    const s = await caja(sec.locator('[data-tour="posicion"]'), 'sección posición del frame 07B');
    await recortar(page, 'd5-pactada-inicio.png', { x: columna.x, y: f.y, width: columna.width, height: s.y + s.height + 16 - f.y }, 'frame 07B · columna principal hasta Posición por divisa + 16 px');
  }
  // Los frames 17–20 tienen que tener la tarjeta junto al objetivo (C-46)
  for (const id of ['17', '18', '19', '20']) {
    const { sec } = await frame(page, id);
    const pos = await sec.locator('[data-component="PasoOnboarding"]').evaluate((el) => `${el.style.left},${el.style.top}`);
    const conRecorte = await sec.locator('div[aria-hidden][style*="height"]').count();
    if (pos === '16px,16px' || !conRecorte) throw new Error(`frame ${id}: recorrido sin recorte o en la posición de respaldo (${pos})`);
    log.push(`frame ${id}: tarjeta en ${pos}, con recorte`);
  }
  await ctx.close();
}

// ------------------------------------------------------------------ d2-destino: no hay frame; prototipo en vivo a 1440 × 900
{
  const { ctx, page } = await contexto(1440, 900, 2);
  await page.goto(base + '/importadora?congelar=1&recorrido=0', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.getByRole('button', { name: 'Pagar', exact: true }).click();
  await page.getByText('¿A quién le pagas?').first().waitFor();
  await page.waitForTimeout(400);
  if (!(await sinFoco(page))) {
    await page.addStyleTag({ content: '*:focus,*:focus-visible{outline:none!important}' });
    log.push('d2-destino: el panel retiene el foco; se ocultó el anillo por CSS');
  }
  const toasts = await page.locator('[role="status"]:visible, [data-component="Toast"]:visible').filter({ hasText: /\S/ }).count();
  if (toasts) throw new Error('d2-destino: hay un toast visible');
  const p = await caja(page.locator('[data-component="PanelOperar"]'), 'PanelOperar en Destino');
  const asia = await caja(page.getByRole('option', { name: /Asia Packaging/ }), 'fila de Asia Packaging');
  await recortar(page, 'd2-destino.png', { x: p.x, y: p.y, width: p.width, height: asia.y + asia.height + 8 - p.y }, '/importadora?congelar=1&recorrido=0 · Pagar del encabezado · PanelOperar hasta Asia Packaging + 8 px');
  await ctx.close();
}

// ------------------------------------------------------------------ plan B: todos los frames a zoom 1 y deviceScaleFactor 1
{
  const { ctx, page } = await contexto(2700, 2000, 1);
  await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.waitForTimeout(600);
  const ids = await page.locator('section[id^="frame-"]').evaluateAll((els) => els.map((e) => e.id.replace(/^frame-/, '')));
  for (const id of ids) await frameEntero(page, id, path.join('plan-b', `${id}.png`));
  const estados = page.locator('section[aria-label="Estados · fecha valor"] .shadow-md').first(); // la hoja de estados no tiene shell: su caja es el bloque blanco
  if (await estados.count()) {
    await estados.screenshot({ path: path.join(out, 'plan-b', 'Estados.png'), ...SHOT });
    log.push('ok plan-b/Estados.png ← hoja de estados');
  }
  log.push(`plan B: ${ids.length} frames (${ids.join(' ')})`);
  await ctx.close();
}

await browser.close();

// Esquina superior izquierda del panel (rounded-l-lg = 16 px css → 32 px a dsf 2) transparente: fuera del panel solo hay fondo oscurecido.
const esquinas = spawnSync('python3', [path.join(aqui, 'esquinas.py'), out, '32', 'd2-destino.png', 'd2-origen.png', 'd3-precio-token.png'], { encoding: 'utf8' });
log.push((esquinas.stdout || '').trim() || `esquinas.py salió con ${esquinas.status}: ${esquinas.stderr}`);
if (esquinas.status !== 0) process.exitCode = 1;
console.log(log.join('\n'));
