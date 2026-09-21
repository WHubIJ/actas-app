import { View, Text, StyleSheet } from 'react-native';
import { CaretRightIcon, ChatCircleTextIcon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { BadgeEstado } from './BadgeEstado';
import { AvatarStack } from './AvatarStack';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';
import { formatearMinutos } from '../utils/formato';
import type { ActaResumen } from '../types';

interface Props {
  acta: ActaResumen;
  onPress?: () => void;
}

export function TarjetaActa({ acta, onPress }: Props) {
  return (
    <PressableEscala
      onPress={onPress}
      escala={0.98}
      style={styles.tarjeta}
      accessibilityLabel={`${acta.titulo}, ${acta.fecha}, ${formatearMinutos(acta.duracionMinutos)}`}
    >
      <View style={styles.icono}>
        <ChatCircleTextIcon size={20} weight="regular" color={colors.marronClaro} />
      </View>

      <View style={styles.cuerpo}>
        <BadgeEstado estado={acta.estadoTranscripcion} />
        <Text style={styles.titulo} numberOfLines={1}>
          {acta.titulo}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {acta.fecha} · {formatearMinutos(acta.duracionMinutos)}
        </Text>
        <AvatarStack participantes={acta.participantes} />
      </View>

      <View style={styles.chevron}>
        <CaretRightIcon size={14} weight="bold" color={colors.marronClaro} />
      </View>
    </PressableEscala>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.md,
    padding: espaciado.lg,
    borderRadius: radios.xl,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieHundida,
  },
  cuerpo: { flex: 1, gap: espaciado.xs + 2 },
  titulo: {
    ...textos.subtitulo,
    fontSize: tipografia.tamano.md,
    lineHeight: tipografia.interlineado.md,
  },
  meta: textos.meta,
  chevron: {
    width: 26,
    height: 26,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieHundida,
  },
});
