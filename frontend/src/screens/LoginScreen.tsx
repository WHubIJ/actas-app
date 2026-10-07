import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleLogoIcon } from 'phosphor-react-native';
import { ScreenBackground } from '../components/ScreenBackground';
import { PantallaCarga } from '../components/PantallaCarga';
import { LogoBadge } from '../components/LogoBadge';
import { Boton } from '../components/Boton';
import { Aviso } from '../components/Aviso';
import { CampoFormulario } from '../components/CampoFormulario';
import { iniciarSesion, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import { colors, espaciado, textos } from '../theme';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoRegistro, setAvisoRegistro] = useState<string | null>(route.params?.avisoRegistro ?? null);
  // Credenciales aceptadas: el tramo entre eso y que App.tsx cambie de stack
  // (al reaccionar a onAuthStateChange) queda cubierto por PantallaCarga en
  // vez de volver al formulario con el botón ya sin "cargando".
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, password);
      setSesionIniciada(true);
      // Sin navegar a mano: App.tsx escucha el cambio de sesión de Supabase
      // y muestra la app principal en cuanto onAuthStateChange dispare.
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
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

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.contenido,
            { paddingTop: Math.max(insets.top, espaciado.xxl) + espaciado.xxl, paddingBottom: insets.bottom + espaciado.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encabezado}>
            <LogoBadge size={56} />
            <Text style={textos.display}>MeetingAI</Text>
            <Text style={[textos.apoyo, styles.centrado]}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.formulario}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            {avisoRegistro && (
              <Aviso tono="info" mensaje={avisoRegistro} onCerrar={() => setAvisoRegistro(null)} />
            )}

            <CampoFormulario
              etiqueta="Email"
              valor={email}
              onCambiar={setEmail}
              tipoTeclado="email-address"
              placeholder="tu@email.com"
            />
            <CampoFormulario
              etiqueta="Contraseña"
              valor={password}
              onCambiar={setPassword}
              secreto
              placeholder="••••••••"
            />

            <Boton
              titulo={cargando ? 'Un momento…' : 'Iniciar sesión'}
              cargando={cargando}
              disabled={!email || !password}
              onPress={enviar}
            />

            <View style={styles.separador}>
              <View style={styles.linea} />
              <Text style={textos.meta}>O</Text>
              <View style={styles.linea} />
            </View>

            <Boton
              titulo="Continuar con Google"
              variante="secundario"
              icono={(color, size) => <GoogleLogoIcon size={size} weight="bold" color={color} />}
              onPress={continuarConGoogle}
              disabled={cargando}
            />

            <Pressable onPress={() => navigation.navigate('Registro')} disabled={cargando} accessibilityRole="button">
              <Text style={[textos.accion, styles.enlace]}>¿No tienes cuenta? Crea una</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: espaciado.xxl,
    justifyContent: 'center',
    gap: espaciado.xxxl,
  },
  encabezado: { alignItems: 'center', gap: espaciado.md },
  centrado: { textAlign: 'center' },
  formulario: { gap: espaciado.lg },
  enlace: { textAlign: 'center', color: colors.marronClaro },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  linea: { flex: 1, height: 1, backgroundColor: colors.borde },
});
