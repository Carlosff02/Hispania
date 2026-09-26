import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { AppStore } from '../../core/state/app.store';
import { artData } from '../../core/data/art-data';

/**
 * Rejilla de bellas artes. Equivalente de `arte/ArteGrid.tsx`.
 *
 * El filtro de categoría sí vive en el store global (y no como estado local
 * como en Hitos o Cultura) porque es el único filtro de la app que se decidió
 * compartir: así se conserva al navegar a otra ruta y volver.
 */
@Component({
  selector: 'app-arte-grid',
  imports: [NgClass],
  templateUrl: './arte-grid.html',
})
export class ArteGrid {
  private readonly store = inject(AppStore);

  protected readonly artFilter = this.store.artFilter;

  /** 'Todos' más las categorías únicas presentes en los datos. */
  protected readonly categorias = ['Todos', ...new Set(artData.map((a) => a.cat))];

  protected readonly listaFiltrada = computed(() =>
    this.artFilter() === 'Todos'
      ? artData
      : artData.filter((a) => a.cat === this.artFilter()),
  );

  protected filterClass(cat: string): string {
    const base = 'px-4 py-1.5 text-[13px] border transition-all';
    return this.artFilter() === cat
      ? `${base} bg-vicblue text-paper-light border-ink font-bold`
      : `${base} bg-paper-light border-paper-border text-ink hover:bg-paper-dark`;
  }

  protected selectFilter(cat: string): void {
    this.store.setArtFilter(cat);
  }
}
