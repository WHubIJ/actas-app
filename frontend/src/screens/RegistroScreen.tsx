import { useCallback, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleLogoIcon } from 'phosphor-react-native';
import { User, Mail, Lock, Eye, EyeOff, Building, Phone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, AppIcon, PanelProductoAuth, Aviso, PantallaCarga } from '../../components/ui';
import { registrarse, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

/**
 * Reskin sobre el tema nuevo del formulario ya existente (un solo paso).
 * El flujo en 2 pasos + verificación por código del preview (`AuthMobile.html`)
 * queda para más adelante — decisión explícita, no un olvido.
 */
export function RegistroScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { width } = useWindowDimensions();
  const esEscritorio = width >= t.size.bpTablet;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [organizacionNombre, setOrganizacionNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mismo patrón que LoginScreen: credenciales/OAuth aceptados, a la espera
  // de que App.tsx reaccione a onAuthStateChange y cambie de stack.
  const [sesionIniciada, setSesionIniciada] = useState(false);

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await registrarse(email, password, { nombre, organizacionNombre, telefono });
      // Con confirmación de email activada, signUp no deja sesión iniciada
      // todavía: se vuelve a Login con un aviso en vez de fingir que ya se puede entrar.
      navigation.navigate('Login', {
        avisoRegistro: 'Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesión.',
      });
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [email, password, nombre, organizacionNombre, telefono, navigation]);

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
          Crea tu cuenta
        </Text>
        <Text variant="caption" color="text2" style={{ textAlign: esEscritorio ? 'left' : 'center', marginTop: -t.spacing[1] }}>
          Reuniones y actas de tu organización
        </Text>
      </View>

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

      <View style={{ gap: t.spacing[4] }}>
        <Input
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre completo"
          icon={(c) => <User size={18} color={c} />}
        />
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
        <Input
          label="Nombre de la organización (opcional)"
          value={organizacionNombre}
          onChangeText={setOrganizacionNombre}
          placeholder="Ej. Iglesia Central"
          icon={(c) => <Building size={18} color={c} />}
        />
        <Input
          label="Teléfono (opcional)"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          placeholder="600 000 000"
          icon={(c) => <Phone size={18} color={c} />}
        />
      </View>

      <Button
        label={cargando ? 'Un momento…' : 'Crear cuenta'}
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

      <Pressable onPress={() => navigation.navigate('Login')} disabled={cargando} accessibilityRole="button">
        <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta?{' '}
          <Text variant="label" color="brandStrong">
            Inicia sesión
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
