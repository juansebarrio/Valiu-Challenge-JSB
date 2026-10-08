// @iconscout/react-unicons no publica tipos para las importaciones por ícono.
declare module '@iconscout/react-unicons/icons/*' {
  import type { SVGProps, FC } from 'react';
  interface UnIconProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'size'> {
    color?: string;
    size?: number | string;
  }
  const Icono: FC<UnIconProps>;
  export default Icono;
}
