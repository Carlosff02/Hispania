/**
 * src/app/core/models/index.ts
 *
 * Equivalente directo de `src/data/types.ts` del proyecto React. Los tipos son
 * la parte que NO cambia al migrar de framework: son TypeScript puro, así que
 * se copian tal cual y ambos proyectos comparten el mismo contrato de datos.
 */

export type Region =
  | 'Norteamérica'
  | 'Centroamérica'
  | 'Caribe'
  | 'Andina'
  | 'Cono Sur';

export interface SeriePunto {
  year: number;
  gdp: number;
}

export interface Pais {
  code: string;
  name: string;
  capital: string;
  coords: [number, number];
  region: Region;
  gdp: number;
  gdpPc: number;
  pop: number;
  growth: number;
  inflation: number;
  exports: number;
  imports: number;
  hdi: number;
  debt: number;
  trade: number;
  desc?: string;
  topExports?: string[];
  color: string;
  series: SeriePunto[];
}

export type CategoriaLugar =
  | 'ARTE'
  | 'DANZA'
  | 'ARQUEOLOGIA'
  | 'PATRIMONIO'
  | 'HISTORICO'
  | 'INFRAESTRUCTURA'
  | 'PAISAJE_NATURAL' // Ideal para valles, reservas, formaciones geológicas (ej: Valle de Viñales)
  | 'ACADEMICO' // Ideal para universidades, institutos, campus históricos
  | 'GASTRONOMICO'; // Ideal para mercados tradicionales, rutas de café o experiencias culinarias

export interface Lugar {
  id: string;
  name: string;
  country: string; // code del país, ej. 'PE'
  coords: [number, number];
  category: CategoriaLugar;
  icon: string;
  period: string;
  desc: string;
  img?: string;
}

export type TipoHito = 'Historia' | 'Arte' | 'Infraestructura';

export interface Hito {
  year: number;
  title: string;
  country: string;
  type: TipoHito;
  desc: string;
}

export interface ObraArte {
  title: string;
  cat: string;
  country: string;
  img: string;
  desc: string;
}

export type LayerId = 'political' | 'gdp' | 'pop' | 'hdi';

export interface CapaMapa {
  id: LayerId;
  label: string;
  unit: string;
  format: (v: number) => string;
}

export type VistaId = 'explorar' | 'arte' | 'hitos' | 'cultura' | 'datos';

/* -------------------------------------------------------------------------- */
/*                            DTOs del backend (Spring Boot)                  */
/* -------------------------------------------------------------------------- */
/*
 * A diferencia de los modelos de dominio, los DTOs sí reflejan el contrato
 * exacto del backend: campos snake/camel distintos, `lat`/`lng` en vez de
 * tupla `coords`, etc. El mapeo DTO -> dominio vive en los services.
 */

export interface SerieDto {
  year: number;
  gdp: number;
  gdpPc: number;
  pop: number;
  growth: number;
  inflation: number;
  exports: number;
  imports: number;
  hdi: number;
  debt: number;
  trade: number;
}

export interface LugarDto {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  category: string;
  icon: string;
  period: string;
  descText: string;
  img: string;
}

export interface PaisDto {
  code: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  region: string;
  descText: string;
  seriesHistoricas: SerieDto[];
  lugares: LugarDto[];
}

/* -------------------------------------------------------------------------- */
/*                          Autenticación y usuarios                           */
/* -------------------------------------------------------------------------- */

/**
 * Roles del backend, en el mismo orden que la enumeración Java. La jerarquía
 * (qué rol incluye a cuál) NO se deduce de este tipo: vive en
 * `core/auth/roles.ts`, que es el espejo frontend de la clase `Jerarquia`.
 */
export type Rol = 'USUARIO' | 'COLABORADOR' | 'ADMIN' | 'ADMIN_SISTEMA';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  activo: boolean;
  /** ISO-8601. Llega como `Instant`, o sea una cadena, no un `Date`. */
  createdAt: string;
  updatedAt: string;
}

/** Respuesta de login y de registro: el token y ya los datos de la cuenta. */
export interface AuthResponse {
  token: string;
  tokenType: string;
  /** Segundos de validez restantes. */
  expiresIn: number;
  usuario: Usuario;
}

export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Alta de cuenta. No lleva `rol` a propósito: el registro es público y el
 * backend descarta ese campo aunque llegue, para que nadie se autoproclame
 * administrador.
 */
export interface RegistroRequest {
  username: string;
  email: string;
  password: string;
  nombre: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            Propuestas de lugares                            */
/* -------------------------------------------------------------------------- */

/** Estado de una propuesta, tal como lo devuelve `PropuestaResponse`. */
export type EstadoPropuesta = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

/**
 * Lo que un moderador puede *enviar*, que no es lo mismo que lo que la entidad
 * guarda.
 *
 * El backend tiene dos enumeraciones a propósito: la de la entidad admite
 * `PENDIENTE` y la del request de revisión solo `APROBADA` y `RECHAZADA`. Con
 * un solo tipo, un cliente podría "revisar" una propuesta y dejarla pendiente.
 * Aquí se refleja esa misma separación.
 */
export type DecisionRevision = Extract<EstadoPropuesta, 'APROBADA' | 'RECHAZADA'>;

export interface Propuesta {
  id: number;
  nombre: string;
  country: string;
  lat: number;
  lng: number;
  category: CategoriaLugar;
  icon: string | null;
  period: string | null;
  descText: string | null;
  img: string | null;
  estado: EstadoPropuesta;
  propuestoPorId: number;
  propuestoPor: string;
  revisadoPor: string | null;
  revisadoAt: string | null;
  motivoRechazo: string | null;
  createdAt: string;
}

/**
 * Alta de una propuesta.
 *
 * No lleva `id` del lugar, y no es un descuido: se genera al aprobar, cuando ya
 * se puede comprobar que no choca con ninguno existente. Pedirlo aquí solo
 * generaría colisiones que el usuario no puede ver.
 */
export interface PropuestaRequest {
  nombre: string;
  country: string;
  lat: number;
  lng: number;
  category: CategoriaLugar;
  icon: string | null;
  period: string | null;
  descText: string | null;
  img: string | null;
}

export interface RevisionRequest {
  estado: DecisionRevision;
  /** Obligatorio solo si `estado` es `RECHAZADA`; el backend lo exige. */
  motivo: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                Errores de API                               */
/* -------------------------------------------------------------------------- */

/** Un campo concreto que falló la validación. */
export interface DetalleError {
  field: string;
  message: string;
}

/** Formato único de error del backend; ver `GlobalExceptionHandler`. */
export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  path?: string;
  details?: DetalleError[];
}

