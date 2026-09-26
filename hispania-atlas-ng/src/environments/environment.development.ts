/**
 * Entorno de DESARROLLO (`ng serve`).
 *
 * `apiBaseUrl` usa la ruta relativa `/api` y NO la URL absoluta del backend
 * porque `ng serve` corre en el puerto 4200 mientras que Spring Boot corre en el
 * 8080: al pedir `/api/...` el navegador pega al dev-server, que reenvía la
 * petición al backend gracias a `proxy.conf.json`. Así evitamos CORS por
 * completo, igual que haríamos con un `proxy` en Vite.
 *
 * Para hablar directo contra `http://localhost:8080/api` (como hace la versión
 * React) basta con poner la URL absoluta aquí, siempre que el backend tenga
 * CORS habilitado.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  cartoApiKey: 'cb1_2kvj_1_b8e44108840aea76999ee2a6',
};
