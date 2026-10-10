import React from 'react';
import { Pressable, View, ActivityIndicator, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import type { ColorName } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono a la izquierda (lucide-react-native o AIMark). Recibe el color correcto. */
  icon?: (color: string) => React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 28, md: 36, lg: 44, xl: 54 };
const FONT: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 15, xl: 16 };

/**
 * Primary una sola vez por vista. AI para lo que hace la IA a petición.
 * Verbo en infinitivo, sentence case: "Grabar reunión", "Enviar a aprobación".
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  fullWidth,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const c = t.colors;

  const palette: Record<ButtonVariant, { bg: string; fg: ColorName; border?: string; pressed: string }> = {
    primary: { bg: c.brand, fg: 'onBrand', pressed: t.mode === 'dark' ? c.brand : c.brandStrong },
    secondary: { bg: c.surface, fg: 'text', border: c.borderStrong, pressed: c.surface2 },
    ghost: { bg: 'transparent', fg: 'text', pressed: c.fillHover },
    ai: { bg: c.brandSoft, fg: 'brandStrong', pressed: c.fillPress },
    danger: { bg: 'transparent', fg: 'danger', border: c.borderStrong, pressed: c.dangerSoft },
  };
  const p = palette[variant];
  const radiusBySize = size === 'sm' ? t.radius.sm : size === 'xl' ? 16 : size === 'lg' ? 12 : t.radius.md;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      hitSlop={size === 'sm' ? 8 : undefined}
      style={({ pressed }) => [
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? t.spacing[3] : size === 'xl' ? t.spacing[5] : t.spacing[4],
          borderRadius: radiusBySize,
          backgroundColor: pressed ? p.pressed : p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing[2],
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant === 'secondary' && { boxShadow: t.shadows.sm },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={c[p.fg]} />
      ) : (
        icon && <View>{icon(c[p.fg])}</View>
      )}
      <Text
        variant="label"
        color={p.fg}
        style={{ fontSize: FONT[size], lineHeight: FONT[size] + 4, fontFamily: size === 'xl' ? 'Geist_600SemiBold' : 'Geist_500Medium' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
