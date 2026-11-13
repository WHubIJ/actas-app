import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, AIMark } from '../../components/ui';
import { formatearMinutos } from '../utils/formato';
import { PuntosResumen } from './TarjetaSeccionResumen';
import type { ActaDetalle, SeccionResumen } from '../types';

interface Props {
  acta: Pick<ActaDetalle, 'titulo' | 'fecha' | 'duracionMinutos' | 'participantes'>;
  secciones: ReadonlyArray<SeccionResumen>;
  /** Nombre de la organización si se conoce; sin él el encabezado dice solo "Acta". */
  organizacion: string | null;
  amplio: boolean;
}

/**
 * Resumen con plantilla ACTA_FORMAL presentado como documento (`ma-doc`,
 * `MinutesScreen.html`). Solo metadatos reales: el kit trae hora, lugar,
 * cargos y número de acta, que la reunión no guarda.
 */
export function DocumentoActa({ acta, secciones, organizacion, amplio }: Props) {
  const t = useTheme();
  const asistentes = acta.participantes.length > 0 ? acta.participantes.join(', ') : 'Sin registrar';
  const meta: ReadonlyArray<[string, string]> = [
    ['Fecha', acta.fecha],
    ['Duración', formatearMinutos(acta.duracionMinutos)],
    ['Asistentes', asistentes],
  ];

  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: amplio ? t.radius.xl : t.radius.lg,
        paddingVertical: amplio ? t.spacing[12] : t.spacing[6],
        paddingHorizontal: amplio ? t.spacing[16] : t.spacing[5],
        boxShadow: t.shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing[3], flexWrap: 'wrap' }}>
        <Text variant="overline" color="text2">
          {organizacion ? `${organizacion} · Acta` : 'Acta'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[1] + 2 }}>
          <AIMark size={t.size.iconSm - 2} />
          <Text variant="label" color="brandStrong">
            Borrador generado · revísalo
          </Text>
        </View>
      </View>

      <Text variant="title" style={{ marginTop: t.spacing[3] }}>
        {acta.titulo}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.spacing[10], rowGap: t.spacing[3], marginTop: t.spacing[4] }}>
        {meta.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={{ gap: 2, maxWidth: '100%' }}>
            <Text variant="caption" color="text2">
              {etiqueta}
            </Text>
            <Text variant="bodyStrong">{valor}</Text>
          </View>
        ))}
      </View>

      {secciones.map((seccion) => (
        <View key={seccion.id} style={{ marginTop: t.spacing[8], gap: t.spacing[3] }}>
          <Text variant="overline" color="text2" accessibilityRole="header">
            {seccion.titulo}
          </Text>
          <PuntosResumen puntos={seccion.puntos} />
        </View>
      ))}
    </View>
  );
}
