import { redirect } from 'next/navigation';

/** El tablero de frames vive en /tablero/alta. */
export default function Pagina() {
  redirect('/tablero/alta');
}
