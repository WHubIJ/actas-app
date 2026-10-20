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

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2], opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: t.radius.sm,
          borderWidth: 1,
          borderColor: checked ? c.brand : c.borderStrong,
          backgroundColor: checked ? c.brand : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={13} color={c.onBrand} strokeWidth={3} />}
      </View>
      <Text variant="label" color="text2" style={{ fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}
