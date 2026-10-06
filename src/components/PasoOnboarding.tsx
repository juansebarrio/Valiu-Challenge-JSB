'use client';
import { useLayoutEffect, useRef, useState, type FC, type RefObject } from 'react';
import { Boton } from './ui/Boton';
import { Icono } from './ui/Icono';

export interface PasoOnboardingProps {
  paso: number;
  total: number;
  /** Valor del atributo data-tour del elemento a resaltar. */
  objetivo: string;
  lado: 'abajo' | 'derecha' | 'izquierda';
  titulo: string;
  texto: string;
  onSiguiente: () => void;
  onAtras: () => void;
  onCerrar: () => void;
  contenedorRef: RefObject<HTMLDivElement | null>;
  modo?: 'app' | 'frame';
}

interface Rect { x: number; y: number; w: number; h: number; W: number; H: number }
interface Geo { rect: Rect | null; pad: number; W: number; gap: number; CH: number }

const leerVar = (el: HTMLElement, nombre: string, fallback: number) => {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(nombre));
  return Number.isFinite(v) ? v : fallback;
};

/** Mide el objetivo en runtime (getBoundingClientRect), recorta con box-shadow 0 0 0 2000px y pone la tarjeta de 320 px al lado indicado, acotada al contenedor. */
export const PasoOnboarding: FC<PasoOnboardingProps> = ({ paso, total, objetivo, lado, titulo, texto, onSiguiente, onAtras, onCerrar, contenedorRef, modo = 'app' }) => {
  const [geo, setGeo] = useState<Geo | null>(null);
  const tarjetaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const cont = contenedorRef.current;
    if (!cont) return;
    const medir = () => {
      const t = cont.querySelector<HTMLElement>(`[data-tour="${objetivo}"]`);
      const pad = leerVar(cont, '--app-tour-pad', 8);
      const W = leerVar(cont, '--app-tour-card-w', 320);
      const gap = leerVar(cont, '--app-tour-gap', 24);
      const CH = tarjetaRef.current?.offsetHeight || leerVar(cont, '--app-tour-card-h', 232);
      if (!t) { setGeo({ rect: null, pad, W, gap, CH }); return; }
      const a = cont.getBoundingClientRect();
      const b = t.getBoundingClientRect();
      const k = a.width ? cont.offsetWidth / a.width : 1;
      setGeo({ rect: { x: (b.left - a.left) * k, y: (b.top - a.top) * k, w: b.width * k, h: b.height * k, W: cont.offsetWidth, H: cont.offsetHeight }, pad, W, gap, CH });
    };
    medir();
    if (modo === 'app') cont.querySelector<HTMLElement>(`[data-tour="${objetivo}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const ro = new ResizeObserver(medir);
    ro.observe(cont);
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', medir, true);
    const t1 = setTimeout(medir, 300);
    const t2 = setTimeout(medir, 1200);
    document.fonts?.ready.then(medir).catch(() => {});
    return () => { ro.disconnect(); window.removeEventListener('resize', medir); window.removeEventListener('scroll', medir, true); clearTimeout(t1); clearTimeout(t2); };
  }, [objetivo, contenedorRef, modo, paso]);

  useLayoutEffect(() => {
    if (modo === 'app') tarjetaRef.current?.focus();
  }, [paso, modo]);

  const rect = geo?.rect ?? null;
  let estiloTarjeta: React.CSSProperties = { left: 16, top: 16 };
  let estiloRecorte: React.CSSProperties | null = null;
  if (geo && rect) {
    const { pad, W, gap, CH } = geo;
    let cx = rect.x;
    let cy = rect.y + rect.h + gap;
    if (lado === 'derecha') { cx = rect.x + rect.w + gap; cy = rect.y; }
    if (lado === 'izquierda') { cx = rect.x - W - gap; cy = rect.y; }
    cx = Math.max(16, Math.min(cx, rect.W - W - 16));
    cy = Math.max(16, Math.min(cy, rect.H - CH - 16));
    estiloTarjeta = { left: cx, top: cy };
    estiloRecorte = { left: rect.x - pad, top: rect.y - pad, width: rect.w + 2 * pad, height: rect.h + 2 * pad };
  }

  return (
    <>
      <div onClick={onCerrar} aria-hidden className="absolute inset-0 z-40" />
      {estiloRecorte ? (
        <div aria-hidden style={estiloRecorte} className="pointer-events-none absolute z-40 rounded-md shadow-[0_0_0_2000px_var(--app-overlay-tour)] outline-2 outline-app-accent" />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-app-overlay-tour" />
      )}
      <div
        ref={tarjetaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        data-component="PasoOnboarding"
        style={estiloTarjeta}
        className="absolute z-50 flex w-(--app-tour-card-w) flex-col gap-3 rounded-sm bg-app-surface p-5 shadow-lg outline-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-caption font-bold text-app-ink-2">Paso {paso + 1} de {total}</span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar recorrido" className="-my-1.5 -mr-2 flex size-(--app-close-btn-sm) cursor-pointer items-center justify-center rounded-sm bg-transparent text-app-ink hover:bg-app-canvas">
            <Icono nombre="times" tamano="md" />
          </button>
        </div>
        <h3 id="tour-titulo" className="text-h3 font-semibold">{titulo}</h3>
        <p className="text-pretty text-body text-app-ink-2">{texto}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, j) => <span key={j} className={['size-(--app-dot) rounded-full', j === paso ? 'bg-app-primary' : 'bg-app-ink-disabled'].join(' ')} />)}
          </div>
          <div className="flex items-center gap-4">
            {paso > 0 ? <Boton variante="link" onClick={onAtras}>Atrás</Boton> : null}
            <Boton variante="primary" tamano="large" onClick={onSiguiente}>{paso === total - 1 ? 'Empezar' : 'Siguiente'}</Boton>
          </div>
        </div>
      </div>
    </>
  );
};

export const PASOS_ONBOARDING: { objetivo: string; lado: PasoOnboardingProps['lado']; titulo: string; texto: string }[] = [
  { objetivo: 'posicion', lado: 'abajo', titulo: 'Tu posición por divisa, de un vistazo', texto: 'Saldo, pagos futuros y lo que te falta o te sobra en cada moneda, con la proyección de la semana. Si falta, el botón te lleva a comprar justo lo necesario.' },
  { objetivo: 'movimientos', lado: 'derecha', titulo: 'Paga desde el movimiento', texto: 'Próximos y realizados en una sola lista, separados por Hoy. Pagar abre un panel con destinatario, monto y referencia ya cargados: eliges la cuenta y confirmas.' },
  { objetivo: 'tdc', lado: 'izquierda', titulo: 'El tipo de cambio, en contexto', texto: 'Solo los pares de tus posiciones, con el precio para comprar y para vender en vivo. Al pedir precio queda fijo dos minutos para que confirmes con tu token.' },
  { objetivo: 'clasico', lado: 'abajo', titulo: '¿Prefieres operar como siempre?', texto: 'En la pestaña Operar clásico tienes el formulario de siempre: Comprar, Vender y Transferir. Las dos vistas comparten tus cuentas y movimientos.' },
];
