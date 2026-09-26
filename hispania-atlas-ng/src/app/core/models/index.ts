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
