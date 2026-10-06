import type { FC } from 'react';

/** Puntos de una polilínea (escalonada o no) sobre un viewBox w×h con padding 4 (mismo cálculo que el prototipo). */
export function serieAPuntos(vals: number[], w: number, h: number, desdeCero: boolean, escalonado: boolean) {
  const pad = 4;
  const mn = desdeCero ? Math.min(0, ...vals) : Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, vals.length - 1);
  const y = (v: number) => h - pad - ((v - mn) / rng) * (h - 2 * pad);
  const pts: [number, number][] = [];
  vals.forEach((v, i) => {
    pts.push([x(i), y(v)]);
    if (escalonado && i < vals.length - 1) pts.push([x(i + 1), y(v)]);
  });
  const neg = vals.findIndex((v) => v < 0);
  return {
    puntos: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '),
    ceroY: y(0),
    tieneCero: mn < 0,
    marca: neg >= 0 ? { x: x(neg), y: y(vals[neg]), i: neg } : null,
  };
}

const W = 269;
const H = 48;

/** Proyección escalonada de la semana (TarjetaPosicion): línea de cero punteada y marcador rojo el día que cruza. */
export const ProyeccionSemana: FC<{ serie: number[]; etiquetas: string[]; titulo: string }> = ({ serie, etiquetas, titulo }) => {
  const g = serieAPuntos(serie, W, H, true, true);
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={titulo} className="block h-(--app-spark-h) w-full overflow-visible">
        {g.tieneCero ? (
          <>
            <line x1={14} y1={g.ceroY} x2={W} y2={g.ceroY} className="stroke-app-ink-disabled" strokeWidth={1} strokeDasharray="3 3" />
            <text x={0} y={g.ceroY + 3.5} fontSize="var(--app-fs-spark)" fontWeight={600} className="fill-app-ink-2">0</text>
          </>
        ) : null}
        <polyline points={g.puntos} fill="none" className="stroke-app-chart" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {g.marca ? <circle cx={g.marca.x} cy={g.marca.y} r={4} className="fill-app-danger" /> : null}
      </svg>
      <div className="flex justify-between text-caption text-app-ink-2">
        {etiquetas.map((e, i) => (
          <span key={e} className={g.marca && g.marca.i === i ? 'font-semibold text-app-danger' : ''}>{e}</span>
        ))}
      </div>
    </div>
  );
};

/** Tendencia intradía del tipo de cambio (TarjetaTipoDeCambio). */
export const TendenciaDia: FC<{ serie: number[]; titulo: string }> = ({ serie, titulo }) => {
  const g = serieAPuntos(serie, 288, 36, false, false);
  return (
    <svg viewBox="0 0 288 36" width="100%" height={36} preserveAspectRatio="none" role="img" aria-label={titulo} className="block h-(--app-trend-h) w-full overflow-visible">
      <polyline points={g.puntos} fill="none" className="stroke-app-chart" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
