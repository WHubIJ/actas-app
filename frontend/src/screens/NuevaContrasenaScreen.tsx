import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Button,
  Checkbox,
  CampoContrasena,
  Aviso,
  PasosAuth,
  GlifoAuth,
  MarcoAuth,
  EncabezadoAuth,
  useAccesoEscritorio,
} from '../../components/ui';
import { actualizarContrasena, cerrarSesionEnOtrosDispositivos, ErrorAuth } from '../services/authService';
import { LONGITUD_MINIMA_CONTRASENA } from '../utils/fortalezaContrasena';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

interface Props {
  /** Se llama al pulsar "Continuar" en la confirmación. `App.tsx` ya tiene sesión
      activa (la de recuperación) en ese momento, así que no navega a mano:
      deja que el árbol raíz reaccione y entre a la app igual que un login normal. */
  onCompletado: () => void;
}

/**
 * Pasos 3 (contraseña nueva) y 4 (confirmación) de la recuperación. Fuera de
 * los stacks de navegación normales (ver `App.tsx`): se muestra como override
 * de toda la app mientras hay una sesión de recuperación pendiente, tanto si
 * el usuario venía del stack de auth como si venía ya logueado (el enlace del
 * email puede llegar con la app en cualquier estado).
 */
export function NuevaContrasenaScreen({ onCompletado }: Props) {
  const t = useTheme();
  const esEscritorio = useAccesoEscritorio();

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cerrarOtras, setCerrarOtras] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `null` mientras no se ha guardado; luego, si la sesión de otros dispositivos se cerró (o no se pidió).
  const [resultado, setResultado] = useState<{ otrasCerradas: boolean | 'fallo' } | null>(null);

  const puedeEnviar = Array.from(password).length >= LONGITUD_MINIMA_CONTRASENA && password === confirmacion;
  const tamano = esEscritorio ? 'lg' : 'xl';

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await actualizarContrasena(password);
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
      setCargando(false);
      return;
    }

    // La contraseña ya está cambiada: un fallo aquí no puede mandar al usuario de vuelta al formulario.
    let otrasCerradas: boolean | 'fallo' = false;
    if (cerrarOtras) {
      try {
        await cerrarSesionEnOtrosDispositivos();
        otrasCerradas = true;
      } catch {
        otrasCerradas = 'fallo';
      }
    }
    setResultado({ otrasCerradas });
    setCargando(false);
  }, [password, cerrarOtras]);

  if (resultado) {
    const { otrasCerradas } = resultado;
    return (
      <MarcoAuth>
        <PasosAuth total={4} actual={4} etiqueta="Listo" />
        <GlifoAuth tono="success" icono={(c) => <Check size={24} color={c} strokeWidth={1.6} />} />
        <EncabezadoAuth titulo="Contraseña actualizada">
          Tu contraseña nueva ya está activa.
          {otrasCerradas === true && ' Hemos cerrado la sesión en tus otros dispositivos.'}
          {otrasCerradas === 'fallo' && ' No hemos podido cerrar la sesión en tus otros dispositivos.'}
        </EncabezadoAuth>
        <View style={{ marginTop: esEscritorio ? t.spacing[2] : 'auto' }}>
          <Button label="Continuar" size={tamano} fullWidth onPress={onCompletado} />
        </View>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth>
      <PasosAuth total={4} actual={3} etiqueta="Contraseña nueva" />
      <EncabezadoAuth titulo="Crea una contraseña nueva">
        Usa al menos {LONGITUD_MINIMA_CONTRASENA} caracteres. No puede ser igual a la anterior.
      </EncabezadoAuth>

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

      <CampoContrasena
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••••"
        nueva
        medidor
      />
      <CampoContrasena
        label="Repite la contraseña"
        value={confirmacion}
        onChangeText={setConfirmacion}
        placeholder="••••••••••"
        confirmaA={password}
        onSubmitEditing={puedeEnviar ? enviar : undefined}
      />

      <Checkbox checked={cerrarOtras} onChange={setCerrarOtras} label="Cerrar la sesión en el resto de dispositivos" />

      <View style={{ marginTop: esEscritorio ? t.spacing[2] : 'auto' }}>
        <Button
          label={cargando ? 'Guardando…' : 'Guardar contraseña'}
          size={tamano}
          fullWidth
          loading={cargando}
          disabled={!puedeEnviar}
          onPress={enviar}
        />
      </View>
    </MarcoAuth>
  );
}
