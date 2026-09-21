import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { MagnifyingGlassIcon, XCircleIcon } from 'phosphor-react-native';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
}

/**
 * Campo de búsqueda. El borde cambia al enfocar en lugar de añadir un halo:
 * sobre un fondo cálido un `outline` azul de sistema rompe toda la paleta.
 */
export function Buscador({ valor, onCambiar, placeholder = 'Buscar reuniones...' }: Props) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[styles.contenedor, enfocado && styles.enfocado]}>
      <MagnifyingGlassIcon
        size={18}
        weight="bold"
        color={enfocado ? colors.marronClaro : colors.textoTerciario}
      />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textoTerciario}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onCambiar('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
          <XCircleIcon size={18} weight="fill" color={colors.textoTerciario} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    height: 52,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  enfocado: { borderColor: colors.acento },
  input: {
    flex: 1,
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    color: colors.textoPrincipal,
    // Quita el contorno azul del input en react-native-web.
    outlineStyle: 'none',
  } as never,
});
