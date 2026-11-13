import { Platform, Switch, View } from 'react-native';
import { FileText, FilePen, Hash, Link2, ScrollText, Share2, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button } from '../../components/ui';
import { Hoja } from './Hoja';
import { FilaOpcionRadio } from './FilaOpcionRadio';
import { etiquetaBotonCompartir, type DescripcionCompartir, type OpcionCompartir } from '../utils/detalleActa';

interface Props {
  visible: boolean;
  opciones: ReadonlyArray<DescripcionCompartir>;
  seleccionada: OpcionCompartir;
  onSeleccionar: (id: OpcionCompartir) => void;
  /** `null` si el enlace no se puede ofrecer (sin backend no hay servidor que lo sirva). */
  comoEnlace: boolean | null;
  onCambiarEnlace: (valor: boolean) => void;
  onConfirmar: () => void;
  onCerrar: () => void;
}

const ICONO: Record<OpcionCompartir, LucideIcon> = {
  ACTA_PDF: FileText,
  ACTA_WORD: FilePen,
  RESUMEN_MARKDOWN: Hash,
  TRANSCRIPCION_PDF: ScrollText,
};

/**
 * Hoja "Compartir acta" (`MobileScreens.html`, 3ª pantalla). El interruptor
 * del kit ("Incluir enlace para aprobar") no existe en el producto; en su
 * lugar va el enlace público de 24 h, que sí está implementado.
 */
export function HojaCompartir({
  visible,
  opciones,
  seleccionada,
  onSeleccionar,
  comoEnlace,
  onCambiarEnlace,
  onConfirmar,
  onCerrar,
}: Props) {
  const t = useTheme();
  const web = Platform.OS === 'web';
  const elegida = opciones.find((o) => o.id === seleccionada) ?? opciones[0];
  const enlace = comoEnlace === true;

  // En web no hay menú de compartir del sistema garantizado: el archivo se descarga.
  const explicacion = web
    ? 'Elige el formato. Después se descargará el archivo.'
    : 'Elige el formato. Después se abre el menú de compartir del teléfono.';
  const pie = enlace
    ? 'Quien lo abra descarga el archivo sin iniciar sesión.'
    : web
      ? null
      : 'WhatsApp, Gmail, Telegram y más';

  return (
    <Hoja visible={visible} onCerrar={onCerrar}>
      <Text variant="titleSm" accessibilityRole="header">
        Compartir acta
      </Text>
      <Text variant="caption" color="text2" style={{ marginTop: t.spacing[1] }}>
        {explicacion}
      </Text>

      <View accessibilityRole="radiogroup" style={{ marginTop: t.spacing[2] }}>
        {opciones.map((opcion, i) => (
          <FilaOpcionRadio
            key={opcion.id}
            titulo={opcion.titulo}
            descripcion={opcion.descripcion}
            icono={ICONO[opcion.id]}
            activa={opcion.id === elegida?.id}
            onPress={() => onSeleccionar(opcion.id)}
            ultima={i === opciones.length - 1 && comoEnlace === null}
          />
        ))}
      </View>

      {comoEnlace !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[4], paddingVertical: t.spacing[4] }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="body">Enlace de 24 h</Text>
            <Text variant="caption" color="text2">
              En vez del archivo, un enlace que caduca en 24 h.
            </Text>
          </View>
          <Switch
            value={enlace}
            onValueChange={onCambiarEnlace}
            accessibilityLabel="Compartir como enlace de 24 h"
            trackColor={{ false: t.colors.borderStrong, true: t.colors.brand }}
          />
        </View>
      )}

      {elegida && (
        <View style={{ marginTop: comoEnlace === null ? t.spacing[5] : 0, gap: t.spacing[3] }}>
          <Button
            label={etiquetaBotonCompartir(elegida.formato, enlace)}
            size="xl"
            fullWidth
            icon={(c) => (enlace ? <Link2 size={18} color={c} strokeWidth={1.6} /> : <Share2 size={18} color={c} strokeWidth={1.6} />)}
            onPress={onConfirmar}
          />
          {pie && (
            <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
              {pie}
            </Text>
          )}
        </View>
      )}
    </Hoja>
  );
}
