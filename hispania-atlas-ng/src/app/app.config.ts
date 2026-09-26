import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    /*
     * provideRouter + <router-outlet> es el equivalente exacto de
     * <BrowserRouter> + <Routes> en React:
     *   - withComponentInputBinding() permite leer params/query params como
     *     inputs del componente en vez de suscribirse a ActivatedRoute.
     *   - withInMemoryScrolling() restaura el scroll al navegar, que es el
     *     comportamiento que da laScrollRestoration de React Router.
     */
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),

    // Necesario para CountriesService y PlacesService. En la versión React se
    // usaba `fetch` nativo sin configurar nada; Angular necesita este provider.
    provideHttpClient(withFetch()),
  ],
};
