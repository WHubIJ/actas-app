import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AudioLines, FileText } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, BadgeEstado } from '../../components/ui';
import { agruparPorPeriodo, fechaCorta } from '../utils/filtrosReuniones';
import { formatearMinutos } from '../utils/formato';
import type { ActaResumen } from '../types';

/** `ma-m-tile` y `ma-m-row`: medidas del kit que no son token. */
const LADO_BALDOSA = 40;
const ALTO_MINIMO_FILA = 64;

interface Props {
  actas: ReadonlyArray<ActaResumen>;
  onAbrir: (acta: ActaResumen) => void;
}

/**
 * Reuniones agrupadas por periodo ("Esta semana", "Septiembre"...), una fila
 * por reunión con su estado: la vista de Inicio en escritorio, sacada de la
 * primera pantalla de `MobileScreens`.
 */
export function ListaAgrupadaReuniones({ actas, onAbrir }: Props) {
  const t = useTheme();
  const grupos = useMemo(() => agruparPorPeriodo(actas, new Date()), [actas]);

  return (
    <View>
      {grupos.map((grupo) => (
        <View key={grupo.titulo}>
          <Text variant="overline" color="text2" style={{ marginTop: t.spacing[6], marginBottom: t.spacing[1] }} accessibilityRole="header">
            {grupo.titulo}
          </Text>
          {grupo.actas.map((acta) => (
            <Fila key={acta.id} acta={acta} onPress={() => onAbrir(acta)} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Fila({ acta, onPress }: { acta: ActaResumen; onPress: () => void }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  // La baldosa se tiñe solo mientras la IA trabaja, como el resto de acentos de marca.
  const enCurso = acta.estadoTranscripcion === 'EN_PROCESO';
  const Icono = acta.estadoTranscripcion === 'COMPLETADA' ? FileText : AudioLines;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      accessibilityLabel={`${acta.titulo}, ${acta.fecha}, ${formatearMinutos(acta.duracionMinutos)}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: ALTO_MINIMO_FILA,
        paddingVertical: t.spacing[3],
        // Mismo truco que la tabla: relleno para el hover y margen negativo para alinear el texto.
        paddingHorizontal: t.spacing[3],
        marginHorizontal: -t.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
        backgroundColor: pressed ? t.colors.fillPress : hover ? t.colors.fillHover : 'transparent',
      })}
    >
      <View
        style={{
          width: LADO_BALDOSA,
          height: LADO_BALDOSA,
          borderRadius: t.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: enCurso ? t.colors.brandSoft : t.colors.surface2,
        }}
      >
        <Icono size={t.size.iconMd} color={enCurso ? t.colors.brandStrong : t.colors.text2} strokeWidth={1.6} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {acta.titulo}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1}>
          {fechaCorta(acta)} ·{' '}
          <Text variant="metadata" color="text2">
            {formatearMinutos(acta.duracionMinutos)}
          </Text>
        </Text>
      </View>
      {/* `Badge` se alinea arriba (`alignSelf: 'flex-start'`); envuelto, queda centrado con la fila. */}
      <View>
        <BadgeEstado estado={acta.estadoTranscripcion} />
      </View>
    </Pressable>
  );
}
