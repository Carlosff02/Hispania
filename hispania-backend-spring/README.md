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
#    La contraseña NO tiene valor por defecto en application.properties, así que
#    sin esta variable la aplicación aborta al arrancar. Es deliberado: un
#    default acabaría escrito en el historial de git.
copy .env.example .env
#    En PowerShell:
#      $env:DB_URL       = "jdbc:postgresql://localhost:5432/hispania_db"
#      $env:DB_USER      = "postgres"
#      $env:DB_PASSWORD  = "tu-contrasena-real"

# 3. Arrancar
./mvnw spring-boot:run          # http://localhost:8080
```

`DB_URL` y `DB_USER` sí tienen default (`localhost:5432/hispania_db` y `postgres`),
porque no son secretos. Solo la contraseña es obligatoria, y si falta la aplicación
aborta con este mensaje en lugar de con un error de PostgreSQL:

```
Falta la variable de entorno DB_PASSWORD.
  - Copia la plantilla:      copy .env.example .env
  - En PowerShell:           $env:DB_PASSWORD = "<tu contrasena>"
```

Flyway crea el esquema y aplica las migraciones al arrancar. No hay que importar
nada a mano.

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
curl http://localhost:8080/api/countries
curl "http://localhost:8080/api/places?category=ARQUEOLOGIA"

curl -X POST http://localhost:8080/api/places \
  -H "Content-Type: application/json" \
  -d '{"id":"nuevo_lugar","name":"Nuevo lugar","country":"PE",
       "lat":-12.0,"lng":-77.0,"category":"ARTE"}'
```

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

## Base de datos

### Migraciones

| Fichero | Qué hace |
| --- | --- |
| `V1__Create_lugares_table.sql` | Tabla `lugares` |
| `V2__Add_category_constraints.sql` | CHECK de las 9 categorías |
| `V3__Create_paises_table.sql` | Tablas `paises` y `paises_series_historicas` |
| `V4__Insert_Into_Lugares_table.sql` | 8 lugares de Perú |
| `V5__indices_y_restricciones.sql` | Índices, unicidad y CHECK (nueva en esta migración) |

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

28 pruebas, sin necesidad de base de datos:

| Clase | Qué cubre |
| --- | --- |
| `ResponseMapperTest` | Mapeo entidad → DTO, enums por nombre, `country` sincronizado con el país, métricas nulas |
| `LugarServiceImplTest` | Reglas de negocio con repositorios simulados: duplicados, país inexistente, actualización parcial, agrupación en memoria |
| `LugarControllerTest` | Slice de Spring MVC: rutas, forma del JSON, grupos de validación, cuerpo `ApiError` |

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
