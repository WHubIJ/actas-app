import { View, Text, StyleSheet } from 'react-native';
import { ScreenBackground } from './ScreenBackground';
import { AnilloCarga } from './AnilloCarga';
import { espaciado, textos } from '../theme';

interface Props {
  titulo?: string;
  subtitulo?: string;
}

/**
 * Pantalla de carga de marca, a pantalla completa. Para los huecos donde la
 * app todavía no tiene nada que mostrar (arranque, tramo entre enviar el
 * login y aterrizar en la app autenticada) en vez de una pantalla en blanco
 * o un spinner de sistema.
 */
export function PantallaCarga({ titulo = 'Un momento…', subtitulo }: Props) {
  return (
    <ScreenBackground>
      <View style={styles.centro}>
        <AnilloCarga size={72} />
        <View style={styles.textos}>
          <Text style={[textos.titulo, styles.centrado]}>{titulo}</Text>
          {subtitulo && <Text style={[textos.apoyo, styles.centrado]}>{subtitulo}</Text>}
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xxl,
    paddingHorizontal: espaciado.xxl,
  },
  textos: { alignItems: 'center', gap: espaciado.xs },
  centrado: { textAlign: 'center' },
});
