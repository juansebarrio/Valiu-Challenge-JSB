import type { Metadata } from 'next';
import { TableroAlta } from './TableroAlta';

export const metadata: Metadata = { title: 'Valiu · Tablero · alta', description: 'Frames 01–07, 03B–07B, Estados, 08–16 y 17–20 a 1280 px, renderizados con los mismos componentes del prototipo.' };

export default function Pagina() {
  return <TableroAlta />;
}
