import type { Metadata } from 'next';
import { TableroAlta } from './TableroAlta';

export const metadata: Metadata = { title: 'Valiu · Tablero · alta', description: 'Frames 01–07, 03B–07B, Estados, C1–C4, O1–O4, G1, D1–D3, A1–A4, S01–S08, N4–N6 y 17–19 a 1280 px, renderizados con los mismos componentes del prototipo.' };

export default function Pagina() {
  return <TableroAlta />;
}
