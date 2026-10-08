import type { FC } from 'react';

/** Logo oficial (SVG con fill=currentColor); 22 px de alto en el sidebar. */
export const Logo: FC<{ variante?: 'dark' | 'blue' | 'light' | 'glyph'; className?: string }> = ({ variante = 'dark', className }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={variante === 'glyph' ? '/logo/logo-mark-glyph.svg' : `/logo/logo-valiu-${variante}.svg`} alt="Valiu" className={['block h-(--app-logo-h) w-auto', className].filter(Boolean).join(' ')} />
);
