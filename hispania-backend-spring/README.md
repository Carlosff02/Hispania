# Hispania Atlas — API REST (Spring Boot)

Migración del backend de **Quarkus 3.39 + Panache** (que sigue en
`hispania-backend/patrimonio-backend`) a **Spring Boot 4.0.8**, reorganizado en capas
y manteniendo el contrato `/api/countries` y `/api/places** que consume el frontend.

## Arquitectura

Las tres capas se conocen solo hacia abajo. `presentation` no importa `persistence`,
`services` no importa nada de `presentation`, y el mapeo entidad ↔ DTO es el único
punto donde se cruzan.

```
com.hispania
├── PatrimonioApplication
│
├── presentation/                    <- capa HTTP
│   ├── controllers/                 @RestController, translating HTTP <-> service
│   │   ├── PaisController
│   │   └── LugarController
│   └── dto/
│       ├── request/                 records de entrada + Bean Validation
│       │   ├── PaisRequest          con grupos OnCreate / OnUpdate
│       │   └── LugarRequest         el id solo se exige al crear
│       └── response/                records de salida (inmutables)
│           ├── ApiError             cuerpo unico de error
│           ├── PaisResponse
│           ├── LugarResponse
│           └── SerieHistoricaResponse
│
├── services/                        <- capa de negocio
│   ├── interfaces/                  el contrato (implementado por test doubles)
│   │   ├── PaisService
│   │   └── LugarService
│   ├── impl/                        la logica y las transacciones
│   │   ├── PaisServiceImpl
│   │   └── LugarServiceImpl
│   └── mapper/
│       └── ResponseMapper           entidad <-> DTO
│
├── persistence/                     <- capa de datos
│   ├── entity/                      entidades JPA planas
│   │   ├── Pais                     + enums Region, CategoriaLugar
│   │   ├── Lugar
│   │   └── PaisSerieHistorica
│   └── repository/                  Spring Data, sin implementacion escrita
│       ├── PaisRepository
│       ├── LugarRepository
│       └── PaisSerieHistoricaRepository
│
├── config/                          CORS y propiedades tipadas
└── exception/                       excepciones de negocio + manejador global
```

> `services/interface/` no es una opción: `interface` es palabra reservada en Java y
> `package com.hispania.services.interface;` no compila. Por eso la carpeta se llama
> `interfaces`.

### Por qué los DTO son `record` y las entidades no

Un `record` de Java es inmutable y el compilador genera los accesores, el constructor
canónico y la deserialización por nombre de componente. Para un DTO de entrada o
salida, eso es exactamente lo que se quiere y evita 60 líneas de getters y setters.

Las entidades JPA, en cambio, **no** pueden ser `record`: Hibernate necesita un
constructor sin argumentos y mutar los campos con setters para cargar el estado.
Por eso llevan constructor protegido vacío y setters.

### Por qué el mapeo vive en `services` y no en los DTO

La versión de Quarkus tenía `static fromEntity(...)` dentro de los DTO, lo que hace que
`presentation` dependa de `persistence`. Aquí el mapeo está en `ResponseMapper`, y los
DTO son records sin ningún método que reciba entidades. Así se puede cambiar el modelo
de datos sin que se rompa la capa HTTP, y al revés.

## Requisitos

- **JDK 25** (compila con `--release 25`; el proyecto funciona con 17+)
- **PostgreSQL 17** con la base `hispania_db` ya creada
- Maven no hace falta instalado: se usa el wrapper (`./mvnw`)

## Puesta en marcha

```bash
# 1. Base de datos (una sola vez)
#    La base hispania_db debe existir y tener el usuario postgres con contraseña.
psql -U postgres -c "CREATE DATABASE hispania_db;"

# 2. Credenciales — OBLIGATORIO
#    Ni la contraseña de la base ni la clave del JWT tienen valor por defecto en
#    application.properties, así que sin ellas la aplicación aborta al arrancar.
#    Es deliberado: un default acabaría escrito en el historial de git.
copy .env.example .env
#    En PowerShell:
#      $env:DB_URL       = "jdbc:postgresql://localhost:5432/hispania_db"
#      $env:DB_USER      = "postgres"
#      $env:DB_PASSWORD  = "tu-contrasena-real"
#      $env:JWT_SECRET   = "clave-aleatoria-de-openssl-rand-base64-48"

