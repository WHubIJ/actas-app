import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type ViewProps } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import type { ColorName } from '../../theme/tokens';

/* ── Badge ─────────────────────────────────────────────────────────────── */
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'outline';
const TONE: Record<BadgeTone, { bg: ColorName | null; fg: ColorName }> = {
  neutral: { bg: 'surface2', fg: 'text2' },
  brand: { bg: 'brandSoft', fg: 'brandStrong' },
  success: { bg: 'successSoft', fg: 'success' },
  warning: { bg: 'warningSoft', fg: 'warning' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
  outline: { bg: null, fg: 'text2' },
};

/** Estado en una o dos palabras. Siempre palabra (y si hace falta icono), nunca solo color. */
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: (color: string) => React.ReactNode }) {
  const t = useTheme();
  const s = TONE[tone];
  return (
    <View
      style={{
        height: 22,
        paddingHorizontal: 9,
        borderRadius: t.radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: s.bg ? t.colors[s.bg] : 'transparent',
        borderWidth: s.bg ? 0 : 1,
        borderColor: t.colors.borderStrong,
      }}
    >
      {icon?.(t.colors[s.fg])}
      <Text variant="label" color={s.fg} style={{ fontSize: 12, lineHeight: 14 }}>
        {label}
      </Text>
    </View>
  );
}

/* ── Card ──────────────────────────────────────────────────────────────── */
/** Solo para colecciones (lista de reuniones). Dentro de una pantalla, separa con espacio y hairlines. */
export function Card({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.lg, padding: t.spacing[5] },
        style,
      ]}
    />
  );
}

/* ── AIMark: la marca de la IA (tres cápsulas), nunca una estrella ───────── */
export function AIMark({ size = 16, color }: { size?: number; color?: string }) {
  const t = useTheme();
  const c = color ?? t.colors.brand;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={7} y1={10} x2={7} y2={14} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={12} y1={6} x2={12} y2={18} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={17} y1={8.5} x2={17} y2={15.5} stroke={c} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/* ── LiveIndicator: "Grabando" con pulso. Grabar es violeta, nunca rojo ── */
export type LiveIndicatorTone = 'soft' | 'solid' | 'off';
/** `off` es "en pausa": mismo pill, sin pulso, en gris neutro (ver `.ma-live-off`). */
export function LiveIndicator({ label = 'Grabando', time, tone = 'soft' }: { label?: string; time?: string; tone?: LiveIndicatorTone }) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (tone === 'off') return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.bezier(...t.easing.standard), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, t.easing.standard, tone]);

  const bg = tone === 'solid' ? t.colors.brand : tone === 'off' ? t.colors.surface2 : t.colors.brandSoft;
  const fg: ColorName = tone === 'solid' ? 'onBrand' : tone === 'off' ? 'text2' : 'brandStrong';
  const dot = tone === 'solid' ? t.colors.onBrand : tone === 'off' ? t.colors.text3 : t.colors.brand;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={time ? `${label}, ${time}` : label}
      style={{
        height: 26,
        paddingLeft: 9,
        paddingRight: 11,
        borderRadius: t.radius.full,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
      }}
    >
      <View style={{ width: 8, height: 8 }}>
        {tone !== 'off' && (
          <Animated.View
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              backgroundColor: dot,
              opacity: pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 2.6, 2.6] }) }],
            }}
          />
        )}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      </View>
      <Text variant="overline" color={fg} style={{ fontSize: 11, letterSpacing: 0.77 }}>
        {label}
      </Text>
      {time && (
        <Text variant="metadataStrong" color={fg}>
          {time}
        </Text>
      )}
    </View>
  );
}

/* ── Waveform: el motivo de MeetingAI (cápsulas verticales de 3px) ──────── */
/** `levels`: valores 0..1 del nivel de audio real (no animación decorativa). `played`: índice hasta el que se ha reproducido. */
export function Waveform({ levels, height = 32, played, idle }: { levels: number[]; height?: number; played?: number; idle?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {levels.map((v, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: Math.max(3, Math.min(1, v) * height),
            borderRadius: t.radius.full,
            backgroundColor: idle || (played !== undefined && i >= played) ? t.colors.borderStrong : t.colors.brand,
          }}
        />
      ))}
    </View>
  );
}
