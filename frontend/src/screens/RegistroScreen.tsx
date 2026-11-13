import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Mail, Building, Phone, MailCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Text,
  Button,
  Input,
  CampoContrasena,
  Aviso,
  PantallaCarga,
  LogoGoogle,
  PasosAuth,
  GlifoAuth,
  MarcoAuth,
  EncabezadoAuth,
  SeparadorAuth,
  PieEnlaceAuth,
  useAccesoEscritorio,
} from '../../components/ui';
import { registrarse, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import { LONGITUD_MINIMA_CONTRASENA } from '../utils/fortalezaContrasena';
import { esCorreoValido } from '../utils/validacionAuth';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

/** `cuenta` y `organizacion` son los dos pasos; `correo` es el aviso de que falta confirmar el email. */
type Paso = 'cuenta' | 'organizacion' | 'correo';

export function RegistroScreen() {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const esEscritorio = useAccesoEscritorio();

  const [paso, setPaso] = useState<Paso>('cuenta');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizacionNombre, setOrganizacionNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  // Mismo patrón que LoginScreen: OAuth aceptado, a la espera de que App.tsx
  // reaccione a onAuthStateChange y cambie de stack.
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const tamano = esEscritorio ? 'lg' : 'xl';
  const puedeContinuar = email.trim().length > 0 && Array.from(password).length >= LONGITUD_MINIMA_CONTRASENA;

  const continuar = useCallback(() => {
    if (!esCorreoValido(email)) {
      setErrorCorreo('Escribe un correo válido, como nombre@organizacion.org.');
      return;
    }
    setErrorCorreo(null);
    setPaso('organizacion');
  }, [email]);

  const crearCuenta = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await registrarse(email.trim(), password, { nombre: nombre.trim(), organizacionNombre: organizacionNombre.trim(), telefono: telefono.trim() });
      // Con confirmación de email activada, signUp no deja sesión iniciada
      // todavía: se explica qué falta en vez de fingir que ya se puede entrar.
      setPaso('correo');
    } catch (err) {
      // Estos dos fallos son de datos del primer paso: se corrigen allí.
      if (err instanceof ErrorAuth && err.codigo === 'EMAIL_YA_REGISTRADO') {
        setErrorCorreo('Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña.');
        setPaso('cuenta');
      } else if (err instanceof ErrorAuth && err.codigo === 'CONTRASENA_DEBIL') {
        setErrorPassword(err.message);
        setPaso('cuenta');
      } else {
        setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
      }
    } finally {
      setCargando(false);
    }
  }, [email, password, nombre, organizacionNombre, telefono]);

  // Google no pide nada aparte: si el email no existe, Supabase crea la cuenta igual que con signUp.
  const continuarConGoogle = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesionConProveedor('google');
      setSesionIniciada(true);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo continuar con Google. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, []);

  if (sesionIniciada) {
    return <PantallaCarga titulo="Creando tu cuenta…" subtitulo="Te llevamos a Mis Actas" />;
  }

  if (paso === 'correo') {
    return (
      <MarcoAuth anchoMax={420}>
        <GlifoAuth icono={(c) => <MailCheck size={24} color={c} strokeWidth={1.6} />} />
        <EncabezadoAuth titulo="Revisa tu correo">
          Hemos enviado un enlace de confirmación a{' '}
          <Text color="text" style={{ fontFamily: 'Geist_500Medium' }}>
            {email.trim()}
          </Text>
          . Ábrelo para activar tu cuenta y vuelve aquí para iniciar sesión.
        </EncabezadoAuth>
        <Text variant="caption" color="text2" style={{ fontSize: 13.5 }}>
          ¿No te llega? Revisa la carpeta de spam.
        </Text>
        <View style={{ marginTop: esEscritorio ? t.spacing[2] : 'auto' }}>
          <Button label="Ir a iniciar sesión" size={tamano} fullWidth onPress={() => navigation.navigate('Login')} />
        </View>
      </MarcoAuth>
    );
  }

  const enOrganizacion = paso === 'organizacion';
  // En escritorio el paso 1 no tiene a dónde volver (es la propia pantalla de acceso); en móvil sí, como en el kit.
  const volver = enOrganizacion
    ? { etiqueta: 'Atrás', onPress: () => setPaso('cuenta') }
    : esEscritorio
      ? undefined
      : { etiqueta: 'Atrás', onPress: () => navigation.navigate('Login') };

  return (
    <MarcoAuth anchoMax={420} volver={volver}>
      <PasosAuth total={2} actual={enOrganizacion ? 2 : 1} etiqueta={enOrganizacion ? 'Tu organización' : 'Tu cuenta'} />
      <EncabezadoAuth titulo="Crea tu cuenta">
        {enOrganizacion
          ? 'Opcional. Si la indicas, creamos el espacio de tu organización con tu cuenta como propietaria.'
          : 'Empieza con tus datos. La organización, en el siguiente paso.'}
      </EncabezadoAuth>

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

      {enOrganizacion ? (
        <>
          <Input
            label="Nombre de la organización (opcional)"
            value={organizacionNombre}
            onChangeText={setOrganizacionNombre}
            placeholder="Ej. Iglesia Central de Palma"
            autoComplete="organization"
            icon={(c) => <Building size={18} color={c} strokeWidth={1.6} />}
          />
          <Input
            label="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="600 000 000"
            icon={(c) => <Phone size={18} color={c} strokeWidth={1.6} />}
          />
          <View style={{ marginTop: esEscritorio ? t.spacing[2] : 'auto' }}>
            <Button label={cargando ? 'Un momento…' : 'Crear cuenta'} size={tamano} fullWidth loading={cargando} onPress={crearCuenta} />
          </View>
        </>
      ) : (
        <>
          <Input
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            placeholder="María López"
            autoComplete="name"
            icon={(c) => <User size={18} color={c} strokeWidth={1.6} />}
          />
          <Input
            label="Correo electrónico"
            value={email}
            onChangeText={(texto) => {
              setEmail(texto);
              setErrorCorreo(null);
            }}
            error={errorCorreo ?? undefined}
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
              setErrorPassword(null);
            }}
            error={errorPassword ?? undefined}
            placeholder="••••••••••"
            nueva
            medidor
          />
          <View style={{ marginTop: esEscritorio ? t.spacing[2] : t.spacing[4] }}>
            <Button label="Continuar" size={tamano} fullWidth disabled={!puedeContinuar} onPress={continuar} />
          </View>

          <SeparadorAuth texto="o" />
          <Button
            label="Continuar con Google"
            variant="secondary"
            size={tamano}
            fullWidth
            icon={() => <LogoGoogle />}
            onPress={continuarConGoogle}
            disabled={cargando}
          />

          <PieEnlaceAuth pregunta="¿Ya tienes cuenta?" accion="Inicia sesión" onPress={() => navigation.navigate('Login')} disabled={cargando} />
        </>
      )}
    </MarcoAuth>
  );
}
