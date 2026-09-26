/**
 * Entorno de PRODUCCIÓN (build por defecto).
 *
 * En producción la app se sirve desde el mismo origen que el backend, así que
 * usamos rutas relativas y evitamos por completo el problema de CORS.
 * Si sirves el frontend en otro dominio, cambia `apiBaseUrl` por la URL
 * absoluta del backend.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  cartoApiKey: '',
};
