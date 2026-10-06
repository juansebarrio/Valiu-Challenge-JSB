import type { FC } from 'react';
import { ANCHO_MINIMO } from '@/data/escenario';

/** Solo escritorio: con menos de 1200 px de ancho se tapa el prototipo con un aviso. */
export const AvisoPantalla: FC = () => (
  <div role="alert" className="fixed inset-0 z-[70] hidden items-center justify-center bg-app-canvas p-8 text-center max-min:flex">
    <p className="max-w-md text-pretty text-h3 font-semibold">Abre el prototipo en una pantalla de al menos {ANCHO_MINIMO} px.</p>
  </div>
);
