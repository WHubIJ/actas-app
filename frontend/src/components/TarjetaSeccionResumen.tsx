import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Text } from '../../components/ui';
import type { SeccionResumen } from '../types';

interface Props {
  seccion: SeccionResumen;
  /** `false` la pinta sin tarjeta, para cuando ya va dentro de un contenedor (`ma-generated`). */
  enmarcada?: boolean;
}

/** Bloque del resumen: encabezado y sus puntos, cada uno con su viñeta. */
export function TarjetaSeccionResumen({ seccion, enmarcada = true }: Props) {
  const t = useTheme();
  const contenido = (
    <>
      <Text variant="overline" color="text2">
        {seccion.titulo}
      </Text>
      <PuntosResumen puntos={seccion.puntos} />
    </>
  );

  if (!enmarcada) return <View style={{ gap: t.spacing[3] }}>{contenido}</View>;
  return <Card style={{ gap: t.spacing[3] }}>{contenido}</Card>;
}

/** Puntos con viñeta a `bodyLg`; también los usa `DocumentoActa`. */
export function PuntosResumen({ puntos }: { puntos: ReadonlyArray<string> }) {
  const t = useTheme();
  // La viñeta se centra en la primera línea: mitad del interlineado menos mitad del punto.
  const margenVineta = (t.typography.bodyLg.lineHeight - 5) / 2;
  return (
    <View style={{ gap: t.spacing[3] }}>
      {puntos.map((punto, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: t.spacing[3] }}>
          <View style={{ width: 5, height: 5, borderRadius: t.radius.full, backgroundColor: t.colors.brand, marginTop: margenVineta, flexShrink: 0 }} />
          <Text variant="bodyLg" style={{ flex: 1 }}>
            {punto}
          </Text>
        </View>
      ))}
    </View>
  );
}
