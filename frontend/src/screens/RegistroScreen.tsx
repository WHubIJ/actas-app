import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Mail, Lock, Eye, EyeOff, Building, Phone } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, AppIcon, PanelProductoAuth, Aviso, PasswordStrength } from '../../components/ui';
import { registrarse, ErrorAuth } from '../services/authService';
import { calcularFuerzaPassword } from '../utils/fuerzaPassword';
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
  const fuerzaPassword = useMemo(() => calcularFuerzaPassword(password), [password]);

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
          {password.length > 0 && (
            <View style={{ gap: 6 }}>
              <PasswordStrength nivel={fuerzaPassword.nivel} />
              <Text variant="caption" color="text2">
                {fuerzaPassword.mensaje}
              </Text>
            </View>
          )}
        </View>
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
