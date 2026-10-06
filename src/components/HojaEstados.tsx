'use client';
import { useState, type FC, type ReactNode } from 'react';
import { centavos } from '@/lib/dinero';
import { fechasLiquidacion } from '@/lib/fx';
import { HOY } from '@/data/escenario';
import { FechaLiquidacion } from './FechaLiquidacion';
import { OpcionOrigen } from './OpcionOrigen';
import { TarjetaPosicion } from './TarjetaPosicion';

const fechas = fechasLiquidacion(HOY, new Date(2026, 9, 8));
const fechasSinVence = fechasLiquidacion(HOY);

export const Caso: FC<{ titulo: string; children: ReactNode; className?: string }> = ({ titulo, children, className }) => (
  <div className={['flex flex-col gap-2.5', className].filter(Boolean).join(' ')}>
    <span className="text-caption font-semibold">{titulo}</span>
    <div className="flex flex-col gap-3 rounded-sm bg-app-surface p-5 shadow-mid">{children}</div>
  </div>
);

/** Estados fuera del escenario: FechaLiquidacion, OpcionOrigen cuando hoy no alcanza y TarjetaPosicion con una pactada sin saldo. */
export const HojaEstados: FC<{ compacta?: boolean }> = ({ compacta }) => {
  const [fecha, setFecha] = useState(fechas[0].fecha);
  return (
    <div className={['grid gap-6', compacta ? 'grid-cols-2' : 'grid-cols-3'].join(' ')}>
      <Caso titulo="FechaLiquidacion · por defecto Hoy · el pago vence el jue 8 (interactivo)"><FechaLiquidacion opciones={fechas} valor={fecha} onChange={setFecha} /></Caso>
      <Caso titulo="Otra fecha: jue 8 · la operación queda Pactada"><FechaLiquidacion opciones={fechas} valor={fechas[2].fecha} onChange={() => {}} /></Caso>
      <Caso titulo="Vence después del vie 9: ninguna opción lleva “vence”"><FechaLiquidacion opciones={fechasSinVence} valor={fechasSinVence[0].fecha} onChange={() => {}} /></Caso>
      <Caso titulo="Hover (mié 7)"><FechaLiquidacion opciones={fechas} valor={fechas[0].fecha} onChange={() => {}} demoHover={1} /></Caso>
      <Caso titulo="Foco con teclado (mié 7) · ← → mueven la selección"><FechaLiquidacion opciones={fechas} valor={fechas[0].fecha} onChange={() => {}} demoFoco={1} /></Caso>
      <Caso titulo="Hoy deshabilitado: el saldo de hoy no alcanza"><FechaLiquidacion opciones={fechas.map((f, i) => (i === 0 ? { ...f, deshabilitada: true, motivo: 'Hoy no alcanza el saldo' } : f))} valor={fechas[2].fecha} onChange={() => {}} /></Caso>
      <Caso titulo="Transferencia en la misma divisa"><div className="flex min-h-(--app-tour-card-h) items-center rounded-sm border border-dashed border-app-ink-3 p-4 text-pretty text-caption text-app-ink-2">No se muestra: sin tipo de cambio no hay precio que cerrar ni fecha que elegir.</div></Caso>
      <Caso titulo="OpcionOrigen · hoy no alcanza el saldo · se puede elegir igual">
        <OpcionOrigen cuenta="Cuenta Principal MXN" saldo="Saldo 20,000.00 MXN" pagas="Pagas ≈ 27,136.77 MXN" consecuencia={{ texto: 'Hoy no alcanza', tono: 'warning', ayuda: 'Puedes cerrar el precio y fondear antes del día que elijas.' }} seleccionada onElegir={() => {}} />
      </Caso>
      <Caso titulo="TarjetaPosicion · pactada sin saldo en la cuenta de origen">
        <div className="rounded-sm bg-app-canvas p-6">
          <TarjetaPosicion divisa="MXN" nombre="Pesos" saldo={0} pactadasLiquidar={{ cantidad: 1, total: centavos(27_138.62) }} resultado={{ tipo: 'faltan', monto: centavos(27_138.62) }} linea="Fondea 27,138.62 MXN para el jue 8" enlace={{ label: 'Ver datos para depositar' }} />
        </div>
      </Caso>
    </div>
  );
};
