import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Valiu · Inicio',
  description: 'Rediseño del home de Valiu y del flujo de pago de una factura en dólares con pesos (challenge 1).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
