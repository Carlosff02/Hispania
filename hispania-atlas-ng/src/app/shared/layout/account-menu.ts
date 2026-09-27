/**
 * src/app/shared/layout/account-menu.ts
 *
 * Zona de cuenta de la cabecera. Equivalente del bloque de sesión de
 * `layout/Header.tsx`.
 *
 * Se extrae del componente `Header` en lugar de meterlo ahí porque tiene
 * estado propio (el desplegable) y porque se puede reutilizar en la vista móvil
 * sin arrastrar la navegación entera. La cabecera le pasa el token y el estado
 * del desplegable; el menú no necesita conocer la barra de navegación.
 */
import { Component, ElementRef, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ETIQUETA_ROL } from '../../core/auth/roles';

@Component({
  selector: 'app-account-menu',
  imports: [RouterLink],
  templateUrl: './account-menu.html',
  // Cierra el desplegable al pulsar fuera. Se decide aquí, y no con un
  // `(click)` en el `<div>` de la plantilla, porque un contenedor con manejador
  // de clic no es accesible: no tiene foco ni se puede activar con el teclado,
  // y el linter lo rechaza. Comparando el destino del clic con este elemento
  // no hace falta ni Propagation.stop.
  host: { '(document:click)': 'cerrarSiEstaFuera($event)' },
})
export class AccountMenu {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Avisa a la cabecera de que el móvil debe cerrar el menú de navegación. */
  readonly navegar = output<void>();

  protected readonly abierto = signal(false);

  protected readonly autenticado = this.auth.autenticado;
  protected readonly usuario = this.auth.usuario;

  protected alternar(): void {
    this.abierto.update((v) => !v);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected cerrarSiEstaFuera(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.cerrar();
    }
  }

  protected salir(): void {
    this.cerrar();
    this.auth.logout();
    void this.router.navigateByUrl('/explorar');
  }

  /** Se llama al navegar para que el desplegable no quede abierto. */
  protected alNavegar(): void {
    this.cerrar();
    this.navegar.emit();
  }

  protected etiquetaRol(): string {
    const rol = this.auth.rol();
    return rol === null ? '' : ETIQUETA_ROL[rol];
  }
}
