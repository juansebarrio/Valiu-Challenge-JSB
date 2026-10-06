import type { FC, MouseEvent } from 'react';

/** Pie de la app (footer 40): la misma línea en el shell y en la pantalla inicial. */
export const PieApp: FC<{ onNoDisponible?: () => void }> = ({ onNoDisponible }) => {
  const noDisponible = (e: MouseEvent) => { e.preventDefault(); onNoDisponible?.(); };
  return (
    <footer className="flex h-(--app-footer-h) shrink-0 items-center justify-center gap-4 whitespace-nowrap border-app-divider px-8 text-caption text-app-ink-2 hairline-t">
      Las operaciones bancarias serán realizadas por Banco BASE
      <span className="text-app-ink-disabled">·</span>
      <a href="#" onClick={noDisponible} className="text-app-ink-2 hover:text-app-primary">Términos y condiciones</a>
      <span className="text-app-ink-disabled">·</span>
      <a href="#" onClick={noDisponible} className="text-app-ink-2 hover:text-app-primary">Aviso de privacidad</a>
    </footer>
  );
};
