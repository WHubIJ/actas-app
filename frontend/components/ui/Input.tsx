import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label: string;
  /** Ayuda bajo el campo. Si hay `error`, se muestra el error en su lugar. */
  help?: string;
  /** Texto de error: qué falta y cómo arreglarlo. */
  error?: string;
  /** Icono a la izquierda; recibe el color correcto. */
  icon?: (color: string) => React.ReactNode;
  /** Elemento a la derecha (p. ej. mostrar/ocultar contraseña). */
  right?: React.ReactNode;
  /** 36 en formularios de escritorio, 44 en acceso y móvil. */
  height?: 36 | 44;
};

export function Input({ label, help, error, icon, right, height = 44, onFocus, onBlur, style, ...rest }: InputProps) {
  const t = useTheme();
  const c = t.colors;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.danger : focused ? c.brand : c.borderStrong;
  const halo = error ? c.dangerSoft : focused ? c.brandSoft : 'transparent';

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing[2],
          paddingHorizontal: t.spacing[3],
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor,
          backgroundColor: c.surface,
          boxShadow: `0 0 0 3px ${halo}`,
        }}
      >
        {icon?.(c.text2)}
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={c.text3}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[t.typography.body, { flex: 1, color: c.text, fontSize: 15, paddingVertical: 0 }, style]}
        />
        {right}
      </View>
      {(error || help) && (
        <Text variant="caption" color={error ? 'danger' : 'text2'}>
          {error ?? help}
        </Text>
      )}
    </View>
  );
}
