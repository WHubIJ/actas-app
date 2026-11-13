import { useState, type Ref } from 'react';
import { View, TextInput, Pressable, Platform, type ViewStyle } from 'react-native';
import { Search, CircleX } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  /** Para enfocarlo desde fuera (buscador del `Sidebar`, Cmd/Ctrl+K: ver `busquedaGlobal`). */
  ref?: Ref<TextInput>;
  /** Campo de escritorio (`ma-input`, 36px) con el atajo de teclado a la derecha; sin él, el de móvil (40px). */
  escritorio?: boolean;
  style?: ViewStyle;
}

/** Medidas del buscador móvil del kit (`ActasMobile`: 40px, radio 12) que no son token. */
const ALTO_MOVIL = 40;
const RADIO_MOVIL = 12;

/** Campo de búsqueda. El borde cambia al enfocar en vez de añadir un halo. */
export function Buscador({ valor, onCambiar, placeholder = 'Buscar reuniones...', ref, escritorio = false, style }: Props) {
  const t = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const mostrarAtajo = escritorio && Platform.OS === 'web' && valor.length === 0;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing[2],
          height: escritorio ? t.size.controlMd : ALTO_MOVIL,
          paddingHorizontal: t.spacing[3],
          borderRadius: escritorio ? t.radius.md : RADIO_MOVIL,
          backgroundColor: t.colors.surface2,
          borderWidth: 1,
          borderColor: enfocado ? t.colors.brand : 'transparent',
        },
        style,
      ]}
    >
      <Search size={escritorio ? t.size.iconSm : 18} color={enfocado ? t.colors.brand : t.colors.text2} strokeWidth={1.6} />
      <TextInput
        ref={ref}
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text3}
        style={[
          t.typography.body,
          escritorio && { fontSize: 14 },
          { flex: 1, minWidth: 0, color: t.colors.text, outlineStyle: 'none' } as never,
        ]}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {mostrarAtajo && <TeclaAtajo />}
      {valor.length > 0 && (
        <Pressable onPress={() => onCambiar('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
          <CircleX size={18} color={t.colors.text3} strokeWidth={1.6} />
        </Pressable>
      )}
    </View>
  );
}

/** `ma-kbd`: el mismo atajo que abre la búsqueda desde el `Sidebar`. */
function TeclaAtajo() {
  const t = useTheme();
  const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <View
      style={{
        paddingHorizontal: 5,
        borderRadius: t.radius.xs,
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.surface2,
      }}
    >
      <Text variant="metadata" color="text2" style={{ fontSize: 11, lineHeight: 16 }}>
        {esMac ? '⌘K' : 'Ctrl K'}
      </Text>
    </View>
  );
}
