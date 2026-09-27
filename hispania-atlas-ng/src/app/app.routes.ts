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

import { Login } from './features/auth/login';
import { Registro } from './features/auth/registro';
import { SinPermiso } from './features/auth/sin-permiso';
import { ArteGrid } from './features/arte/arte-grid';
import { Cultura } from './features/cultura/cultura';
import { Datos } from './features/datos/datos';
import { Milestones } from './features/hitos/milestones';
import { ExplorarView } from './features/map/explorar-view';
import { autenticadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explorar' },
  { path: 'explorar', component: ExplorarView },
  { path: 'arte', component: ArteGrid },
  { path: 'hitos', component: Milestones },
  { path: 'cultura', component: Cultura },
  { path: 'datos', component: Datos },

  /* Sesión. Son las únicas rutas de cuenta y las dos son públicas: si ya hay
     sesión, Login redirige solo, así que no hace falta una guarda de "no
     visitable si ya entraste". */
  { path: 'cuenta/entrar', component: Login },
  { path: 'cuenta/crear', component: Registro },
  { path: 'sin-permiso', component: SinPermiso },

  /* Zonas con sesión. De momento solo 'cuenta', que agrupa lo que se pueda
     añadir después (las propuestas y la administración se montan aquí). */
  {
    path: 'cuenta',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./features/auth/perfil').then((m) => m.Perfil),
  },

  { path: '**', redirectTo: 'explorar' },
];
