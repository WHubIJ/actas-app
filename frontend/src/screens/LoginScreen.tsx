import { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Text,
  Button,
  Input,
  CampoContrasena,
  AppIcon,
  Aviso,
  PantallaCarga,
  LogoGoogle,
  MarcoAuth,
  EncabezadoAuth,
  SeparadorAuth,
  PieEnlaceAuth,
  useAccesoEscritorio,
} from '../../components/ui';
import { iniciarSesion, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

export function LoginScreen() {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const esEscritorio = useAccesoEscritorio();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  // Credenciales erróneas: va bajo el campo de contraseña y es genérico a
  // propósito (no revela si el correo existe). El resto de fallos, en el aviso.
  const [errorCredenciales, setErrorCredenciales] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Credenciales aceptadas: el tramo entre eso y que App.tsx cambie de stack
  // (al reaccionar a onAuthStateChange) queda cubierto por PantallaCarga en
  // vez de volver al formulario con el botón ya sin "cargando".
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const enviar = useCallback(async () => {
    setError(null);
    setErrorCredenciales(null);
    setCargando(true);
    try {
      await iniciarSesion(email.trim(), password);
      setSesionIniciada(true);
      // Sin navegar a mano: App.tsx escucha el cambio de sesión de Supabase
      // y muestra la app principal en cuanto onAuthStateChange dispare.
    } catch (err) {
      if (err instanceof ErrorAuth && err.codigo === 'CREDENCIALES_INVALIDAS') {
        setErrorCredenciales(err.message);
      } else {
        setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
      }
    } finally {
      setCargando(false);
    }
  }, [email, password]);

  const continuarConGoogle = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesionConProveedor('google');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, []);

  if (sesionIniciada) {
    return <PantallaCarga titulo="Iniciando sesión…" subtitulo="Te llevamos a Mis Actas" />;
  }

  const tamano = esEscritorio ? 'lg' : 'xl';

  return (
    <MarcoAuth>
      {esEscritorio ? (
        <EncabezadoAuth titulo="Inicia sesión">Accede a las reuniones y actas de tu organización.</EncabezadoAuth>
      ) : (
        <View style={{ alignItems: 'center', gap: t.spacing[4], paddingTop: t.spacing[10] }}>
          <AppIcon size={64} />
          <EncabezadoAuth titulo="Inicia sesión" centrado>
            Reuniones y actas de tu organización
          </EncabezadoAuth>
        </View>
      )}

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

      <View style={{ gap: t.spacing[4], marginTop: esEscritorio ? 0 : t.spacing[4] }}>
        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          placeholder="nombre@organizacion.org"
          icon={(c) => <Mail size={18} color={c} strokeWidth={1.6} />}
        />
        <CampoContrasena
          label="Contraseña"
          value={password}
          onChangeText={(texto) => {
            setPassword(texto);
            setErrorCredenciales(null);
          }}
          placeholder="••••••••"
          error={errorCredenciales ?? undefined}
          onSubmitEditing={email && password ? enviar : undefined}
        />
        <Pressable
          onPress={() => navigation.navigate('RecuperarContrasena')}
          disabled={cargando}
          accessibilityRole="button"
          style={{ alignSelf: 'flex-end', minHeight: t.size.touchMin, justifyContent: 'center', marginVertical: -t.spacing[2] }}
        >
          <Text variant="label" color="brandStrong" style={{ fontSize: 14 }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>
      </View>

      <Button
        label={cargando ? 'Un momento…' : 'Iniciar sesión'}
        size={tamano}
        fullWidth
        loading={cargando}
        disabled={!email || !password}
        onPress={enviar}
      />

      <SeparadorAuth texto={esEscritorio ? 'o continúa con' : 'o'} />

      {/* Solo Google: Apple y SSO de organización del kit no tienen proveedor
          configurado en Supabase, y un botón sin función detrás engaña. */}
      <Button
        label="Continuar con Google"
        variant="secondary"
        size={tamano}
        fullWidth
        icon={() => <LogoGoogle />}
        onPress={continuarConGoogle}
        disabled={cargando}
      />

      <View style={{ marginTop: esEscritorio ? 0 : 'auto' }}>
        <PieEnlaceAuth pregunta="¿No tienes cuenta?" accion="Crear cuenta" onPress={() => navigation.navigate('Registro')} disabled={cargando} />
      </View>
    </MarcoAuth>
  );
}
