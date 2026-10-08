import type { Metadata } from 'next';
import { HomeApp } from '@/components/HomeApp';

export const metadata: Metadata = { title: 'Valiu · Inicio', description: 'Home de la importadora: faltan dólares para los pagos de la semana y se pagan con pesos (flujo principal).' };

export default function Pagina() {
  return <HomeApp arquetipo="importadora" />;
}
