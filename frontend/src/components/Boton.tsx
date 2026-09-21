import { Text, View, StyleSheet, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

export type VarianteBoton = 'primario' | 'secundario';

interface BotonProps {
  titulo: string;
  variante?: VarianteBoton;
  /** Se renderiza a la izquierda del título; recibe ya el color correcto. */
  icono?: (color: string, size: number) => React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  cargando?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TAMANO_ICONO = 18;

/**
 * Botón de ancho completo. Dos variantes y ninguna más: el diseño solo usa
 * el primario en marrón degradado y el secundario en crema con borde.
 */
export function Boton({
  titulo,
  variante = 'primario',
  icono,
  onPress,
  disabled,
  cargando = false,
  style,
}: BotonProps) {
  const esPrimario = variante === 'primario';
  const colorTexto = esPrimario ? colors.textoInverso : colors.textoPrincipal;

  const contenido = (
    <View style={styles.contenido}>
      {cargando ? (
        <ActivityIndicator size="small" color={colorTexto} />
      ) : (
        <>
          {icono?.(esPrimario ? colors.textoInverso : colors.marronClaro, TAMANO_ICONO)}
          <Text
            style={[
              styles.texto,
              {
                color: colorTexto,
                fontFamily: esPrimario ? tipografia.familia.bold : tipografia.familia.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {titulo}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <PressableEscala
      onPress={onPress}
      disabled={disabled || cargando}
      // El nombre accesible no se deriva solo del texto hijo en todas las
      // plataformas; se declara explícitamente.
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: disabled || cargando, busy: cargando }}
      style={[styles.envoltura, style]}
    >
      {esPrimario ? (
        <LinearGradient
          colors={[...colors.marronGradiente]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.base, sombras.elevada]}
        >
          {contenido}
        </LinearGradient>
      ) : (
        <View style={[styles.base, styles.secundario, sombras.tarjeta]}>{contenido}</View>
      )}
    </PressableEscala>
  );
}

const styles = StyleSheet.create({
  envoltura: { width: '100%' },
  base: {
    height: 56,
    borderRadius: radios.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.xl,
  },
  secundario: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
  },
  texto: {
    fontSize: tipografia.tamano.md,
    letterSpacing: -0.2,
  },
});
