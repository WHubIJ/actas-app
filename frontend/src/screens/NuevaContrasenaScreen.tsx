import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, AppIcon, PanelProductoAuth, Aviso } from '../../components/ui';
import { actualizarContrasena, ErrorAuth } from '../services/authService';

const LONGITUD_MINIMA = 8;

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

interface Props {
  /** Se llama tras guardar la contraseña con éxito. `App.tsx` ya tiene sesión
      activa (la de recuperación) en ese momento, así que no navega a mano:
      deja que el árbol raíz reaccione y entre a la app igual que un login normal. */
  onCompletado: () => void;
}

/**
 * Pantalla fuera de los stacks de navegación normales (ver `App.tsx`): se
 * muestra como overrride de toda la app mientras hay una sesión de
 * recuperación de contraseña pendiente, tanto si el usuario venía del stack
 * de auth como si venía ya logueado (el enlace de email puede llegar con la
 * app en cualquier estado).
 */
export function NuevaContrasenaScreen({ onCompletado }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const esEscritorio = width >= t.size.bpTablet;

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorValidacion = useMemo(() => {
    if (!password) return null;
    if (password.length < LONGITUD_MINIMA) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
    if (confirmacion && password !== confirmacion) return 'Las contraseñas no coinciden.';
    return null;
  }, [password, confirmacion]);

  const puedeEnviar = password.length >= LONGITUD_MINIMA && password === confirmacion;

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await actualizarContrasena(password);
      onCompletado();
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [password, onCompletado]);

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
          Crea una nueva contraseña
        </Text>
        <Text variant="caption" color="text2" style={{ textAlign: esEscritorio ? 'left' : 'center', marginTop: -t.spacing[1] }}>
          Escribe tu nueva contraseña para continuar
        </Text>
      </View>

      {(error || errorValidacion) && <Aviso tono="error" mensaje={error ?? errorValidacion ?? ''} onCerrar={() => setError(null)} />}

      <View style={{ gap: t.spacing[4] }}>
        <Input
          label="Nueva contraseña"
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
          label="Confirma la contraseña"
          value={confirmacion}
          onChangeText={setConfirmacion}
          secureTextEntry={!verPassword}
          placeholder="••••••••"
          icon={(c) => <Lock size={18} color={c} />}
        />
      </View>

      <Button
        label={cargando ? 'Guardando…' : 'Guardar contraseña'}
        size="xl"
        fullWidth
        loading={cargando}
        disabled={!puedeEnviar}
        onPress={enviar}
      />
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
