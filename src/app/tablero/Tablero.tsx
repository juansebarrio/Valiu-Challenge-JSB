'use client';
import { useRef, type FC } from 'react';
import Link from 'next/link';
import { FILAS_TABLERO, type Frame } from '@/state/frames';
import { HomeVista } from '@/components/HomeVista';
import { Escalado } from '@/components/Escalado';

const noop = () => {};

const FrameEstatico: FC<{ frame: Frame }> = ({ frame }) => {
  const raizRef = useRef<HTMLDivElement>(null);
  return (
    <section id={`frame-${frame.n}`} aria-label={`${frame.n} · ${frame.titulo}`} className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 rounded-xs bg-app-ink px-2 py-0.5 text-caption font-bold text-app-on-primary">{frame.n}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-semibold">{frame.titulo}</span>
          {frame.nota ? <span className="max-w-[1100px] text-pretty text-caption text-app-ink-2">{frame.nota}</span> : null}
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

/** Los frames del handoff, uno por estado del reducer (src/state/frames.ts), escalados al ancho disponible. */
export const Tablero: FC = () => (
  <div className="flex min-h-dvh flex-col bg-app-canvas">
    <header className="flex flex-wrap items-center gap-6 border-b border-app-ink-disabled bg-app-surface px-6 py-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-bold">Valiu · Flujo principal · Tablero</span>
        <span className="text-caption text-app-ink-2">Flujo principal (01–07) y fecha valor (03B–07B) · Operar clásico (08–16) · Onboarding (17–20) · frames de 1280 px generados desde el estado de la app</span>
      </div>
      <nav className="ml-auto flex gap-4 text-caption font-semibold">
        <Link href="/" className="text-app-primary underline">App</Link>
        <Link href="/sistema" className="text-app-primary underline">Sistema</Link>
      </nav>
    </header>
    <div className="flex flex-col gap-10 p-8">
      {FILAS_TABLERO.map((fila) => (
        <div key={fila.titulo} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-h2 font-bold">{fila.titulo}</h2>
            <span className="text-caption text-app-ink-2">{fila.nota}</span>
          </div>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {fila.frames.map((f) => <FrameEstatico key={f.n} frame={f} />)}
          </div>
        </div>
      ))}
    </div>
  </div>
);
