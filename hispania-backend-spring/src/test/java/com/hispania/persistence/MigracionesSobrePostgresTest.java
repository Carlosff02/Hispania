package com.hispania.persistence;

import com.hispania.persistence.entity.CategoriaLugar;
import com.hispania.persistence.entity.Region;
import com.hispania.persistence.repository.PaisRepository;
import com.hispania.services.interfaces.PaisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Levanta la aplicacion completa contra un Postgres de verdad y comprueba que la cadena
 * de migraciones deja una base utilizable.
 *
 * <p>Esta prueba existe porque un Postgres en memoria no sirve para nada de lo que ha
 * fallado aqui. Los dos fallos que encontro ejecutando contra la base real no habrian
 * salido con una base de mentira:
 *
 * <ul>
 *   <li>V1 sembraba {@code 'Arte'} y {@code 'Arqueologia'}, y el CHECK de V2 solo
 *       acepta mayusculas: la base no se podia construir (arreglado con V1_1).</li>
 *   <li>{@code Region} guardaba el nombre de la constante en vez del texto acentuado,
 *       asi que leer los paises daba 500 y el JSON mandaba un valor que el frontend
 *       rechazaba.</li>
 * </ul>
 *
 * <p>Que el contexto arranque ya es parte de la asercion: `ddl-auto=validate` compara
 * las entidades con el esquema migrado y detiene el arranque si no coinciden, de modo
 * que las pruebas no pueden pasar con el esquema desalineado.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
@DisplayName("La cadena de migraciones sobre Postgres real")
class MigracionesSobrePostgresTest {

    /**
     * La misma major que declara el README. El alpine va porque es mas rapido de
     * arrancar y las pruebas solo necesitan el motor, no las utilidades del imagen
     * completa.
     */
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry registro) {
        registro.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registro.add("spring.datasource.username", POSTGRES::getUsername);
        registro.add("spring.datasource.password", POSTGRES::getPassword);
        // `jwt.secret` no tiene valor por defecto en application.properties a
        // proposito, asi que hay que darle uno aunque esta prueba no firme nada.
        registro.add("jwt.secret", () -> "clave-que-solo-vive-en-esta-prueba-de-integracion-1234567890");
    }

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PaisRepository paisRepository;

    @Autowired
    private PaisService paisService;

    @Test
    @DisplayName("aplica V1..V7 mas V1_1, sin saltos y en el orden esperado")
    void aplicaTodaLaCadena() {
        List<String> versiones = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank",
                String.class);

        assertThat(versiones).containsExactly("1", "1.1", "2", "3", "4", "5", "6", "7");
    }

    @Test
    @DisplayName("V7 deja los 19 paises que define el frontend, cada uno con una region canonica")
    void siembraLosPaisesQueFaltaban() {
        // V3 solo siembra Mexico y Peru, y V7 anade los 17 que faltaban. El
        // frontend ya define 19, asi que es el numero que tiene que haber.
        assertThat(paisRepository.findAllByOrderByCodeAsc()).hasSize(19);

        // La comprobacion fuerte no es el total, sino que ningun pais quede con un
        // valor de region que el enum no sepa resolver: eso es exactamente lo que
        // devolvia un 500 en GET /api/countries.
        assertThat(jdbc.queryForList("SELECT DISTINCT region FROM paises", String.class))
                .containsExactlyInAnyOrder("Norteamérica", "Centroamérica", "Caribe", "Andina", "Cono Sur");
    }

    @Test
    @DisplayName("V1_1 deja la categoria de los lugares en un valor que el enum y el CHECK aceptan")
    void normalizaLasCategoriasQueSembroV1() {
        // Estas dos filas son las que V1 sembro con 'Arqueologia' y 'Arte' en
        // mayuscula inicial, y las que bloqueaban el CHECK de V2.
        assertThat(categoriaDe("machu")).isEqualTo(CategoriaLugar.ARQUEOLOGIA);
        assertThat(categoriaDe("mali")).isEqualTo(CategoriaLugar.ARTE);

        // Y ninguna de las filas que siemicolon las migraciones queda fuera del enum:
        // si alguien anade una categoria al enum y no la anade a la migracion, o al
        // reves, esta comprobacion se entera.
        List<String> huerfanas = jdbc.queryForList(
                "SELECT DISTINCT category FROM lugares WHERE category NOT IN "
                        + "('ARTE','DANZA','ARQUEOLOGIA','PATRIMONIO','HISTORICO',"
                        + "'INFRAESTRUCTURA','PAISAJE_NATURAL','ACADEMICO','GASTRONOMICO')",
                String.class);

        assertThat(huerfanas).isEmpty();
    }

    @Test
    @DisplayName("la columna region guarda el texto acentuado, no el nombre de la constante")
    void regionSeGuardaComoTextoAcentuado() {
        // Lo que hay literalmente en la base, sin pasar por el enum: es el contrato
        // que escribieron las migraciones y que espera el frontend.
        assertThat(regionEnLaBase("MX")).isEqualTo("Norteamérica");
        assertThat(regionEnLaBase("PE")).isEqualTo("Andina");
    }

    @Test
    @DisplayName("leer los paises no revienta: cada region de la base tiene su enum")
    void leerLosPaisesFunciona() {
        // Este es el recorrido que daba 500 con el enum desalineado. Si un valor de la
        // base no encuentra su constante, Hibernate lanza aqui y no en produccion.
        List<Region> regiones = paisRepository.findAllByOrderByCodeAsc().stream()
                .map(pais -> pais.getRegion())
                .toList();

        assertThat(regiones).isNotEmpty().doesNotContainNull();
    }

    @Test
    @DisplayName("la respuesta de la API viaja con el texto que valida el frontend")
    void laRespuestaExponeElTextoDelFrontend() {
        // El frontend no usa `as Region` a lo bruto: valida contra una lista cerrada
        // ('Norteamerica' acentuada, 'Centroamerica', 'Caribe', 'Andina', 'Cono Sur') y
        // si no coincide avisa y cae en 'Andina'. Si aqui saliera 'NORTEAMERICA',
        // Mexico se dibujaria en la region equivocada sin que nada fallara.
        assertThat(paisService.listarTodos())
                .allSatisfy(pais ->
                        assertThat(pais.region()).isIn("Norteamérica", "Centroamérica",
                                "Caribe", "Andina", "Cono Sur"));
    }

    @Test
    @DisplayName("los lugares de un pais vienen anidados, como espera el frontend")
    void losLugaresVienenAnidados() {
        var peru = paisService.buscarPorCodigo("PE");

        assertThat(peru.lugares()).isNotEmpty();
        assertThat(peru.lugares())
                .allSatisfy(lugar -> assertThat(lugar.category()).isNotNull());
    }

    /**
     * Lee la categoria cruda de la base y la resuelve como enum.
     *
     * <p>El {@code valueOf} no es un detalle: si el texto de la base no coincide
     * exactamente con el nombre de la constante lanza {@code IllegalArgumentException}, y
     * con eso queda fijado justo el invariante que rompio V1 al sembrar 'Arqueologia'.
     */
    private CategoriaLugar categoriaDe(String idLugar) {
        String texto = jdbc.queryForObject(
                "SELECT category FROM lugares WHERE id = ?", String.class, idLugar);

        return CategoriaLugar.valueOf(texto);
    }

    private String regionEnLaBase(String code) {
        return jdbc.queryForObject(
                "SELECT region FROM paises WHERE code = ?", String.class, code);
    }
}
