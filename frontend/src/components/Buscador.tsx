import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, CircleX } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
}

/** Campo de búsqueda. El borde cambia al enfocar en vez de añadir un halo. */
export function Buscador({ valor, onCambiar, placeholder = 'Buscar reuniones...' }: Props) {
  const t = useTheme();
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[2],
        height: 40,
        paddingHorizontal: t.spacing[3],
        borderRadius: 12,
        backgroundColor: t.colors.surface2,
        borderWidth: 1,
        borderColor: enfocado ? t.colors.brand : 'transparent',
      }}
    >
      <Search size={18} color={enfocado ? t.colors.brand : t.colors.text3} strokeWidth={2} />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={placeholder}
        placeholderTextColor={t.colors.text3}
        style={[t.typography.body, { flex: 1, color: t.colors.text, outlineStyle: 'none' } as never]}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onCambiar('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
          <CircleX size={18} color={t.colors.text3} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
