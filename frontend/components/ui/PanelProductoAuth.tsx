import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { Mic, Upload } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { AIMark, LiveIndicator, Waveform } from './misc';

const PASOS = [
  { Icono: Mic, titulo: 'Graba la reunión', descripcion: 'Web, escritorio o móvil' },
  { Icono: AIMark, titulo: 'Revisa el acta generada', descripcion: 'Decisiones y tareas con su timecode' },
  { Icono: Upload, titulo: 'Apruébala y compártela', descripcion: 'PDF, Word o Markdown' },
] as const;

const INICIALES_ILUSTRATIVAS = ['ML', 'JR', 'AP'];

/** Forma inicial de la onda: una campana suave, sin audio real detrás. */
const NIVELES_INICIALES = Array.from({ length: 64 }, (_, i) => 0.15 + 0.6 * Math.sin((Math.PI * (i + 0.5)) / 64));

/**
 * Mismo truco que la onda decorativa de `GrabacionScreen`: campana con
 * amplitud aleatoria por barra. Se duplica aquí porque esa función es privada
 * de esa pantalla y esta tarjeta es ilustrativa, nunca el estado real de una
 * grabación (esta pantalla es previa al login).
 */
function nivelesIlustrativosAleatorios(): number[] {
  return NIVELES_INICIALES.map((_, i) => {
    const envolvente = Math.sin((Math.PI * (i + 0.5)) / NIVELES_INICIALES.length);
    return Math.max(0.08, Math.min(1, envolvente * (0.4 + Math.random() * 0.6)));
  });
}

function AvataresIlustrativos() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {INICIALES_ILUSTRATIVAS.map((iniciales, i) => (
        <View
          key={iniciales}
          style={{
            width: 22,
            height: 22,
            borderRadius: t.radius.full,
            marginLeft: i === 0 ? 0 : -6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
            boxShadow: i === 0 ? `inset 0 0 0 1px ${t.colors.border}` : `0 0 0 2px ${t.colors.bg}`,
            zIndex: INICIALES_ILUSTRATIVAS.length - i,
          }}
        >
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 9.5, lineHeight: 12 }} color="text2">
            {iniciales}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Panel `surface-2` del lado derecho en el acceso de escritorio, compartido por
 * login, registro y recuperación. Muestra el producto: una grabación en curso y
 * el acta que genera. Es ilustrativo y no lee estado real (la pantalla es
 * previa a la sesión); sin testimonios ni cifras inventadas.
 */
export function PanelProductoAuth() {
  const t = useTheme();

  // Un solo movimiento continuo por pantalla (la onda); con "reducir movimiento"
  // la onda se queda quieta en su forma inicial.
  const [niveles, setNiveles] = useState(NIVELES_INICIALES);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    let cancelado = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (cancelado || reducir) return;
      id = setInterval(() => setNiveles(nivelesIlustrativosAleatorios()), 220);
    });
    return () => {
      cancelado = true;
      if (id) clearInterval(id);
    };
  }, []);

  const tarjeta = {
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing[5],
    boxShadow: t.shadows.md,
  } as const;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flex: 1,
        margin: t.spacing[4],
        marginLeft: 0,
        borderRadius: t.radius.xl,
        backgroundColor: t.colors.surface2,
        justifyContent: 'center',
        overflow: 'hidden',
        padding: t.spacing[12],
        gap: t.spacing[6],
      }}
    >
      <View style={tarjeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <LiveIndicator label="Grabando" time="00:42:17" />
          <AvataresIlustrativos />
        </View>
        <View style={{ marginTop: t.spacing[4], height: 48, overflow: 'hidden' }}>
          <Waveform levels={niveles} height={48} />
        </View>
      </View>

      <View style={[tarjeta, { marginLeft: t.spacing[10], gap: t.spacing[3] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
          <AIMark size={14} />
          <Text variant="label" color="brandStrong" style={{ fontSize: 12, lineHeight: 16 }}>
            Acta lista para revisar
          </Text>
          <Text variant="metadata" color="text3" style={{ marginLeft: 'auto' }}>
            3 decisiones · 3 tareas
          </Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 21 }}>
          La junta aprobó el presupuesto de mantenimiento del Q4 y decidió renovar el sistema de sonido antes de diciembre.
        </Text>
      </View>

      <View style={{ gap: t.spacing[4], marginTop: t.spacing[3] }}>
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
              <Icono size={20} color={t.colors.text2} strokeWidth={1.6} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text variant="bodyStrong" style={{ lineHeight: 20 }}>
                {titulo}
              </Text>
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