# 3. Primer administrador del sistema (opcional pero recomendado)
#    La migración NO siembra ninguna cuenta. Si defines estas tres variables y no
#    hay ningún ADMIN_SISTEMA, el arranque crea la cuenta inicial. Luego puedes
#    vaciarlas: la cuenta ya existe y no se vuelve a crear.
#      $env:ADMIN_USERNAME = "root"
#      $env:ADMIN_EMAIL    = "root@localhost"
#      $env:ADMIN_PASSWORD = "tu-contrasena-fuerte"

# 4. Arrancar
./mvnw spring-boot:run          # http://localhost:8080
```

`DB_URL` y `DB_USER` sí tienen default (`localhost:5432/hispania_db` y `postgres`),
porque no son secretos. `DB_PASSWORD` y `JWT_SECRET` son obligatorias, y si faltan
la aplicación aborta al arrancar con un mensaje que dice cuál falta, en lugar de
dejar que fallo más tarde y en un sitio menos evidente:

```
Falta la variable de entorno DB_PASSWORD.
  - Copia la plantilla:      copy .env.example .env
  - En PowerShell:           $env:DB_PASSWORD = "<tu contrasena>"
```

Sin `JWT_SECRET` el síntoma sería peor: la aplicación arrancaría y todos los
inicios de sesión fallarían, porque ningún token se podría firmar.

Flyway crea el esquema y aplica las migraciones al arrancar. No hay que importar
nada a mano.

## Usuarios, roles y propuestas

La jerarquía de permisos es **lineal**: cada rol incluye todo lo que puede el
anterior, así que no hace falta enumerar permisos, solo comparar rangos.

| Rol | Rango | Puede además de lo anterior |
| --- | --- | --- |
| `USUARIO` | 0 | ver el mapa, filtrar, **proponer** lugares |
| `COLABORADOR` | 1 | crear, editar y borrar lugares; **aprobar o rechazar** propuestas |
| `ADMIN` | 2 | promover a colaborador; editar países |
| `ADMIN_SISTEMA` | 3 | promover o degradar administradores del sistema; desactivar cuentas |

Las tres reglas que protegen la administración, todas en
`AdminUsuarioServiceImpl`:

1. **Rango superior.** Solo se modifica a quien tiene un rango menor. Por eso dos
   `ADMIN` no pueden tocarse entre sí.
2. **No delegar un poder que no se tiene.** Un `ADMIN` no puede promover a
   `ADMIN_SISTEMA`; si pudiera, bastaría con comprometer una cuenta intermedia.
3. **Nadie se modifica a sí mismo.** Evita degradaciones accidentales.

Ninguna de las tres se resuelve solo con `@PreAuthorize`: son relaciones entre dos
cuentas, no permisos sobre una ruta. La anotación se queda con la puerta
("esto exige `ADMIN`") y el servicio decide el resto.

Los permisos se expresan con el bean `Jerarquia`, que compara rangos:

```java
@PreAuthorize("@jerarquia.puede(authentication, 'COLABORADOR')")
```

Es mejor que `hasAnyRole('COLABORADOR', 'ADMIN', 'ADMIN_SISTEMA')`, que obligaría a
añadir el nuevo rol a cada anotación el día que se cree.

### Endpoints de autenticación y propuestas

| Método | Ruta | Mínimo | Respuesta |
| --- | --- | --- | --- |
| POST | `/api/auth/registro` | público | 201 + token. Siempre nace como `USUARIO` |
| POST | `/api/auth/login` | público | 200 + token. 401 si falla |
| GET | `/api/auth/yo` | autenticado | La cuenta del token, con su rol |
| POST | `/api/propuestas` | `USUARIO` | 201. Propone un lugar |
| GET | `/api/propuestas/mias` | `USUARIO` | Historial del propio usuario |
| GET | `/api/propuestas/pendientes` | `COLABORADOR` | Cola de moderación |
| PUT | `/api/propuestas/{id}/revision` | `COLABORADOR` | Aprueba o rechaza. 400 si rechaza sin motivo |
| GET | `/api/admin/usuarios` | `ADMIN` | Lista de cuentas, con filtro `?rol=` |
| GET | `/api/admin/usuarios/{id}` | `ADMIN` | Una cuenta |
| PUT | `/api/admin/usuarios/{id}/rol` | `ADMIN` | Cambia el rol, con las 3 reglas |
| PATCH | `/api/admin/usuarios/{id}/estado` | `ADMIN` | Activa o desactiva. **No hay borrado** |

**El registro no acepta un `rol`.** Aunque el JSON lo lleve, el DTO lo descarta:
aceptarlo sería la vía más fácil para que cualquiera se autoproclamara
administrador.

**Las cuentas no se borran, se desactivan.** Las propuestas y revisiones guardan
la referencia a su autor, así que un `DELETE` dejaría el historial huérfano.

**Al aprobar, el identificador del lugar se genera en ese momento**, a partir del
nombre y de las coordenadas (`museo_larco_12_073_77_070`). Pedirlo al proponer solo
generaría colisiones que el usuario no puede ver. La consecuencia es que el
sistema **no deduplica por nombre**: si el lugar ya existe, el moderador ve la
propuesta y la rechaza, porque no hay forma de que el sistema lo sepa.

### Sobre el token

El JWT dura 8 horas y **no se comprueba contra la base en cada petición**. Esa es
la contrapartida de no tener servidor de sesiones:

- Un cambio de rol no tiene efecto hasta que el token caduca.
- Desactivar una cuenta no la expulsa al instante.

Con 8 horas la ventana es acotada. Si hiciera falta expulsar a alguien en el
segundo, la solución es una lista de tokens revocados, que devuelve el estado al
servidor y que aquí no se ha querido pagar.

## Endpoints

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/api/countries` | Lista de países con serie histórica y lugares anidados |
| GET | `/api/countries/{code}` | Un país, o 404 |
| POST | `/api/countries` | 201 + `Location`. 409 si el `code` ya existe |
| PUT | `/api/countries/{code}` | Actualización parcial |
| DELETE | `/api/countries/{code}` | 204. Borra también lugares y serie |
| GET | `/api/places` | Lista de lugares |
| GET | `/api/places?category=DANZA` | Filtro por categoría |
| GET | `/api/places/{id}` | Un lugar, o 404 |
| GET | `/api/places/pais/{code}` | Lugares de un país, o 404 |
| POST | `/api/places` | 201 + `Location`. 409 si el `id` ya existe |
| PUT | `/api/places/{id}` | Actualización parcial |
| DELETE | `/api/places/{id}` | 204 |

