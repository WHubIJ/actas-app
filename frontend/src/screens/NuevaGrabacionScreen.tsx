import { useCallback, useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, FileText, Plus, X } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, Badge, Aviso } from '../../components/ui';
import { crearReunion, ErrorApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaGrabacion'>;

/** Mismo patrón que GrabacionScreen: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorApi) {
    return err.message;
  }
  return porDefecto;
}

/**
 * Paso previo a grabar: título y participantes, ambos opcionales. Añadir uno
 * a uno (en vez del campo único separado por comas de antes) para poder
 * mostrarlos como lista con quitar individual, más cerca del preview
 * (`NuevaGrabacionScreen.html`).
 *
 * Lo que el preview también muestra y aquí NO está — "Sugeridos de [tu
 * organización]" como chips de un toque — depende de un directorio de
 * miembros que el backend no expone todavía (no hay módulo de
 * organización/equipo con endpoint propio, ver ADR-003). Queda pendiente de
 * ese endpoint, no es un olvido.
 *
 * Al confirmar, crea la reunión en el backend y navega a GrabacionScreen ya
 * con su id.
 */
export function NuevaGrabacionScreen({ navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
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
      navigation.navigate('Grabacion', { reunionId });
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

              <View style={{ gap: t.spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
                  <Text variant="label" style={{ fontSize: 13 }}>
                    Participantes
                  </Text>
                  {participantes.length > 0 && <Badge label={String(participantes.length)} />}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing[2],
                    height: 44,
                    paddingHorizontal: t.spacing[3],
                    borderRadius: t.radius.md,
                    borderWidth: 1,
                    borderColor: t.colors.borderStrong,
                    backgroundColor: t.colors.surface,
                  }}
                >
                  <Plus size={18} color={t.colors.text2} />
                  <TextInput
                    value={nuevoParticipante}
                    onChangeText={setNuevoParticipante}
                    onSubmitEditing={añadirParticipante}
                    placeholder="Añadir participante"
                    placeholderTextColor={t.colors.text3}
                    returnKeyType="done"
                    accessibilityLabel="Añadir participante"
                    style={[t.typography.body, { flex: 1, color: t.colors.text, outlineStyle: 'none' } as never]}
                  />
                </View>

                {participantes.length > 0 && (
                  <View style={{ gap: t.spacing[1] }}>
                    {participantes.map((nombre) => (
                      <View
                        key={nombre}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3], paddingVertical: t.spacing[2] }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: t.colors.surface2,
                          }}
                        >
                          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13 }} color="text2">
                            {nombre.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                          {nombre}
                        </Text>
                        <Pressable
                          onPress={() => quitarParticipante(nombre)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Quitar a ${nombre}`}
                        >
                          <X size={18} color={t.colors.text3} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ gap: t.spacing[3] }}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            <Button label={etiquetaBoton} size="xl" fullWidth loading={cargando} onPress={continuar} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
