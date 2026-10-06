// Extra opcional: el tablero entero reflowado a 6 columnas para que entre en una slide (3000 px de ancho = 1500 × dsf 2).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2]; const base = process.argv[3] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(base + '/tablero/alta', { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '*::-webkit-scrollbar{display:none!important} *{scrollbar-width:none!important} .grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}' });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(800);
console.log('alto css', await page.evaluate(() => document.documentElement.scrollHeight));
await page.screenshot({ path: `${out}/tablero-completo-compacto.png`, fullPage: true, animations: 'disabled', caret: 'hide' });
await browser.close();
