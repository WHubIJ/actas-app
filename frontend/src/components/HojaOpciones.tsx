import { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, type Icon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';

export interface OpcionHoja<T extends string> {
  id: T;
  titulo: string;
  descripcion?: string;
  icono?: Icon;
}

interface Props<T extends string> {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  opciones: ReadonlyArray<OpcionHoja<T>>;
  /** Marca una opción con un check. Omitir si la hoja solo dispara acciones. */
  seleccionada?: T;
  onSeleccionar: (id: T) => void;
  onCerrar: () => void;
}

/**
 * Hoja inferior de opciones. Una sola implementación para elegir plantilla de
 * resumen y formato de exportación: ambas son la misma interacción y tenerlas
 * duplicadas garantizaría que se desincronizaran.
 */
export function HojaOpciones<T extends string>({
  visible,
  titulo,
  descripcion,
  opciones,
  seleccionada,
  onSeleccionar,
  onCerrar,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const entrada = useRef(new Animated.Value(0)).current;
  // Un valor de entrada por opción, para escalonar su aparición en vez de que
  // toda la lista aparezca de golpe.
  const entradaOpciones = useRef(new Map(opciones.map((o) => [o.id, new Animated.Value(0)]))).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (visible) {
      opciones.forEach((o) => entradaOpciones.get(o.id)?.setValue(0));
      Animated.stagger(
        40,
        opciones.map((o) =>
          Animated.timing(entradaOpciones.get(o.id)!, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
  }, [visible, entrada, opciones, entradaOpciones]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Animated.View style={[styles.velo, { opacity: entrada }]}>
        {/* El velo cierra al pulsar fuera; la hoja detiene la propagación. */}
        <Pressable style={styles.veloPulsable} onPress={onCerrar} accessibilityLabel="Cerrar" />
      </Animated.View>

      <Animated.View
        style={[
          styles.hoja,
          {
            paddingBottom: Math.max(insets.bottom, espaciado.xl),
            transform: [
              { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.asa} />

        <View style={styles.encabezado}>
          <Text style={textos.subtitulo}>{titulo}</Text>
          {descripcion && <Text style={textos.apoyo}>{descripcion}</Text>}
        </View>

        <View style={styles.opciones}>
          {opciones.map((opcion) => {
            const activa = opcion.id === seleccionada;
            const Icono = opcion.icono;
            const entradaOpcion = entradaOpciones.get(opcion.id)!;
            return (
              <Animated.View
                key={opcion.id}
                style={{
                  opacity: entradaOpcion,
                  transform: [
                    { translateY: entradaOpcion.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                  ],
                }}
              >
                <PressableEscala
                  onPress={() => onSeleccionar(opcion.id)}
                  escala={0.98}
                  style={[styles.opcion, activa && styles.opcionActiva]}
                  accessibilityLabel={opcion.titulo}
                  accessibilityState={{ selected: activa }}
                >
                  {Icono && (
                    <View style={styles.icono}>
                      <Icono size={19} weight="regular" color={colors.marronClaro} />
                    </View>
                  )}

                  <View style={styles.cuerpo}>
                    <Text style={styles.opcionTitulo} numberOfLines={1}>
                      {opcion.titulo}
                    </Text>
                    {opcion.descripcion && (
                      <Text style={textos.meta} numberOfLines={2}>
                        {opcion.descripcion}
                      </Text>
                    )}
                  </View>

                  {activa && (
                    <View style={styles.check}>
                      <CheckIcon size={13} weight="bold" color={colors.textoInverso} />
                    </View>
                  )}
                </PressableEscala>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(44, 24, 16, 0.38)',
  },
  veloPulsable: { flex: 1 },
  hoja: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: espaciado.md,
    paddingHorizontal: espaciado.xl,
    borderTopLeftRadius: radios.xxl,
    borderTopRightRadius: radios.xxl,
    backgroundColor: colors.crema,
    ...sombras.elevada,
  },
  asa: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radios.pill,
    backgroundColor: colors.bordeFuerte,
    marginBottom: espaciado.xl,
  },
  encabezado: { gap: espaciado.xs, marginBottom: espaciado.xl },
  opciones: { gap: espaciado.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.lg,
    padding: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  opcionActiva: { borderColor: colors.acento },
  icono: {
    width: 38,
    height: 38,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieHundida,
  },
  cuerpo: { flex: 1, gap: 1 },
  opcionTitulo: {
    ...textos.accion,
    fontFamily: tipografia.familia.bold,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.acento,
  },
});
