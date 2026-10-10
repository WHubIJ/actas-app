import { useCallback, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, FileText, Users } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, Aviso } from '../../components/ui';
import { crearReunion, ErrorApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaGrabacion'>;

/** Mismo patrón que GrabacionScreen: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorApi) {
    return err.message;
  }
  return porDefecto;
}

/** "Ana, Pedro, María" -> ["Ana", "Pedro", "María"], descartando vacíos. */
function parsearParticipantes(texto: string): string[] {
  return texto
    .split(',')
    .map((nombre) => nombre.trim())
    .filter((nombre) => nombre.length > 0);
}

/**
 * Paso previo a grabar: título y participantes, ambos opcionales (ver
 * ADR pendiente de confirmar UX de participantes — por ahora un solo campo
 * separado por comas, sin picker de contactos de la organización ni roles;
 * el preview (`NuevaGrabacionScreen.html`) muestra ese flujo más rico, pero
 * depende de un directorio de organización que el backend no expone todavía,
 * así que queda para más adelante, igual que el registro en 2 pasos).
 * Al confirmar, crea la reunión en el backend y navega a GrabacionScreen ya
 * con su id.
 */
export function NuevaGrabacionScreen({ navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [titulo, setTitulo] = useState('');
  const [participantes, setParticipantes] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continuar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      const reunionId = await crearReunion(
        titulo.trim() || undefined,
        parsearParticipantes(participantes),
      );
      navigation.navigate('Grabacion', { reunionId });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la reunión. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [titulo, participantes, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            alignSelf: 'flex-start',
            paddingTop: Math.max(insets.top, t.spacing[3]) + t.spacing[2],
            paddingHorizontal: t.spacing[4],
          }}
        >
          <ChevronLeft size={22} color={t.colors.brandStrong} strokeWidth={2} />
          <Text variant="body" color="brandStrong">
            Mis actas
          </Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: t.spacing[5],
            paddingTop: t.spacing[2],
            paddingBottom: insets.bottom + t.spacing[8],
            justifyContent: 'space-between',
            gap: t.spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: t.spacing[5] }}>
            <View style={{ gap: t.spacing[1] }}>
              <Text variant="heading" style={{ fontSize: 28, lineHeight: 34, letterSpacing: -0.84 }}>
                Antes de grabar
              </Text>
              <Text variant="caption" color="text2" style={{ maxWidth: 320 }}>
                Título y participantes son opcionales: puedes dejarlos en blanco y añadirlos más tarde.
              </Text>
            </View>

            <View style={{ gap: t.spacing[4] }}>
              <Input
                label="Título de la reunión"
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ej. Junta directiva de octubre"
                icon={(c) => <FileText size={18} color={c} />}
              />
              <Input
                label="Participantes"
                value={participantes}
                onChangeText={setParticipantes}
                placeholder="Ana, Pedro, María"
                icon={(c) => <Users size={18} color={c} />}
              />
            </View>
          </View>

          <View style={{ gap: t.spacing[3] }}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            <Button
              label={cargando ? 'Creando…' : 'Continuar'}
              size="xl"
              fullWidth
              loading={cargando}
              onPress={continuar}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
