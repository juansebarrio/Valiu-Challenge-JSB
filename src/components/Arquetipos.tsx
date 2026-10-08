'use client';
import { useEffect, useState, type FC } from 'react';
import Link from 'next/link';
import { AVISO_FUERA_DEL_PROTOTIPO } from '@/data/escenario';
import { vistaArquetipos } from '@/state/vistas';
import { Logo } from './ui/Logo';
import { PieApp } from './ui/PieApp';
import { Toast } from './ui/Toast';
import { clasesBoton } from './ui/Boton';

const TOAST_MS = 2500;

/**
 * Pantalla inicial (ruta /): elegir con qué empresa de ejemplo se entra, tipo login de demo sin contraseña.
 * Fondo de app, logo centrado, dos tarjetas de 360 px (apiladas bajo 800 px); Tab recorre los CTA y Enter entra.
 */
export const Arquetipos: FC = () => {
  const tarjetas = vistaArquetipos();
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);
  return (
    <div data-component="Arquetipos" className="flex min-h-dvh flex-col bg-app-canvas text-app-ink">
      <main className="flex flex-1 flex-col items-center gap-8 px-8 pb-10 pt-12">
        <Logo />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-h1 font-bold">¿Con quién entras?</h1>
          <p className="text-body text-app-ink-2">Dos empresas de ejemplo, dos semanas de pagos.</p>
        </div>
        <ul className="grid w-full max-w-(--app-arquetipos-w) grid-cols-2 gap-6 max-stack:max-w-(--app-arquetipo-w) max-stack:grid-cols-1" aria-label="Empresas de ejemplo">
          {tarjetas.map((t) => (
            <li key={t.id} className="flex min-w-0">
              <article aria-labelledby={`arquetipo-${t.id}`} className="flex w-full min-w-0 flex-col gap-3 rounded-sm bg-app-surface p-6 shadow-mid">
                <span aria-hidden className="flex size-(--app-avatar) items-center justify-center rounded-full bg-app-accent-bg text-body font-semibold text-app-primary">{t.iniciales}</span>
                <h2 id={`arquetipo-${t.id}`} className="text-h3 font-semibold">{t.empresa}</h2>
                <span className="text-body text-app-ink-2">{t.persona}</span>
                <ul className="flex flex-col gap-1.5">
                  {t.contexto.map((linea) => (
                    <li key={linea} className="flex items-start gap-2.5 text-body tabular-nums">
                      <span aria-hidden className="mt-2 size-(--app-dot-sm) shrink-0 rounded-full bg-app-ink-3" />
                      <span className="text-pretty">{linea}</span>
                    </li>
                  ))}
                </ul>
                <Link href={t.href} className={clasesBoton('primary', 'large', 'mt-auto w-full')}>{t.cta}</Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <PieApp onNoDisponible={() => setToast(AVISO_FUERA_DEL_PROTOTIPO)} />
      <Toast texto={toast} />
    </div>
  );
};
