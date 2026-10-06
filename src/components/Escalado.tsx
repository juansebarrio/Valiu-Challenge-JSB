'use client';
import { useLayoutEffect, useRef, useState, type FC, type ReactNode } from 'react';

/** Escala un bloque de 1280 px al ancho disponible (zoom CSS: el layout interno no cambia). */
export const Escalado: FC<{ ancho: number; children: ReactNode; className?: string }> = ({ ancho, children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setZoom(Math.min(1, el.clientWidth / ancho));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ancho]);
  return (
    <div ref={ref} className={className}>
      <div style={{ zoom }}>{children}</div>
    </div>
  );
};
