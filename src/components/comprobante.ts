// src/components/comprobante.ts — descarga de un comprobante como archivo HTML (sin servidor: lo arma el navegador).
import type { FilaDetalle } from './ui/ListaDetalle';

const escapar = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

/** Genera el HTML del comprobante: título, subtítulo y las mismas filas que muestra el detalle. */
export function htmlComprobante(args: { titulo: string; sub: string; empresa: string; filas: FilaDetalle[]; nota?: string | null }): string {
  const filas = args.filas.map((f) => `<tr><th>${escapar(f.k)}</th><td>${escapar(f.v)}</td></tr>`).join('');
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>${escapar(args.titulo)} · Valiu</title>
<style>body{font-family:Montserrat,Helvetica,Arial,sans-serif;color:#151522;margin:40px;max-width:640px}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:#5B5B64}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px 0;border-bottom:1px solid #E2E4E9;font-size:14px;vertical-align:top}th{font-weight:400;color:#5B5B64;width:40%}td{font-weight:600;font-variant-numeric:tabular-nums}small{display:block;margin-top:16px;color:#5B5B64}</style></head>
<body><h1>${escapar(args.titulo)}</h1><p>${escapar(args.sub)} · ${escapar(args.empresa)}</p><table>${filas}</table>${args.nota ? `<small>${escapar(args.nota)}</small>` : ''}<small>Prototipo Valiu · comprobante de demostración, sin validez bancaria.</small></body></html>`;
}

/** Descarga el comprobante como archivo .html con el nombre indicado. */
export function descargarComprobante(nombre: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
