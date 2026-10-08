// Íconos Unicons Line (DS oficial, D-17) con tamaños del sistema. Decorativos por defecto (aria-hidden).
import type { FC, SVGProps } from 'react';
import UilEstate from '@iconscout/react-unicons/icons/uil-estate';
import UilCreditCard from '@iconscout/react-unicons/icons/uil-credit-card';
import UilChart from '@iconscout/react-unicons/icons/uil-chart';
import UilSignAlt from '@iconscout/react-unicons/icons/uil-sign-alt';
import UilChartLine from '@iconscout/react-unicons/icons/uil-chart-line';
import UilWhatsapp from '@iconscout/react-unicons/icons/uil-whatsapp';
import UilBell from '@iconscout/react-unicons/icons/uil-bell';
import UilSignout from '@iconscout/react-unicons/icons/uil-signout';
import UilTimes from '@iconscout/react-unicons/icons/uil-times';
import UilTimesCircle from '@iconscout/react-unicons/icons/uil-times-circle';
import UilLock from '@iconscout/react-unicons/icons/uil-lock';
import UilInfoCircle from '@iconscout/react-unicons/icons/uil-info-circle';
import UilCheckCircle from '@iconscout/react-unicons/icons/uil-check-circle';
import UilCalendarAlt from '@iconscout/react-unicons/icons/uil-calendar-alt';
import UilClockTen from '@iconscout/react-unicons/icons/uil-clock-ten';
import UilSearch from '@iconscout/react-unicons/icons/uil-search';
import UilPlus from '@iconscout/react-unicons/icons/uil-plus';
import UilArrowRight from '@iconscout/react-unicons/icons/uil-arrow-right';
import UilArrowDown from '@iconscout/react-unicons/icons/uil-arrow-down';
import UilAngleDownB from '@iconscout/react-unicons/icons/uil-angle-down';
import UilAngleUpB from '@iconscout/react-unicons/icons/uil-angle-up';
import UilQuestionCircle from '@iconscout/react-unicons/icons/uil-question-circle';
import UilLightbulbAlt from '@iconscout/react-unicons/icons/uil-lightbulb-alt';
import UilAngleLeftB from '@iconscout/react-unicons/icons/uil-angle-left-b';
import UilAngleRightB from '@iconscout/react-unicons/icons/uil-angle-right-b';
import UilArrowsVAlt from '@iconscout/react-unicons/icons/uil-arrows-v-alt';
import UilWallet from '@iconscout/react-unicons/icons/uil-wallet';

export const ICONOS = {
  estate: UilEstate,
  'credit-card': UilCreditCard,
  chart: UilChart,
  'sign-alt': UilSignAlt,
  'chart-line': UilChartLine,
  whatsapp: UilWhatsapp,
  bell: UilBell,
  signout: UilSignout,
  times: UilTimes,
  lock: UilLock,
  'info-circle': UilInfoCircle,
  'check-circle': UilCheckCircle,
  'times-circle': UilTimesCircle,
  'calendar-alt': UilCalendarAlt,
  'clock-ten': UilClockTen,
  search: UilSearch,
  plus: UilPlus,
  'arrow-right': UilArrowRight,
  'arrow-down': UilArrowDown,
  'angle-down-b': UilAngleDownB,
  'angle-up-b': UilAngleUpB,
  'question-circle': UilQuestionCircle,
  'lightbulb-alt': UilLightbulbAlt,
  'angle-left-b': UilAngleLeftB,
  'angle-right-b': UilAngleRightB,
  'arrows-v-alt': UilArrowsVAlt,
  wallet: UilWallet,
} as const;

export type NombreIcono = keyof typeof ICONOS;

/** Tamaños del DS: xs 14 (info) · sm 16 (inputs) · md 18 (sidebar) · lg 20 (módulos) · xl 22 (campana) · 2xl 24 · hero 48. */
export type TamanoIcono = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

/** Clase de tamaño (la medida real sale del token) y valor numérico de respaldo para los atributos del SVG. */
const TAMANOS: Record<TamanoIcono, { clase: string; px: number }> = {
  xs: { clase: 'size-(--app-icon-xs)', px: 14 },
  sm: { clase: 'size-(--app-icon-sm)', px: 16 },
  md: { clase: 'size-(--app-icon-md)', px: 18 },
  lg: { clase: 'size-(--app-icon-lg)', px: 20 },
  xl: { clase: 'size-(--app-icon-xl)', px: 22 },
  '2xl': { clase: 'size-(--app-icon-2xl)', px: 24 },
  hero: { clase: 'size-(--app-icon-hero)', px: 48 },
};

export interface IconoProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'size'> {
  nombre: NombreIcono;
  tamano?: TamanoIcono;
  /** Texto accesible; sin él, el ícono es decorativo. */
  etiqueta?: string;
}

export const Icono: FC<IconoProps> = ({ nombre, tamano = 'sm', etiqueta, className, ...rest }) => {
  const Svg = ICONOS[nombre];
  const t = TAMANOS[tamano];
  return (
    <Svg
      size={t.px}
      color="currentColor"
      className={['shrink-0 block', t.clase, className].filter(Boolean).join(' ')}
      aria-hidden={etiqueta ? undefined : true}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      focusable="false"
      {...rest}
    />
  );
};
