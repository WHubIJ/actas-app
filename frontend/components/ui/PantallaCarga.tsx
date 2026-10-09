import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { AnilloCarga } from './AnilloCarga';

interface Props {
  titulo?: string;
  subtitulo?: string;
}

/**
 * Pantalla de carga de marca, a pantalla completa. Para los huecos donde la
 * app todavía no tiene nada que mostrar (tramo entre enviar el login y
 * aterrizar en la app autenticada, carga inicial de una lista) en vez de una
 * pantalla en blanco o un spinner de sistema. El arranque de la app en sí usa
 * el splash nativo (`App.tsx`), no este componente.
 */
export function PantallaCarga({ titulo = 'Un momento…', subtitulo }: Props) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', gap: t.spacing[6], paddingHorizontal: t.spacing[6] }}>
      <AnilloCarga size={72} />
      <View style={{ alignItems: 'center', gap: t.spacing[1] }}>
        <Text variant="title" style={{ textAlign: 'center' }}>
          {titulo}
        </Text>
        {subtitulo && (
          <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
            {subtitulo}
          </Text>
        )}
      </View>
    </View>
  );
}
