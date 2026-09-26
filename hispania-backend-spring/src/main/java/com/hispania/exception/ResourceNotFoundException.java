package com.hispania.exception;

/**
 * El recurso solicitado no existe.
 *
 * <p>Se lanza desde la capa de servicios para el 404. Es de tipo
 * {@link RuntimeException} porque forzar a declararla en cada firma de la interfaz
 * llenaria de {@code throws} las interfaces de negocio, que es ruido: el
 * {@code @RestControllerAdvice} la traduce a 404 sin que el controller tenga que
 * saber nada de ella.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Atajo para el caso mas comun: buscar por clave primaria.
     *
     * @param recurso nombre del recurso, por ejemplo {@code "Pais"}
     * @param clave   valor buscado
     */
    public static ResourceNotFoundException de(String recurso, String clave) {
        return new ResourceNotFoundException(recurso + " con identificador '" + clave + "' no encontrado");
    }
}
