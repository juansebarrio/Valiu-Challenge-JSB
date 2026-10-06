import type { Metadata } from 'next';
import { Tablero } from './Tablero';

export const metadata: Metadata = { title: 'Valiu · Tablero de frames', description: 'Los 24 frames del flujo principal, generados desde el mismo estado que la app.' };

export default function Pagina() {
  return <Tablero />;
}
