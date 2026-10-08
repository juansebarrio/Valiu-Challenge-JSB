import type { Metadata } from 'next';
import { HomeApp } from '@/components/HomeApp';

export const metadata: Metadata = { title: 'Valiu · Inicio', description: 'Home de la minorista de turismo: cobra en pesos y paga en euros al hotel (flujo secundario).' };

export default function Pagina() {
  return <HomeApp arquetipo="turismo" />;
}
