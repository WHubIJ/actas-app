import { useCallback, useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, FileText } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Input, Aviso } from '../../components/ui';
import { ListaParticipantes } from '../components/ListaParticipantes';
import { CampoParticipante } from '../components/CampoParticipante';
import { crearReunion, ErrorApi } from '../services/api';
import { useCuenta } from '../services/useCuenta';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaGrabacion'>;

/** En pantallas anchas el formulario no gana nada estirándose. */
const ANCHO_MAXIMO_FORMULARIO = 480;

/** Mismo patrón que GrabacionScreen: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorApi) {
    return err.message;
  }
  return porDefecto;
}

/**
 * Paso previo a grabar: título y participantes, ambos opcionales. Los
 * participantes se añaden uno a uno para poder mostrarlos como lista con
 * quitar individual (`design/previews/AntesDeGrabarMobile.html`).
 *
 * Lo que el diseño también muestra y aquí NO está, porque el modelo no lo
 * tiene: cargos ("Presidenta"), la marca "Invitado" y "Sugeridos de [tu
 * organización]" (necesita un directorio de miembros que el backend no
 * expone, ver ADR-003). Queda pendiente de ese modelo, no es un olvido.
 *
 * Al confirmar, crea la reunión en el backend y navega a GrabacionScreen ya
 * con su id.
 */
export function NuevaGrabacionScreen({ navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const esMovil = useBreakpoint() === 'movil';
  const { cuenta } = useCuenta();
  const [titulo, setTitulo] = useState('');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [nuevoParticipante, setNuevoParticipante] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const añadirParticipante = useCallback(() => {
    const nombre = nuevoParticipante.trim();
    if (!nombre) return;
    setParticipantes((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
    setNuevoParticipante('');
  }, [nuevoParticipante]);

  const quitarParticipante = useCallback((nombre: string) => {
    setParticipantes((actuales) => actuales.filter((p) => p !== nombre));
  }, []);

  const continuar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      const reunionId = await crearReunion(titulo.trim() || undefined, participantes);
      navigation.navigate('Grabacion', { reunionId, titulo: titulo.trim() || undefined });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la reunión. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [titulo, participantes, navigation]);

  const etiquetaBoton = cargando
    ? 'Creando…'
    : participantes.length > 0
      ? `Continuar con ${participantes.length} ${participantes.length === 1 ? 'participante' : 'participantes'}`
      : 'Continuar';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, width: '100%', maxWidth: esMovil ? undefined : ANCHO_MAXIMO_FORMULARIO, alignSelf: 'center' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              alignSelf: 'flex-start',
              minHeight: t.size.touchMin,
              marginTop: Math.max(insets.top, t.spacing[3]) + t.spacing[2],
              paddingRight: t.spacing[3],
              paddingLeft: t.spacing[3],
            }}
          >
            <ChevronLeft size={22} color={t.colors.brandStrong} strokeWidth={2} />
            <Text variant="bodyLg" color="brandStrong" style={{ fontSize: 16, lineHeight: 20 }}>
              Mis actas
            </Text>
          </Pressable>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: t.spacing[5], paddingTop: t.spacing[1], paddingBottom: t.spacing[6] }}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="heading" style={{ fontSize: 28, lineHeight: 34, letterSpacing: -0.84 }}>
              Antes de grabar
            </Text>
            <Text color="text2" style={{ marginTop: t.spacing[2] }}>
              Título y participantes son opcionales: puedes dejarlos en blanco y añadirlos más tarde.
            </Text>

            <View style={{ marginTop: t.spacing[5] }}>
              <Input
                label="Título de la reunión"
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ej. Junta directiva de octubre"
                icon={(c) => <FileText size={20} color={c} strokeWidth={1.6} />}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: t.spacing[6],
                marginBottom: t.spacing[2],
              }}
            >
              <Text variant="overline" color="text2">
                Participantes
              </Text>
              <Text variant="metadata" color="text2" accessibilityLabel={`${participantes.length} añadidos`}>
                {participantes.length}
              </Text>
            </View>

            <ListaParticipantes participantes={participantes} nombreUsuario={cuenta?.nombre} onQuitar={quitarParticipante} />

            <View style={{ marginTop: participantes.length > 0 ? t.spacing[3] : 0, gap: t.spacing[2] }}>
              <CampoParticipante valor={nuevoParticipante} onCambiar={setNuevoParticipante} onAnadir={añadirParticipante} />
              <Text variant="caption" color="text2">
                Escribe un nombre. Personas sin cuenta también valen.
              </Text>
            </View>
          </ScrollView>

          <View style={{ gap: t.spacing[3], paddingHorizontal: t.spacing[5], paddingTop: t.spacing[3], paddingBottom: Math.max(insets.bottom, t.spacing[4]) + t.spacing[4] }}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            <Button label={etiquetaBoton} size="xl" fullWidth loading={cargando} onPress={continuar} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
