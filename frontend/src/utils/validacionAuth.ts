/** Comprobación mínima de forma, solo para avisar antes del último paso: la validación real es de Supabase. */
export function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}
