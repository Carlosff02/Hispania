/**
 * src/app/core/services/places.service.ts
 *
 * Equivalente Angular de `services/placesService.ts`.
 *
 * Diferencia clave con countries.service: aquí el fallback SÍ se aplica
 * también a la consulta de un lugar individual. La versión React lo
 * implementaba con `try/catch` alrededor de un `await`, reintentando contra el
 * array local; en RxJS el mismo comportamiento es un `catchError` que devuelve
 * `of(local)`.
 */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { places as fallbackPlaces } from '../data/places';
import type { CategoriaLugar, Lugar, LugarDto } from '../models';

const CATEGORIAS: CategoriaLugar[] = [
  'ARTE', 'DANZA', 'ARQUEOLOGIA', 'PATRIMONIO', 'HISTORICO',
  'INFRAESTRUCTURA', 'PAISAJE_NATURAL', 'ACADEMICO', 'GASTRONOMICO',
];

/** Igual que en countries: validamos en vez de castear a ciegas. */
function toCategoria(value: string): CategoriaLugar {
  return (CATEGORIAS as string[]).includes(value) ? (value as CategoriaLugar) : 'PATRIMONIO';
}

/** Mapea los datos del backend al formato del dominio. */
export function mapLugarDTOToLugar(dto: LugarDto): Lugar {
  return {
    id: dto.id,
    name: dto.name,
    country: dto.country,
    coords: [dto.lat, dto.lng],
    category: toCategoria(dto.category),
    icon: dto.icon,
    period: dto.period,
    desc: dto.descText,
    img: dto.img,
  };
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Todos los lugares, con fallback local si el backend no responde. */
  readonly places$: Observable<Lugar[]> = this.http.get<LugarDto[]>(`${this.baseUrl}/places`).pipe(
    map((data) => data.map(mapLugarDTOToLugar)),
    catchError((err: HttpErrorResponse) => {
      console.warn(
        `❌ Backend unavailable (${err.status}) al cargar /places, using fallback data`,
      );
      return of(fallbackPlaces);
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  fetchPlaces(): Promise<Lugar[]> {
    return firstValueFrom(this.places$);
  }

  /** Un lugar por id; si no está en el backend, se busca en el respaldo local. */
  fetchPlaceById(id: string): Observable<Lugar | null> {
    return this.http.get<LugarDto>(`${this.baseUrl}/places/${id}`).pipe(
      map(mapLugarDTOToLugar),
      catchError((err: HttpErrorResponse) => {
        const local = fallbackPlaces.find((p) => p.id === id) ?? null;
        if (err.status === 404) {
          return of(local);
        }
        console.warn(
          `Failed to fetch place ${id} (${err.status}), checking fallback...`,
        );
        return of(local);
      }),
    );
  }
}
