import type { Metadata } from 'next';
import { Arquetipos } from '@/components/Arquetipos';

export const metadata: Metadata = { title: 'Valiu · ¿Con quién entras?', description: 'Elige con qué empresa de ejemplo entras al prototipo: la importadora o la minorista de turismo.' };

export default function Pagina() {
  return <Arquetipos />;
}
