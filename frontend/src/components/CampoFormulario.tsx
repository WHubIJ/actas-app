import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, espaciado, radios, textos, tipografia } from '../theme';

interface CampoFormularioProps {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  secreto?: boolean;
  tipoTeclado?: 'default' | 'email-address' | 'phone-pad';
}

/** Campo de formulario. Mismo lenguaje visual que Buscador: borde que cambia al enfocar, sin halo de sistema. */
export function CampoFormulario({
  etiqueta,
  valor,
  onCambiar,
  placeholder,
  secreto = false,
  tipoTeclado = 'default',
}: CampoFormularioProps) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={styles.campo}>
      <Text style={textos.etiqueta}>{etiqueta}</Text>
      <View style={[styles.campoEntrada, enfocado && styles.campoEnfocado]}>
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textoTerciario}
          secureTextEntry={secreto}
          keyboardType={tipoTeclado}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel={etiqueta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { gap: espaciado.sm },
  campoEntrada: {
    height: 52,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    justifyContent: 'center',
  },
  campoEnfocado: { borderColor: colors.acento },
  input: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    color: colors.textoPrincipal,
    outlineStyle: 'none',
  } as never,
});
