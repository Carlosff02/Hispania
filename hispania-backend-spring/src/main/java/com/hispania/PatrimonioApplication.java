package com.hispania;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la API de Hispania Atlas.
 *
 * <p>La aplicacion se organiza en tres capas, y cada una solo conoce a la de abajo:
 *
 * <ul>
 *   <li>{@code presentation} -- controllers REST y DTOs ({@code request} /
 *       {@code response}). Es la unica capa que conoce HTTP.</li>
 *   <li>{@code services} -- interfaces con la logica de negocio
 *       ({@code interfaces}) y sus implementaciones ({@code impl}), mas el mapeo
 *       entidad &lt;-&gt; DTO.</li>
 *   <li>{@code persistence} -- entidades JPA ({@code entity}) y repositorios
 *       Spring Data ({@code repository}). Es la unica capa que conoce SQL.</li>
 * </ul>
 *
 * <p>El escaneo de componentes cubre los tres paquetes, asi que las interfaces de
 * {@code services} se implementan automaticamente por sus clases {@code impl}.
 */
@SpringBootApplication
public class PatrimonioApplication {

    public static void main(String[] args) {
        exigirContrasenaDelEntorno();
        SpringApplication.run(PatrimonioApplication.class, args);
    }

    /**
     * Falla rapido si la contrasena de la base de datos no esta definida.
     *
     * <p>{@code application.properties} declara la contrasena como
     * {@code spring.datasource.password=${DB_PASSWORD}}, sin valor por defecto, para
     * que una clave real no acabe escrita en el repositorio. El problema es que un
     * placeholder sin default <strong>no</strong> produce un error util: Spring lo
     * resuelve a cadena vacia y el primer fallo visible es el de PostgreSQL,
     * {@code FATAL: password authentication failed for user "postgres"}, que senala a
     * la contrasena de Postgres cuando el problema real es que no se exporto la
     * variable.
     *
     * <p>La comprobacion va aqui, en {@code main} y no en un {@code @PostConstruct},
     * porque un componente normal se inicializa DESPUES de que Flyway ya ha
     * intentado conectarse: llegaria tarde. Antes de crear el contexto es el unico
     * sitio queTodavia no ha pasado nada.
     *
     * <p>Se aceptan las tres formas que Spring Boot entiende para dar valor a esa
     * propiedad, para no bloquear a quien use una alternativa valida.
     */
    private static void exigirContrasenaDelEntorno() {
        String[] rutas = {
            "spring.datasource.password",        // -Dspring.datasource.password=...
            "SPRING_DATASOURCE_PASSWORD",         // forma que Spring Boot tambien acepta
            "DB_PASSWORD",                        // la que documenta .env.example
        };

        for (String ruta : rutas) {
            String valor = System.getProperty(ruta);
            if (valor == null) {
                valor = System.getenv(ruta);
            }
            if (valor != null && !valor.isBlank() && !valor.contains("${")) {
                return;
            }
        }

        throw new IllegalStateException("""
                Falta la variable de entorno DB_PASSWORD.

                  - Copia la plantilla:      copy .env.example .env
                  - En PowerShell:           $env:DB_PASSWORD = "<tu contrasena>"
                  - En bash:                 export DB_PASSWORD=<tu contrasena>

                No lleva valor por defecto a proposito, para que ninguna contrasena
                real acabe en el historial de git. En la plantilla .env.example hay
                un valor de ejemplo: copialo, pero cambia la contrasena.""");
    }
}
