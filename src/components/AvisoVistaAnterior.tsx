import type { FC } from 'react';
import { Alerta } from './ui/Alerta';
import { Boton } from './ui/Boton';

/** Alert Info del DS con el link "Probar el nuevo flujo", que abre el panel de pago. */
export const AvisoVistaAnterior: FC<{ onProbar: () => void }> = ({ onProbar }) => (
  <div data-component="AvisoVistaAnterior">
    <Alerta tono="info" compacta className="p-4" titulo={<span className="text-pretty font-normal">Estás en la vista anterior de Operar. Puedes seguir usándola mientras te acostumbras al nuevo flujo de pago.</span>} extra={<Boton variante="link" className="whitespace-nowrap font-bold underline" onClick={onProbar}>Probar el nuevo flujo</Boton>} />
  </div>
);
