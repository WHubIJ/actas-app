import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Card } from '../../components/ui';

interface Props {
  /** La grabación ya se detuvo pero su subida o registro falló: queda pendiente hasta reintentar. */
  detenido: boolean;
}

/**
 * Estado real del audio en la pantalla de grabación. Hoy la pantalla graba un
 * único clip y lo sube al finalizar, así que nunca hay clips ya subidos
 * mientras se graba: lo que sí es cierto es que hay uno pendiente.
 */
export function ResumenClips({ detenido }: Props) {
  const t = useTheme();
  return (
    <Card style={{ gap: t.spacing[1], padding: t.spacing[4] }}>
      <Text variant="overline" color="text2">
        Audio
      </Text>
      <View style={{ gap: t.spacing[1] }}>
        <Text variant="bodyStrong">1 clip, pendiente de subir</Text>
        <Text variant="caption" color="text2">
          {detenido ? 'La subida falló. Vuelve a pulsar Finalizar para reintentarla.' : 'Se sube al pulsar Finalizar.'}
        </Text>
      </View>
    </Card>
  );
}
