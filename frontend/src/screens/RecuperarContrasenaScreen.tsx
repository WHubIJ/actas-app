import { useCallback, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, AppIcon, PanelProductoAuth, Aviso } from '../../components/ui';
import { enviarEnlaceRecuperacion, ErrorAuth } from '../services/authService';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

export function RecuperarContrasenaScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { width } = useWindowDimensions();
  const esEscritorio = width >= t.size.bpTablet;

  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await enviarEnlaceRecuperacion(email);
      // Mensaje de éxito siempre igual, exista o no esa cuenta (no enumerar emails).
      setEnviado(true);
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [email]);

  const formulario = (
    <View style={{ width: '100%', maxWidth: 380, gap: t.spacing[4] }}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={{ alignSelf: esEscritorio ? 'flex-start' : 'center', flexDirection: 'row', alignItems: 'center', gap: t.spacing[1] }}
      >
        <ArrowLeft size={16} color={t.colors.text2} />
        <Text variant="label" color="text2">
          Volver
        </Text>
      </Pressable>

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
          Recupera tu contraseña
        </Text>
        <Text variant="caption" color="text2" style={{ textAlign: esEscritorio ? 'left' : 'center', marginTop: -t.spacing[1] }}>
          Te enviamos un enlace para crear una nueva
        </Text>
      </View>

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
      {enviado && (
        <Aviso
          tono="info"
          mensaje="Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de entrada."
        />
      )}

      {!enviado && (
        <>
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

          <Button
            label={cargando ? 'Enviando…' : 'Enviar enlace'}
            size="xl"
            fullWidth
            loading={cargando}
            disabled={!email}
            onPress={enviar}
          />
        </>
      )}

      <Pressable onPress={() => navigation.navigate('Login')} disabled={cargando} accessibilityRole="button">
        <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
          ¿Ya la recuerdas?{' '}
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
