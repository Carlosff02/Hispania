package com.hispania.persistence.entity;

/**
 * Rango del usuario dentro de la jerarquia de permisos.
 *
 * <p>El orden de declaracion <strong>es</strong> el orden de poder: cada rol
 * incluye todo lo que puede el anterior, asi que el permiso no hay que
 * enumerarlo por rol sino comparar rangos.
 *
 * <table border="1">
 *   <caption>Que puede hacer cada rol</caption>
 *   <tr><th>Rol</th><th>Ademas de lo anterior</th></tr>
 *   <tr><td>USUARIO</td><td>ver paises y lugares, filtrar, proponer lugares</td></tr>
 *   <tr><td>COLABORADOR</td><td>crear, editar y borrar lugares; aprobar o rechazar propuestas</td></tr>
 *   <tr><td>ADMIN</td><td>promover a colaborador; editar paises</td></tr>
 *   <tr><td>ADMIN_SISTEMA</td><td>promover o degradar administradores; desactivar cuentas</td></tr>
 * </table>
 *
 * <p>Un usuario tiene <strong>un solo rol</strong>. Combinar roles (alguien que
 * fuera colaborador y administrador a la vez) no aporta nada aqui, porque el
 * conjunto de permisos ya es lineal: el siguiente rol siempre incluye al
 * anterior.
 */
public enum Rol {

    USUARIO(0),
    COLABORADOR(1),
    ADMIN(2),
    ADMIN_SISTEMA(3);

    private final int rango;

    Rol(int rango) {
        this.rango = rango;
    }

    public int getRango() {
        return rango;
    }

    /** {@code true} si este rol tiene al menos el poder del rol indicado. */
    public boolean incluye(Rol otro) {
        return this.rango >= otro.rango;
    }

    /** {@code true} si este rol tiene estrictamente mas poder que el indicado. */
    public boolean supera(Rol otro) {
        return this.rango > otro.rango;
    }

    /** Nombre con el que Spring Security construye la autoridad: {@code ROLE_ADMIN}. */
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
