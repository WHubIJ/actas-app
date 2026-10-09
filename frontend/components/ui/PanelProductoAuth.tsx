import React from 'react';
import { View } from 'react-native';
import { Mic, Upload } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { AIMark } from './misc';

const PASOS = [
  { Icono: Mic, titulo: 'Graba la reunión', descripcion: 'Web, escritorio o móvil' },
  { Icono: AIMark, titulo: 'Revisa el acta generada', descripcion: 'Decisiones y tareas con su timecode' },
  { Icono: Upload, titulo: 'Apruébala y compártela', descripcion: 'PDF, Word o Markdown' },
] as const;

/**
 * Panel `surface-2` del lado derecho en login/registro de escritorio.
 * Compartido entre las dos pantallas: mismo pitch de producto en ambas.
 * No incluye las tarjetas decorativas de "grabando en vivo" / "acta
 * generada" del preview — son maquetas con datos inventados, no estado real.
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
