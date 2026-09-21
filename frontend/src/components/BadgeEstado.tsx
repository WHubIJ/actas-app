import { View, Text, StyleSheet } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../theme';
import type { EstadoTranscripcion } from '../types';

interface Props {
  estado: EstadoTranscripcion;
}

/** Cada estado del backend tiene exactamente una lectura visual. */
const PRESENTACION: Record<EstadoTranscripcion, { texto: string; color: string; fondo: string }> = {
  COMPLETADA: { texto: 'Procesado por IA', color: colors.exito, fondo: colors.exitoSuave },
  EN_PROCESO: { texto: 'Procesando', color: colors.acento, fondo: colors.acentoSuave },
  PENDIENTE: { texto: 'En cola', color: colors.textoSecundario, fondo: colors.superficieHundida },
  FALLIDA: { texto: 'Error', color: colors.error, fondo: 'rgba(192, 57, 43, 0.12)' },
};

export function BadgeEstado({ estado }: Props) {
  const { texto, color, fondo } = PRESENTACION[estado];
  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <Text style={[styles.texto, { color }]} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaciado.xs + 2,
    paddingVertical: 4,
    paddingHorizontal: espaciado.sm,
    borderRadius: radios.pill,
  },
  punto: { width: 5, height: 5, borderRadius: radios.pill },
  texto: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.xxs,
    letterSpacing: 0.2,
  },
});
