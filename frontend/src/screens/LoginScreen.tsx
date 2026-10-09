import { useCallback, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleLogoIcon } from 'phosphor-react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, AppIcon, PanelProductoAuth, Aviso, PantallaCarga } from '../../components/ui';
import { iniciarSesion, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

export function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Login'>>();
  const { width } = useWindowDimensions();
  // `bp-tablet`: por debajo, sidebar colapsada / una columna (ver tokens.json).
  const esEscritorio = width >= t.size.bpTablet;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
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

  const formulario = (
    <View style={{ width: '100%', maxWidth: 380, gap: t.spacing[4] }}>
      <View style={{ alignItems: esEscritorio ? 'flex-start' : 'center', gap: t.spacing[3] }}>
        <AppIcon size={esEscritorio ? 28 : 64} />
        <Text
          variant="heading"
          style={{
            fontSize: 28,
            lineHeight: 34,
            letterSpacing: -0.84,
            textAlign: esEscritorio ? 'left' : 'center',
          }}
        >
          Inicia sesión
        </Text>
        <Text variant="caption" color="text2" style={{ textAlign: esEscritorio ? 'left' : 'center', marginTop: -t.spacing[1] }}>
          Reuniones y actas de tu organización
        </Text>
      </View>

      {(error || avisoRegistro) && (
        <View style={{ gap: t.spacing[2] }}>
          {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
          {avisoRegistro && <Aviso tono="info" mensaje={avisoRegistro} onCerrar={() => setAvisoRegistro(null)} />}
        </View>
      )}

      <View style={{ gap: t.spacing[4] }}>
        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tu@email.com"
          icon={(c) => <Mail size={18} color={c} />}
        />
        <View style={{ gap: t.spacing[2] }}>
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!verPassword}
            placeholder="••••••••"
            icon={(c) => <Lock size={18} color={c} />}
            right={
              <Pressable
                onPress={() => setVerPassword((v) => !v)}
                hitSlop={8}
                accessibilityLabel={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff size={18} color={t.colors.text2} /> : <Eye size={18} color={t.colors.text2} />}
              </Pressable>
            }
          />
          {/* Sin flujo de recuperación todavía — visible porque el diseño lo pide,
              sin acción real hasta que exista la pantalla. */}
          <Pressable accessibilityRole="button" style={{ alignSelf: 'flex-end' }}>
            <Text variant="label" color="brandStrong">
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        label={cargando ? 'Un momento…' : 'Iniciar sesión'}
        size="xl"
        fullWidth
        loading={cargando}
        disabled={!email || !password}
        onPress={enviar}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
        <Text variant="caption" color="text2">
          o
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
      </View>

      <Button
        label="Continuar con Google"
        variant="secondary"
        size="xl"
        fullWidth
        icon={(c) => <GoogleLogoIcon size={18} weight="bold" color={c} />}
        onPress={continuarConGoogle}
        disabled={cargando}
      />

      <Pressable onPress={() => navigation.navigate('Registro')} disabled={cargando} accessibilityRole="button">
        <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
          ¿No tienes cuenta?{' '}
          <Text variant="label" color="brandStrong">
            Crear cuenta
          </Text>
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {esEscritorio ? (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: t.spacing[12] }}
              keyboardShouldPersistTaps="handled"
            >
              {formulario}
            </ScrollView>
            <PanelProductoAuth />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: t.spacing[6],
              paddingTop: insets.top + t.spacing[10],
              paddingBottom: insets.bottom + t.spacing[8],
            }}
            keyboardShouldPersistTaps="handled"
          >
            {formulario}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
