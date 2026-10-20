import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

/** `.ma-check` de `design/previews/LoginScreen.html` y `AuthFields.html`. */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (valor: boolean) => void;
  label: string;
}) {
  const t = useTheme();
  const c = t.colors;

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={6}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          marginTop: 1,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? c.brand : 'transparent',
          borderWidth: checked ? 0 : 1.5,
          borderColor: c.borderStrong,
        }}
      >
        {checked && <Check size={13} color={c.onBrand} strokeWidth={2.4} />}
      </View>
      <Text variant="caption" color="text2" style={{ fontSize: 13.5, lineHeight: 20 }}>
        {label}
      </Text>
    </Pressable>
  );
}
