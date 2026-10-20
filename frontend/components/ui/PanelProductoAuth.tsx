import React from 'react';
import { View } from 'react-native';
import { Check, Mic, Upload } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { AIMark, LiveIndicator, Waveform } from './misc';

const PASOS = [
  { Icono: Mic, titulo: 'Graba la reunión', descripcion: 'Web, escritorio o móvil' },
  { Icono: AIMark, titulo: 'Revisa el acta generada', descripcion: 'Decisiones y tareas con su timecode' },
  { Icono: Upload, titulo: 'Apruébala y compártela', descripcion: 'PDF, Word o Markdown' },
] as const;

/** Niveles fijos solo para dibujar la onda de la tarjeta ilustrativa — no hay audio real detrás. */
const NIVELES_ILUSTRATIVOS = [0.3, 0.6, 0.9, 0.5, 0.8, 1, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 1, 0.5, 0.7, 0.4, 0.9, 0.6, 0.8, 0.3, 0.6];

/**
 * Panel `surface-2` del lado derecho en login/registro de escritorio.
 * Compartido entre las dos pantallas: mismo pitch de producto en ambas.
 * Las tarjetas de "grabando" y "acta lista" son ilustrativas (mismos
 * componentes que usa GrabacionScreen de verdad, con datos inventados) —
 * nunca se leen como estado real porque esta pantalla es previa al login.
 */
export function PanelProductoAuth() {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        margin: t.spacing[4],
        borderRadius: t.radius.xl,
        backgroundColor: t.colors.surface2,
        justifyContent: 'center',
        padding: t.spacing[12],
        gap: t.spacing[8],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
        <AppIcon size={20} />
        <Text variant="titleSm">MeetingAI</Text>
      </View>

      <View style={{ gap: t.spacing[3] }}>
        <View
          style={{
            gap: t.spacing[4],
            padding: t.spacing[4],
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <LiveIndicator label="Grabando" time="00:42:17" tone="solid" />
          <Waveform levels={NIVELES_ILUSTRATIVOS} height={32} />
        </View>

        <View
          style={{
            gap: t.spacing[2],
            padding: t.spacing[4],
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: t.radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.colors.successSoft,
              }}
            >
              <Check size={13} color={t.colors.success} strokeWidth={2.5} />
            </View>
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              Acta lista para revisar
            </Text>
          </View>
          <Text variant="caption" color="text2">
            3 decisiones · 3 tareas
          </Text>
          <Text variant="caption" color="text2">
            La junta aprobó el presupuesto de mantenimiento del Q4 y decidió renovar el sistema de sonido antes de
            diciembre.
          </Text>
        </View>
      </View>

      <View style={{ gap: t.spacing[5] }}>
        {PASOS.map(({ Icono, titulo, descripcion }) => (
          <View key={titulo} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[4] }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: t.radius.md + 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.colors.surface,
              }}
            >
              <Icono size={20} color={t.colors.text} />
            </View>
            <View style={{ gap: 2 }}>
              <Text variant="bodyStrong">{titulo}</Text>
              <Text variant="caption" color="text2">
                {descripcion}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
