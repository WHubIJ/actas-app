import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
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

/** Forma inicial de la onda de la tarjeta ilustrativa — no hay audio real detrás. */
const NIVELES_ILUSTRATIVOS = [0.3, 0.6, 0.9, 0.5, 0.8, 1, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 1, 0.5, 0.7, 0.4, 0.9, 0.6, 0.8, 0.3, 0.6];

/**
 * Mismo truco que la onda decorativa de `GrabacionScreen` (campana con
 * amplitud aleatoria por barra, sin leer audio real): se duplica aquí en vez
 * de importarla porque esa función es privada de esa pantalla y esta tarjeta
 * es puramente ilustrativa, nunca el estado real de una grabación en curso
 * (ver comentario de `Waveform` en `misc.tsx` — `levels` ahí se documenta
 * como nivel real, por eso la animación vive en el llamador, no en el
 * componente).
 */
function nivelesIlustrativosAleatorios(): number[] {
  return NIVELES_ILUSTRATIVOS.map((_, i) => {
    const envolvente = Math.sin((Math.PI * (i + 0.5)) / NIVELES_ILUSTRATIVOS.length);
    return Math.max(0.08, Math.min(1, envolvente * (0.4 + Math.random() * 0.6)));
  });
}

/**
 * Líneas-cápsula con shimmer para el estado "generando" de la tarjeta de
 * acta — mismo efecto que `FilaEsqueleto` (pulso de color entre
 * `fillPress`/`fillHover`, `useNativeDriver: false` porque un color nunca
 * admite driver nativo), pero reimplementado aquí en vez de reutilizado:
 * `FilaEsqueleto` tiene la forma de una fila de "Mis actas" (avatar + 2+2
 * líneas), no la de esta tarjeta, y esta pantalla es ilustrativa, no una
 * lista real.
 */
function LineasGenerando() {
  const t = useTheme();
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulso, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [pulso]);

  const relleno = pulso.interpolate({ inputRange: [0, 1], outputRange: [t.colors.fillPress, t.colors.fillHover] });
  const linea = (ancho: `${number}%`) => (
    <Animated.View style={{ height: 8, borderRadius: t.radius.full, backgroundColor: relleno, width: ancho }} />
  );

  return (
    <View style={{ gap: t.spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
        <AIMark size={14} />
        <Text variant="label" color="brandStrong">
          Redactando el acta
        </Text>
      </View>
      <View style={{ gap: t.spacing[2] }}>
        {linea('90%')}
        {linea('70%')}
        {linea('80%')}
      </View>
    </View>
  );
}

/**
 * Panel `surface-2` del lado derecho en login/registro de escritorio.
 * Compartido entre las dos pantallas: mismo pitch de producto en ambas.
 * Las tarjetas de "grabando" y "acta lista" son ilustrativas (mismos
 * componentes que usa GrabacionScreen de verdad, con datos inventados) —
 * nunca se leen como estado real porque esta pantalla es previa al login.
 */
export function PanelProductoAuth() {
  const t = useTheme();

  // Onda: se regenera entera cada tick (mismo intervalo que GrabacionScreen,
  // ver `nivelesIlustrativosAleatorios`) en vez de animarse con `Animated`
  // — así cada barra se mueve de forma independiente, sin el efecto de
  // "todas a la vez" de interpolar un único valor.
  const [niveles, setNiveles] = useState(NIVELES_ILUSTRATIVOS);
  useEffect(() => {
    const id = setInterval(() => setNiveles(nivelesIlustrativosAleatorios()), 220);
    return () => clearInterval(id);
  }, []);

  // Un único Animated.Value lineal 0→1 a lo largo de todo el ciclo (igual
  // que el pulso de LiveIndicator), con las esperas y el cruce codificados
  // como tramos de `interpolate` — no con `Animated.sequence`/`Animated.delay`:
  // esa combinación, en react-native-web, deja de respetar las esperas y el
  // loop degenera en reinicios cada pocos fotogramas en vez de los ~4.4s
  // reales (comprobado con un listener temporal sobre el valor animado).
  // Un solo `timing` + `loop` es exactamente el patrón ya verificado en
  // AnilloCarga/BadgeEstado/LiveIndicator, así que hereda el mismo fix.
  const CICLO_MS = 4400;
  const FIN_GENERANDO = 1300 / CICLO_MS; // hasta aquí: overlay de shimmer tapando
  const FIN_CRUCE_A_LISTA = 1800 / CICLO_MS; // 500ms de cruce
  const FIN_LISTA = 3900 / CICLO_MS; // hasta aquí: acta revelada
  // el resto del ciclo (hasta 1) es el cruce de vuelta a "generando".

  const ciclo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(ciclo, { toValue: 1, duration: CICLO_MS, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [ciclo]);
  const opacidadGenerando = ciclo.interpolate({
    inputRange: [0, FIN_GENERANDO, FIN_CRUCE_A_LISTA, FIN_LISTA, 1],
    outputRange: [1, 1, 0, 0, 1],
  });

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
          <Waveform levels={niveles} height={32} />
        </View>

        <View
          style={{
            gap: t.spacing[2],
            padding: t.spacing[4],
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            // `position: relative` implícito: el overlay de abajo se ancla a
            // esta caja. El alto de la tarjeta lo sigue fijando el contenido
            // real (en flujo normal) — el overlay solo se superpone encima.
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

          {/* Tapa la tarjeta mientras "genera": al desvanecerse revela el
              contenido real de abajo sin necesidad de animar ese lado también. */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              padding: t.spacing[4],
              justifyContent: 'center',
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.surface,
              opacity: opacidadGenerando,
            }}
          >
            <LineasGenerando />
          </Animated.View>
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
