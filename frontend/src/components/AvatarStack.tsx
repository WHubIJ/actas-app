import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../theme';

interface Props {
  participantes: string[];
  /** A partir de aquí se resume en "+N". Por defecto se adapta al ancho. */
  maximo?: number;
  size?: number;
}

/** Por debajo de este ancho no caben 4 avatares y el contador entero. */
const ANCHO_ESTRECHO = 360;

/** Paleta rotatoria: mismo nombre → mismo color en toda la app. */
const TONOS = ['#C4956A', '#8B6A4F', '#A87B58', '#6B4A32', '#B5895F'];

function tonoPara(nombre: string): string {
  const suma = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TONOS[suma % TONOS.length];
}

/**
 * Pila de iniciales solapadas. El solape negativo es la mitad del avatar, que
 * es el punto donde se sigue leyendo cada inicial sin desperdiciar ancho.
 */
export function AvatarStack({ participantes, maximo, size = 22 }: Props) {
  const { width } = useWindowDimensions();
  const limite = maximo ?? (width < ANCHO_ESTRECHO ? 3 : 4);
  const visibles = participantes.slice(0, limite);
  const restantes = participantes.length - visibles.length;

  return (
    <View style={styles.fila}>
      {visibles.map((nombre, i) => (
        <View
          key={`${nombre}-${i}`}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: tonoPara(nombre),
              marginLeft: i === 0 ? 0 : -size / 2.6,
              zIndex: visibles.length - i,
            },
          ]}
        >
          <Text style={[styles.inicial, { fontSize: size * 0.45 }]}>
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
      ))}

      {restantes > 0 && (
        <View
          style={[
            styles.avatar,
            styles.avatarResto,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2.6 },
          ]}
        >
          <Text style={[styles.inicial, styles.inicialResto, { fontSize: size * 0.4 }]}>
            +{restantes}
          </Text>
        </View>
      )}

      <Text style={styles.recuento} numberOfLines={1}>
        {participantes.length} {participantes.length === 1 ? 'participante' : 'participantes'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.superficie,
    // Los avatares nunca ceden espacio: es el contador el que se recorta en
    // pantallas estrechas.
    flexShrink: 0,
  },
  avatarResto: { backgroundColor: colors.superficieHundida },
  inicial: {
    fontFamily: tipografia.familia.bold,
    color: colors.textoInverso,
  },
  inicialResto: { color: colors.textoSecundario },
  recuento: {
    fontFamily: tipografia.familia.medium,
    fontSize: tipografia.tamano.xs,
    color: colors.textoSecundario,
    marginLeft: espaciado.sm,
    flexShrink: 1,
  },
});
