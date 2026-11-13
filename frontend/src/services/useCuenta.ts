import { useEffect, useState } from 'react';
import { hayBackend, obtenerCuenta, type Cuenta } from './api';

interface EstadoCuenta {
  cuenta: Cuenta | null;
  cargando: boolean;
}

/**
 * Carga la cuenta una vez al montar, para chrome de la app (pie del sidebar)
 * donde un fallo no debe interrumpir nada: si el backend no está o falla,
 * `cuenta` queda en `null` y quien la pinta muestra su alternativa honesta.
 * `MiCuentaScreen` sigue cargándola por su cuenta porque necesita el error.
 */
export function useCuenta(): EstadoCuenta {
  const [estado, setEstado] = useState<EstadoCuenta>({ cuenta: null, cargando: hayBackend });

  useEffect(() => {
    if (!hayBackend) return;
    let cancelado = false;
    obtenerCuenta()
      .then((cuenta) => {
        if (!cancelado) setEstado({ cuenta, cargando: false });
      })
      .catch(() => {
        if (!cancelado) setEstado({ cuenta: null, cargando: false });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return estado;
}
