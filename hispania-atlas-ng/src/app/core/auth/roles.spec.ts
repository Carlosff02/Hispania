/**
 * src/app/core/auth/roles.spec.ts
 *
 * Esta jerarquía es el espejo de `Jerarquia` de Java, y los dos archivos pueden
 * dejar de coincidir sin que nada se rompa: no comparten tipo ni compilan
 * juntos. Un `>=` donde debería haber un `>` mostraría el botón de administrar
 * usuarios a un administrador que luego recibiría un 403, o al revés.
 *
 * Por eso se fijan las igualdades, no solo el caso evidente: que
 * `ADMIN` incluya a `COLABORADOR` es correcto, pero que `COLABORADOR` incluya a
 * `COLABORADOR` no dice nada del sentido del `>=`, y ahí es donde suele colarse
 * el error.
 */
import { ETIQUETA_ROL, puede, rango } from './roles';
import type { Rol } from '../models';

describe('jerarquía de roles', () => {
  const ROLES: Rol[] = ['USUARIO', 'COLABORADOR', 'ADMIN', 'ADMIN_SISTEMA'];

  it('deja pasar a quien tiene rango igual o superior', () => {
    expect(puede('COLABORADOR', 'COLABORADOR')).toBe(true);
    expect(puede('ADMIN', 'COLABORADOR')).toBe(true);
    expect(puede('ADMIN_SISTEMA', 'ADMIN')).toBe(true);
  });

  it('impide pasar a quien tiene rango inferior', () => {
    expect(puede('USUARIO', 'COLABORADOR')).toBe(false);
    expect(puede('COLABORADOR', 'ADMIN')).toBe(false);
    expect(puede('ADMIN', 'ADMIN_SISTEMA')).toBe(false);
  });

  it('nunca da permisos a una sesión cerrada', () => {
    for (const minimo of ROLES) {
      expect(puede(null, minimo)).toBe(false);
    }
  });

  it('mantiene el orden lineal que espera el backend', () => {
    const ordenado = [...ROLES].sort((a, b) => rango(a) - rango(b));
    expect(ordenado).toEqual(['USUARIO', 'COLABORADOR', 'ADMIN', 'ADMIN_SISTEMA']);
  });

  it('etiqueta todos los roles, para que la interfaz no muestre el enum', () => {
    for (const rol of ROLES) {
      expect(ETIQUETA_ROL[rol]).toBeTruthy();
      expect(ETIQUETA_ROL[rol]).not.toBe(rol);
    }
  });
});
