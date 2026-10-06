// Capturas para la presentación del challenge: frames de /tablero/alta a escala 1 (zoom 1), recortadas al frame o al componente.
// Uso: node presentacion.mjs <dir-salida> [base-url]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
const base = process.argv[3] ?? 'http://127.0.0.1:3000';
fs.mkdirSync(path.join(out, 'plan-b'), { recursive: true });
const browser = await chromium.launch();
const log = [];
const CSS = '*::-webkit-scrollbar{display:none!important} *{scrollbar-width:none!important}';

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

/** Captura un frame del tablero (o un componente dentro de él) a zoom 1. */
async function frame(page, id, archivo, selectorInterno) {
  const sec = page.locator(`section#frame-${id}`);
  if (!(await sec.count())) throw new Error(`no existe el frame ${id}`);
  const zoom = await sec.locator('[style*="zoom"]').first().evaluate((el) => getComputedStyle(el).zoom);
  if (String(zoom) !== '1') throw new Error(`frame ${id} con zoom ${zoom}`);
  // Sin selector interno se captura la raíz del frame (el shell de 1280 px), no la columna del tablero que lo contiene.
  const target = selectorInterno ? sec.locator(selectorInterno).first() : sec.locator('[data-shell="frame"]').first();
  if (!(await target.count())) throw new Error(`frame ${id}: no se encontró ${selectorInterno}`);
  await sinFoco(page);
  await target.screenshot({ path: path.join(out, archivo), animations: 'disabled', caret: 'hide' });
  log.push(`ok ${archivo} ← frame ${id}${selectorInterno ? ' · ' + selectorInterno : ''}`);
}

// ------------------------------------------------------------------ tablero a zoom 1, deviceScaleFactor 2
{
  const { ctx, page } = await contexto(2700, 1600, 2);
  await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.waitForTimeout(500);
  await frame(page, '01', 'inicio-importadora.png');
  await frame(page, 'S02', 'turismo-cobro.png');
  await frame(page, '01', 'd1-posicion-usd.png', '[data-component="TarjetaPosicion"][aria-label="Posición en dólares"]');
  await frame(page, '02', 'd2-origen.png', '[data-component="PanelOperar"]');
  await frame(page, '04', 'd3-precio-token.png', '[data-component="PanelOperar"]');
  await frame(page, '08', 'd4-operar-clasico.png');
  await frame(page, '17', 'd4-recorrido.png');
  await frame(page, '03B', 'd5-fecha-valor.png', '[data-component="FechaLiquidacion"]');
  await frame(page, '07B', 'd5-pactada-inicio.png');
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
  await page.locator('[data-component="PanelOperar"]').screenshot({ path: path.join(out, 'd2-destino.png'), animations: 'disabled', caret: 'hide' });
  log.push('ok d2-destino.png ← /importadora?congelar=1&recorrido=0 · Pagar del encabezado · PanelOperar');
  await ctx.close();
}

// ------------------------------------------------------------------ tablero completo: 3000 px de ancho (1500 × dsf 2)
{
  const { ctx, page } = await contexto(1500, 1000, 2);
  await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.waitForTimeout(800);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  log.push(`tablero completo: ${alto} px css de alto a 1500 px`);
  await sinFoco(page);
  await page.screenshot({ path: path.join(out, 'tablero-completo.png'), fullPage: true, animations: 'disabled', caret: 'hide' });
  log.push('ok tablero-completo.png ← /tablero/alta entero');
  await ctx.close();
}

// ------------------------------------------------------------------ plan B: todos los frames a zoom 1 y deviceScaleFactor 1
{
  const { ctx, page } = await contexto(2700, 1600, 1);
  await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
  await preparar(page);
  await page.waitForTimeout(500);
  const ids = await page.locator('section[id^="frame-"]').evaluateAll((els) => els.map((e) => e.id.replace(/^frame-/, '')));
  for (const id of ids) await frame(page, id, path.join('plan-b', `${id}.png`));
  const estados = page.locator('section[aria-label="Estados · fecha valor"] .shadow-md').first(); // la hoja de estados no tiene shell: su caja es el bloque blanco
  if (await estados.count()) {
    await estados.screenshot({ path: path.join(out, 'plan-b', 'Estados.png'), animations: 'disabled', caret: 'hide' });
    log.push('ok plan-b/Estados.png ← hoja de estados');
  }
  log.push(`plan B: ${ids.length} frames (${ids.join(' ')})`);
  await ctx.close();
}

await browser.close();
console.log(log.join('\n'));
