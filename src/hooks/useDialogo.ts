'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Lo que se alcanza con Tab dentro del diálogo, en orden de documento (sin los radios fuera del tab order ni lo oculto). */
const tabulables = (nodo: HTMLElement) =>
  Array.from(nodo.querySelectorAll<HTMLElement>(FOCUSABLES)).filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);

/**
 * Comportamiento compartido de PanelOperar y ModalOperar (role=dialog, aria-modal): foco inicial en el primer campo o en el radio
 * elegido, foco atrapado con Tab y Shift+Tab, Esc cierra y, al desmontarse, el foco vuelve a donde estaba al abrir.
 * Inactivo en los frames de /tablero/alta, que son estáticos.
 */
export function useDialogo(ref: RefObject<HTMLElement | null>, onCerrar: () => void, activo: boolean) {
  const cerrarRef = useRef(onCerrar);
  useEffect(() => { cerrarRef.current = onCerrar; }, [onCerrar]);
  // Dónde estaba el foco al abrir, leído al montar: un autoFocus del contenido (el buscador de Destino) lo mueve adentro antes del efecto.
  const [previo] = useState(() => (typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null)));

  useEffect(() => {
    if (!activo) return;
    const nodo = ref.current;
    const inicial = nodo?.querySelector<HTMLElement>('input:not([disabled]), [role="radio"][tabindex="0"]') ?? nodo;
    if (!nodo?.contains(document.activeElement)) inicial?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrarRef.current(); return; }
      if (e.key !== 'Tab' || !nodo) return;
      const lista = tabulables(nodo);
      if (!lista.length) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const actual = document.activeElement;
      if (!actual || !nodo.contains(actual)) { e.preventDefault(); (e.shiftKey ? ultimo : primero).focus(); return; }
      if (e.shiftKey && (actual === primero || actual === nodo)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && actual === ultimo) { e.preventDefault(); primero.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previo?.focus?.(); };
  }, [activo, ref, previo]);
}