Ejemplos:

```bash
# Lectura: pública, no hace falta token
curl http://localhost:8080/api/countries
curl "http://localhost:8080/api/places?category=ARQUEOLOGIA"

# Escritura: exige el rol COLABORADOR o superior
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"tu-contrasena"}' | jq -r .token)

curl -X POST http://localhost:8080/api/places \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"nuevo_lugar","name":"Nuevo lugar","country":"PE",
       "lat":-12.0,"lng":-77.0,"category":"ARTE"}'
```

Sin el `Authorization`, el `POST` devuelve 401. Con un token de `USUARIO`, 403.

### Formato de error

Todos los errores —de validación, de negocio o de ruta inexistente— comparten la
misma forma, para que el cliente tenga un único formato que parsear:

```json
{
  "timestamp": "2026-09-26T18:01:02.813Z",
  "status": 400,
  "error": "Bad Request",
  "message": "id: El id solo admite minusculas, digitos y guion bajo; lat: La latitud debe estar entre -90 y 90",
  "path": "/api/places",
  "details": [
    { "field": "id",  "message": "El id solo admite minusculas, digitos y guion bajo" },
    { "field": "lat", "message": "La latitud debe estar entre -90 y 90" }
  ]
}
```

| Situación | Código |
| --- | --- |
| Recurso inexistente | 404 |
| Identificador repetido | 409 |
| Violación de un CHECK o clave foránea | 409 |
| Campo inválido o enum desconocido | 400 |
| Petición incoherente (rechazar sin motivo) | 400 |
| Sin token, o token caducado | 401 |
| Con token, pero el rol no llega | 403 |

