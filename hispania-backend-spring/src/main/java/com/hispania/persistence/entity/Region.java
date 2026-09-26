package com.hispania.persistence.entity;

/**
 * Region geografica a la que pertenece un pais.
 *
 * <p>Se persiste como cadena ({@code Region.NORTEAMERICA} -&gt; {@code "NORTEAMERICA"})
 * y el valor viaja al JSON tal cual, que es lo que espera el frontend.
 */
public enum Region {
    NORTEAMERICA,
    CENTROAMERICA,
    CARIBE,
    ANDINA,
    CONO_SUR
}
