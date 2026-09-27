/**
 * src/app/core/auth/roles.ts
 *
 * Espejo frontend de la clase `Jerarquia` del backend
 * (`com.hispania.config.Jerarquia`). Los dos archivos tienen que coincidir,
 * y esa es la razón de que el rango sea un número explícito y no un `enum`.
 *
 * El rango es un entero porque la jerarquía es **lineal**: cada rol puede todo
 * lo que puede el anterior. Así no hay una tabla de permisos que mantener, solo
 * una comparación. En el backend lo resuelve el método `incluye()` del enum
 * `Rol`; aquí se resuelve restando números.
 *
 * Ojo con el signo: `puede` compara `>=`. El `>` estricto aparece en la
 * administración de cuentas, donde es otra regla (solo se modifica a quien está
 * por debajo), y esa vive en el servicio de admin, no aquí.
 */
import type { Rol } from '../models';

const RANGO: Record<Rol, number> = {
  USUARIO: 0,
  COLABORADOR: 1,
  ADMIN: 2,
  ADMIN_SISTEMA: 3,
};

/** Etiquetas en castellano para la interfaz. El enum es un nombre de máquina. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  USUARIO: 'Usuario',
  COLABORADOR: 'Colaborador',
  ADMIN: 'Administrador',
  ADMIN_SISTEMA: 'Administrador del sistema',
};

/**
 * ¿El rol actual llega al mínimo exigido?
 *
 * Devolver `false` en lugar de lanzar es lo que permite usarla en la plantilla
 * con `@if (auth.puede('ADMIN'))`, que es donde se decide qué botones pintar.
 * La comprobación de verdad no está aquí: la hace el backend en cada petición.
 * Esto solo evita mostrar un botón que el servidor iba a rechazar.
 */
export function puede(actual: Rol | null, minimo: Rol): boolean {
  if (actual === null) {
    return false;
  }
  return RANGO[actual] >= RANGO[minimo];
}

/** Rango numérico de un rol, útil para ordenar listados de administración. */
export function rango(rol: Rol): number {
  return RANGO[rol];
}