## Base de datos

### Migraciones

| Fichero | Qué hace |
| --- | --- |
| `V1__Create_lugares_table.sql` | Tabla `lugares` |
| `V2__Add_category_constraints.sql` | CHECK de las 9 categorías |
| `V3__Create_paises_table.sql` | Tablas `paises` y `paises_series_historicas` |
| `V4__Insert_Into_Lugares_table.sql` | 8 lugares de Perú |
| `V5__indices_y_restricciones.sql` | Índices, unicidad y CHECK |
| `V6__usuarios_y_propuestas.sql` | Tablas `usuarios` y `propuestas_lugar` (nueva) |

`V1` a `V4` están **copiados byte a byte** del proyecto de Quarkus. No es descuido:
Flyway guarda un checksum de cada migración ya aplicada, y reescribir aunque sea un
comentario haría que el arranque fallara con *"Validate failed: migration checksum
mismatch"*.

`V5` sí es nueva, y ataca tres problemas del esquema:

1. **Ninguna clave foránea tenía índice.** `lugares.pais_code` y
   `paises_series_historicas.pais_code` se resolvían con un escaneo secuencial en cada
   acceso perezoso. Con 17 filas no se nota; con 10 000, sí.
2. **No había unicidad en `(pais_code, year)`.** El frontend asume que el último
   elemento de `seriesHistoricas` es el año más reciente
   (`series[series.length - 1]`); con duplicados, esa suposición es falsa y las
   tarjetas mostrarían un valor arbitrario.
3. **`lugares.country` duplicaba `lugares.pais_code`** sin ninguna restricción que los
   mantuviera iguales. Ahora hay un `CHECK (country = pais_code)`, y por eso la entidad
   `Lugar` escribe ambas columnas siempre juntas, a través de `setPais(Pais)`.

`V6` añade `usuarios` y `propuestas_lugar`. Tres decisiones suyas:

1. **No siembra ninguna cuenta.** El primer `ADMIN_SISTEMA` lo crea el arranque desde
   variables de entorno. Una cuenta con contraseña fija en el SQL quedaría escrita en
   el historial de git, y da igual que el tutorial la llame "de ejemplo": existe en
   todos los entornos y en todos los despliegues futuros.
2. **Los CHECK repiten las reglas de Java.** El `rol` se valida en el enum y también en
   la base, para que un `INSERT` manual no deje un valor que la aplicación no sepa
   interpretar.
3. **La coherencia de la moderación se impone en la base.**
   `ck_propuestas_rechazo_coherente`
   exige que una propuesta esté `RECHAZADA` si y solo si tiene motivo, y
   `ck_propuestas_revision_coherente` que una propuesta revisada tenga fecha. Son las
   invariantes que el código de aplicación da por ciertas.

La propuesta **no tiene columna de `id` de lugar**: el identificador se genera al
aprobar, cuando se puede comprobar que no choque con ninguno existente.

### Configuración

`ddl-auto=validate`: Hibernate nunca crea ni altera tablas. El esquema es de Flyway, y
`validate` solo comprueba al arrancar que las entidades coincidan con las columnas
reales. Si alguien añade un campo a una entidad y no su migración, la aplicación no
arranca en lugar de fallar en producción.

`open-in-view=false`: la vista no puede abrir la sesión de Hibernate para serializar.
Cada DTO se construye dentro del servicio, con la sesión abierta. Por eso
`PaisServiceImpl.listarTodos()` hace **tres consultas en total** (países, lugares,
series) y las agrupa en memoria, en vez de dejar que Hibernate dispare un acceso
perezoso por país y por colección.

## Pruebas

```bash
./mvnw test
```

66 pruebas, sin necesidad de base de datos:

