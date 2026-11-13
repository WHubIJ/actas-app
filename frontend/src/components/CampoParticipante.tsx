import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui';

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  onAnadir: () => void;
}

/** Campo sin etiqueta propia: el título de la sección "Participantes" ya lo describe. */
export function CampoParticipante({ valor, onCambiar, onAnadir }: Props) {
  const t = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const hayTexto = valor.trim().length > 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[2],
        height: t.size.controlLg,
        paddingLeft: t.spacing[3],
        paddingRight: hayTexto ? t.spacing[1] : t.spacing[3],
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: enfocado ? t.colors.brand : t.colors.borderStrong,
        backgroundColor: t.colors.surface,
        boxShadow: `0 0 0 3px ${enfocado ? t.colors.brandSoft : 'transparent'}`,
      }}
    >
      <Plus size={20} color={t.colors.text2} strokeWidth={1.6} />
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        onSubmitEditing={onAnadir}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder="Añadir participante"
        placeholderTextColor={t.colors.text3}
        returnKeyType="done"
        // Sin esto el teclado se cierra tras cada nombre y obliga a volver a tocar el campo.
        blurOnSubmit={false}
        accessibilityLabel="Añadir participante"
        style={[t.typography.body, { flex: 1, color: t.colors.text, fontSize: 15, paddingVertical: 0, outlineStyle: 'none' } as never]}
      />
      {hayTexto && <Button label="Añadir" variant="ghost" size="md" onPress={onAnadir} />}
    </View>
  );
}
