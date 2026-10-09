import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Check, Clock, LoaderCircle, TriangleAlert } from 'lucide-react-native';
import { Badge, type BadgeTone } from './misc';
import type { EstadoTranscripcion } from '../../src/types';

const ICON_SIZE = 13;

/** Spinner animado: único estado que se mueve, el resto es un icono fijo. */
function IconoGirando({ color }: { color: string }) {
  const giro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [giro]);
  const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <LoaderCircle size={ICON_SIZE} color={color} strokeWidth={2} />
    </Animated.View>
  );
}

const PRESENTACION: Record<EstadoTranscripcion, { label: string; tone: BadgeTone; icon: (c: string) => React.ReactNode }> = {
  COMPLETADA: { label: 'Procesado por IA', tone: 'success', icon: (c) => <Check size={ICON_SIZE} color={c} strokeWidth={2} /> },
  EN_PROCESO: { label: 'Procesando', tone: 'brand', icon: (c) => <IconoGirando color={c} /> },
  FALLIDA: { label: 'Error', tone: 'danger', icon: (c) => <TriangleAlert size={ICON_SIZE} color={c} strokeWidth={2} /> },
  PENDIENTE: { label: 'En cola', tone: 'neutral', icon: (c) => <Clock size={ICON_SIZE} color={c} strokeWidth={2} /> },
};

export function BadgeEstado({ estado }: { estado: EstadoTranscripcion }) {
  const { label, tone, icon } = PRESENTACION[estado];
  return <Badge label={label} tone={tone} icon={icon} />;
}
