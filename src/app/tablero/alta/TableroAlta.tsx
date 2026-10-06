'use client';
import { useMemo, useRef, type FC } from 'react';
import Link from 'next/link';
import { filasTablero, type Frame } from '@/state/escenarios';
import { HomeVista } from '@/components/HomeVista';
import { Escalado } from '@/components/Escalado';
import { HojaEstados } from '@/components/HojaEstados';

const noop = () => {};

const FrameEstatico: FC<{ frame: Frame }> = ({ frame }) => {
  const raizRef = useRef<HTMLDivElement>(null);
  return (
    <section id={`frame-${frame.n}`} aria-label={`${frame.n} · ${frame.titulo}`} className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 rounded-xs bg-app-ink px-2 py-0.5 text-caption font-bold text-app-on-primary">{frame.n}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-semibold">{frame.titulo}</span>
          {frame.nota ? <span className="max-w-(--app-frame-w) text-pretty text-caption text-app-ink-2">{frame.nota}</span> : null}
        </div>
      </div>
      <Escalado ancho={1280} className="w-full">
        <div className="shadow-md">
          <HomeVista estado={frame.estado} dispatch={noop} modo="frame" raizRef={raizRef} />
        </div>
      </Escalado>
    </section>
  );
};

/** Los frames del handoff en estados fijos del mismo reducer (src/state/escenarios.ts), a 1280 px y escalados al ancho disponible. */
export const TableroAlta: FC = () => {
  const filas = useMemo(() => filasTablero(), []);
  return (
    <div className="flex min-h-dvh flex-col bg-app-canvas">
      <header className="flex flex-wrap items-center gap-6 border-b border-app-ink-disabled bg-app-surface px-6 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-bold">Valiu · Tablero (alta)</span>
          <span className="text-caption text-app-ink-2">01–07 · fecha valor 03B–07B · Estados · Operar clásico 08–16 · Movimientos D1–D5 y A1–A4 · Turismo S01–S08 · Onboarding 17–20 · frames de 1280 px generados desde el estado del prototipo, sin capturas</span>
        </div>
        <nav className="ml-auto flex gap-4">
          <Link href="/" className="text-caption font-semibold text-app-ink underline hover:text-app-primary">Prototipo</Link>
          <Link href="/sistema" className="text-caption font-semibold text-app-ink underline hover:text-app-primary">Sistema</Link>
        </nav>
      </header>
      <div className="flex flex-col gap-10 p-8">
        {filas.map((fila) => (
          <div key={fila.titulo} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-h2 font-bold">{fila.titulo}</h2>
              <span className="text-caption text-app-ink-2">{fila.nota}</span>
            </div>
            {fila.conHojaDeEstados ? (
              <section aria-label="Estados · fecha valor" className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 rounded-xs bg-app-ink px-2 py-0.5 text-caption font-bold text-app-on-primary">Estados</span>
                  <div className="flex flex-col gap-0.5"><span className="text-body font-semibold">Estados de componentes · fuera del escenario</span><span className="text-caption text-app-ink-2">FechaLiquidacion, OpcionOrigen cuando hoy no alcanza y TarjetaPosicion con una pactada sin saldo</span></div>
                </div>
                <div className="rounded-sm bg-app-surface p-6 shadow-md"><HojaEstados /></div>
              </section>
            ) : null}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {fila.frames.map((f) => <FrameEstatico key={f.n} frame={f} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
