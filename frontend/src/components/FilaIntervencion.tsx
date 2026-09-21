import { View, Text, StyleSheet } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../theme';
import type { IntervencionTranscripcion } from '../types';

interface Props {
  intervencion: IntervencionTranscripcion;
}

/** Paleta rotatoria por interviniente; misma regla que en `AvatarStack`. */
const TONOS = ['#C4956A', '#8B6A4F', '#A87B58', '#6B4A32', '#B5895F'];

function tonoPara(nombre: string): string {
  const suma = [...nombre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TONOS[suma % TONOS.length];
}

/**
 * Una intervención de la transcripción. Sin tarjeta ni borde: en un texto
 * largo, encuadrar cada turno lo convierte en una lista de cajas y se pierde
 * la lectura corrida. La jerarquía la dan el nombre y la marca de tiempo.
 */
export function FilaIntervencion({ intervencion }: Props) {
  const tono = tonoPara(intervencion.interviniente);

  return (
    <View style={styles.fila}>
      <View style={[styles.avatar, { backgroundColor: tono }]}>
        <Text style={styles.inicial}>{intervencion.interviniente.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Text style={styles.nombre} numberOfLines={1}>
            {intervencion.interviniente}
          </Text>
          <Text style={styles.marca}>{intervencion.marca}</Text>
        </View>
        <Text style={styles.texto}>{intervencion.texto}</Text>
      </View>
    </View>
  );
}

const TAMANO_AVATAR = 30;

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: espaciado.md },
  avatar: {
    width: TAMANO_AVATAR,
    height: TAMANO_AVATAR,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  inicial: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.xs,
    color: colors.textoInverso,
  },
  cuerpo: { flex: 1, gap: espaciado.xs },
  cabecera: { flexDirection: 'row', alignItems: 'baseline', gap: espaciado.sm },
  nombre: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.sm,
    color: colors.textoPrincipal,
    flexShrink: 1,
  },
  marca: {
    fontFamily: tipografia.familia.medium,
    fontSize: tipografia.tamano.xs,
    color: colors.textoTerciario,
    fontVariant: ['tabular-nums'],
  },
  texto: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    lineHeight: tipografia.interlineado.lg,
    color: colors.textoPrincipal,
  },
});
