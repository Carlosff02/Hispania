/**
 * Tabla de rutas. Equivalente directo del bloque `<Routes>` de `App.tsx`:
 * cada `Route path=... element=...` se vuelve un objeto con `path` y
 * `component` dentro de un array exportado.
 *
 * Diferencias menores respecto a React:
 *  - `redirectTo` reemplaza `<Navigate to="..." replace />`.
 *  - El comodín se escribe `**` y NO lleva `pathMatch` (mismo comportamiento).
 *  - No hay que importar los componentes de forma diferida aquí: Angular ya
 *    genera un bundle por ruta de forma nativa con el compilador AOT.
 */
import type { Routes } from '@angular/router';

import { ArteGrid } from './features/arte/arte-grid';
import { Cultura } from './features/cultura/cultura';
import { Datos } from './features/datos/datos';
import { Milestones } from './features/hitos/milestones';
import { ExplorarView } from './features/map/explorar-view';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explorar' },
  { path: 'explorar', component: ExplorarView },
  { path: 'arte', component: ArteGrid },
  { path: 'hitos', component: Milestones },
  { path: 'cultura', component: Cultura },
  { path: 'datos', component: Datos },
  { path: '**', redirectTo: 'explorar' },
];
