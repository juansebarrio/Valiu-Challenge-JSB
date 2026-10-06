import type { Metadata } from 'next';
import { Sistema } from './Sistema';

export const metadata: Metadata = { title: 'Valiu · Sistema', description: 'Guía viva: tokens del design system y componentes del flujo en sus estados.' };

export default function Pagina() {
  return <Sistema />;
}
