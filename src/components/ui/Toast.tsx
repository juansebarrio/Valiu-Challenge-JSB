import type { FC } from 'react';

/** Aviso breve al pie ("Esta sección no está en el prototipo."). Se cierra solo a los 2.5 s. */
export const Toast: FC<{ texto: string | null }> = ({ texto }) => (
  <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
    {texto ? <span className="rounded-sm bg-app-ink px-4 py-2.5 text-body font-medium text-app-on-primary shadow-lg">{texto}</span> : null}
  </div>
);
