import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { ScreenBackground } from '../components/ScreenBackground';
import { Header } from '../components/Header';
import { CampoFormulario } from '../components/CampoFormulario';
import { Boton } from '../components/Boton';
import { Aviso } from '../components/Aviso';
import { crearReunion, ErrorApi } from '../services/api';
import { espaciado, textos } from '../theme';

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
 * separado por comas, sin componente de chips). Al confirmar, crea la
 * reunión en el backend y navega a GrabacionScreen ya con su id.
 */
export function NuevaGrabacionScreen({ navigation }: Props) {
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
    <ScreenBackground>
      <View style={[styles.raiz, { paddingTop: Math.max(insets.top, espaciado.md) + espaciado.sm }]}>
        <Header onBack={() => navigation.goBack()} onOptions={() => {}} />

        <View style={[styles.contenido, { paddingBottom: insets.bottom + espaciado.xxl }]}>
          <View style={styles.encabezado}>
            <Text style={textos.titulo}>Antes de grabar</Text>
            <Text style={[textos.apoyo, styles.subtitulo]}>
              Título y participantes son opcionales: puedes dejarlos en blanco y añadirlos más tarde.
            </Text>
          </View>

          <View style={styles.campos}>
            <CampoFormulario
              etiqueta="Título de la reunión"
              valor={titulo}
              onCambiar={setTitulo}
              placeholder="Ej. Junta directiva de octubre"
            />
            <CampoFormulario
              etiqueta="Participantes"
              valor={participantes}
              onCambiar={setParticipantes}
              placeholder="Ana, Pedro, María"
            />
          </View>

          <View style={styles.acciones}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            <Boton
              titulo={cargando ? 'Creando…' : 'Continuar'}
              cargando={cargando}
              onPress={continuar}
            />
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: {
    flex: 1,
    paddingHorizontal: espaciado.xxl,
    justifyContent: 'space-between',
  },
  encabezado: { gap: espaciado.sm, paddingTop: espaciado.xl },
  subtitulo: { maxWidth: 320 },
  campos: { gap: espaciado.lg },
  acciones: { gap: espaciado.md },
});
