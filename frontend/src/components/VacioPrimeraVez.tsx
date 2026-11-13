import { View } from 'react-native';
import { Mic, AudioLines, Share2, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, EstadoVacio } from '../../components/ui';

/**
 * Los tres pasos de `EmptyWeb`, ajustados a lo que la app hace hoy: no hay
 * decisiones ni tareas extraídas ni aprobación de la junta, así que "Revisa"
 * y "Comparte" hablan solo de resumen, transcripción y formatos reales.
 */
const PASOS: ReadonlyArray<{ icono: LucideIcon; titulo: string; descripcion: string }> = [
  { icono: Mic, titulo: 'Graba', descripcion: 'Desde el navegador, el escritorio o el móvil' },
  { icono: AudioLines, titulo: 'Revisa', descripcion: 'Transcripción completa y resumen cuando lo pidas' },
  { icono: Share2, titulo: 'Comparte', descripcion: 'PDF, Word o Markdown desde el menú del sistema' },
];

/** Lado de la baldosa de cada paso (`ma-m-tile`), que el kit no expone como token. */
const LADO_BALDOSA = 40;

/**
 * Vacío de primera vez en escritorio (`EmptyWeb`): la invitación a grabar y,
 * debajo, qué pasa después, para que la promesa de la frase se entienda.
 */
export function VacioPrimeraVez({ onGrabar }: { onGrabar: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: t.spacing[10] }}>
      <EstadoVacio
        icono={Mic}
        titulo="Aún no tienes reuniones"
        descripcion="Graba tu primera reunión y tendrás la transcripción, el resumen y el acta en minutos."
        accion={{ titulo: 'Grabar reunión', onPress: onGrabar, icono: Mic }}
        style={{ paddingVertical: 0 }}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: t.spacing[6],
          maxWidth: 640,
          width: '100%',
          marginTop: t.spacing[10],
          paddingVertical: t.spacing[5],
          paddingHorizontal: t.spacing[6],
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.surface2,
        }}
      >
        {PASOS.map(({ icono: Icono, titulo, descripcion }) => (
          <View key={titulo} style={{ flex: 1, gap: t.spacing[2], alignItems: 'flex-start' }}>
            <View
              style={{
                width: LADO_BALDOSA,
                height: LADO_BALDOSA,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.colors.surface,
              }}
            >
              <Icono size={t.size.iconMd} color={t.colors.text2} strokeWidth={1.6} />
            </View>
            <Text variant="bodyStrong">{titulo}</Text>
            <Text variant="caption" color="text2">
              {descripcion}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
