export interface Pestana<T extends string> {
  id: T;
  label: string;
}

export interface PestanasProps<T extends string> {
  pestanas: Pestana<T>[];
  activa: T;
  onCambiar: (id: T) => void;
  /** Tabs internas del formulario: ocupan todo el ancho y redondean las esquinas superiores. */
  llenas?: boolean;
  etiqueta: string;
  /** data-tour por pestaña (onboarding). */
  tour?: Partial<Record<T, string>>;
}

/** Tabs del DS: padding 14 16, 16/600 sobre #F6FBFF con subrayado 2 px #0086FF; inactiva 16/400 Grey1. */
export function Pestanas<T extends string>({ pestanas, activa, onCambiar, llenas, etiqueta, tour }: PestanasProps<T>) {
  return (
    <div role="tablist" aria-label={etiqueta} className="flex border-b border-app-divider">
      {pestanas.map((p, i) => {
        const esActiva = p.id === activa;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={esActiva}
            data-tour={tour?.[p.id]}
            onClick={() => onCambiar(p.id)}
            className={[
              '-mb-px cursor-pointer border-b-2 px-4 py-3.5 text-tab transition-colors focus-visible:-outline-offset-2',
              llenas ? 'flex-1 text-center' : '',
              llenas && i === 0 ? 'rounded-tl-sm' : '',
              llenas && i === pestanas.length - 1 ? 'rounded-tr-sm' : '',
              esActiva ? 'border-app-accent bg-app-accent-bg font-semibold text-app-ink' : 'border-transparent bg-transparent font-normal text-app-ink-2 hover:bg-app-accent-bg',
            ].filter(Boolean).join(' ')}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
