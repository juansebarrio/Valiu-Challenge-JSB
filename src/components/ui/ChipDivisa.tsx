import type { FC } from 'react';

/** Código de divisa en chip: bg Grey4, radio 4, Shadow Mid (badge de bandera del DS sin la bandera). */
export const ChipDivisa: FC<{ divisa: string; chico?: boolean }> = ({ divisa, chico }) => (
  <span className={['shrink-0 rounded-xs bg-app-canvas font-bold shadow-mid', chico ? 'px-1.5 py-0.5 text-micro' : 'px-2 py-0.5 text-caption'].join(' ')}>{divisa}</span>
);
