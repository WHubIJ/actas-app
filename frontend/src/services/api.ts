/**
 * Base de la API del backend (Spring Boot). Sin barra final.
 *
 * Mientras no esté definida, la app funciona con los mocks de `src/mocks/` y
 * las operaciones que exigen backend fallan con un error explícito en vez de
 * simular un éxito.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/**
 * `true` cuando hay un backend al que llamar. No es un flag de feature: es la
 * diferencia entre poder pedir un archivo generado y no poder.
 */
export const hayBackend = API_URL.length > 0;
