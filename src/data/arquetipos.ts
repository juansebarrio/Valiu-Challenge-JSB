// src/data/arquetipos.ts — las dos empresas de ejemplo de la pantalla inicial.
import { IMPORTADORA, type Arquetipo, type ArquetipoId } from './escenario';
import { TURISMO } from './escenario-turismo';

export const ARQUETIPOS: Record<ArquetipoId, Arquetipo> = { importadora: IMPORTADORA, turismo: TURISMO };
export const ARQUETIPO_IDS: ArquetipoId[] = ['importadora', 'turismo'];
export const esArquetipo = (x: string | null | undefined): x is ArquetipoId => x === 'importadora' || x === 'turismo';
export const arquetipoDe = (id: ArquetipoId): Arquetipo => ARQUETIPOS[id];
