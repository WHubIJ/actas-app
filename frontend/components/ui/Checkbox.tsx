import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  const t = useTheme();
  const c = t.colors;
  // La caja mide 18px; el hitSlop vertical completa los 44px (`touchMin`) sin separar las filas.
  const margenTactil = (t.size.touchMin - 20) / 2;

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      hitSlop={{ top: margenTactil, bottom: margenTactil, left: t.spacing[2], right: t.spacing[2] }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          marginTop: 1,
          borderRadius: t.radius.xs + 1,
          borderWidth: 1.5,
          borderColor: checked ? c.brand : c.borderStrong,
          backgroundColor: checked ? c.brand : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={13} color={c.onBrand} strokeWidth={2.4} />}
      </View>
      <Text variant="caption" color="text2" style={{ flex: 1, fontSize: 13.5, lineHeight: 20 }}>
        {label}
      </Text>
    </Pressable>
  );
}