| Clase | Qué cubre |
| --- | --- |
| `ResponseMapperTest` | Mapeo entidad → DTO, enums por nombre, `country` sincronizado con el país, métricas nulas |
| `LugarServiceImplTest` | Reglas de negocio con repositorios simulados: duplicados, país inexistente, actualización parcial, agrupación en memoria |
| `LugarControllerTest` | Slice de Spring MVC: rutas, forma del JSON, grupos de validación, cuerpo `ApiError` |
| `JerarquiaTest` | La jerarquía de roles, incluidas las igualdades: dos `ADMIN` no se tocan, nadie delega lo que no tiene |
| `AdminUsuarioServiceImplTest` | Las tres reglas de administración y el orden de las comprobaciones |
| `PropuestaServiceImplTest` | Aprobar crea el lugar, rechazar exige motivo, nadie aprueba lo suyo, no se revisa dos veces |

En `JerarquiaTest` se cubren los casos de igualdad a propósito: un `>=` donde
debería haber un `>` permitiría a un administrador degradar a otro, y el fallo no
daría ninguna excepción, sino un agujero silencioso.

No hay pruebas de integración contra PostgreSQL porque requieren una base de datos o
Docker. Si se quieren, el camino es Testcontainers con PostgreSQL
(`org.testcontainers:postgresql`), que ya está instalado en la máquina.


## Diferencias con la versión Quarkus

| Aspecto | Quarkus | Spring Boot 4 |
| --- | --- | --- |
| Acceso a datos | Panache (active record) | Spring Data JPA, repositorios declarativos |
| Capa de negocio | No existía; el controller llamaba al entity | `services` con interfaz e implementación |
| Transacciones | `@Transactional` de Jakarta | `@Transactional(readOnly = true)` en lectura, escritura explícito |
| Errores | `Response.status(...)` a mano, sin cuerpo común | `GlobalExceptionHandler` y cuerpo `ApiError` |
| Validación | Ninguna | Bean Validation con grupos por operación |
| CORS | `CorsFilter` (JAX-RS) duplicando `quarkus.http.cors` | `WebConfig` con `CorsProperties` tipado |
| Mapeo | DTOs con `static fromEntity` (presentación → persistencia) | `ResponseMapper` en la capa de servicios |

## Notas sobre Spring Boot 4

Boot 4 movió cada autoconfiguración técnica a su propio módulo, y `spring-boot-autoconfigure`
ya no las incluye. Dos consecuencias de este proyecto:

- **`spring-boot-flyway` es obligatorio.** Sin esa dependencia la aplicación **arranca
  bien** (Hibernate valida el esquema y las tablas ya existen) pero **Flyway no se
  ejecuta**: las migraciones no se aplican y el fallo aparece en el siguiente despliegue,
  al fallar por una columna que no existe. Es el fallo más difícil de detectar de esta
  migración, porque la aplicación parece correcta.
- **`@WebMvcTest` también se movió** a `spring-boot-webmvc-test`, con el paquete
  `org.springframework.boot.webmvc.test.autoconfigure`.

Además, Boot 4 usa **Jackson 3** (`tools.jackson`), no `com.fasterxml.jackson`. Los enum
de configuración van en mayúsculas y `WRITE_DATES_AS_TIMESTAMPS` ya viene desactivado,
así que no se usa `spring.jackson.serialization.write-dates-as-timestamps`.

## Notas de la migración desde Quarkus

- **Se añadió `GET /api/countries/{code}`.** `CountriesService.fetchCountryByCode` del
  frontend ya lo llamaba, pero el backend de Quarkus no lo tenía implementado, así que
  siempre caía en los datos de respaldo locales.
- **`CountryPanel` y el resto de vistas no cambiaron.** El contrato JSON es idéntico a
  propósito: `seriesHistoricas` sigue siendo una lista de `{year, gdp, ...}` y
  `category` sigue siendo la cadena del enumerado, no su ordinal.
- **La limitación del gráfico de Economía sigue vigente.** Cambiar el indicador a
  "Población" actualiza las tarjetas, pero la línea sigue mostrando el PBI, porque
  `paises_series_historicas` no tiene serie para las demás métricas. Es un problema del
  modelo de datos, no de la arquitectura.
