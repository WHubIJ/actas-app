import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { ColorName, TypographyVariant } from '../../theme/tokens';

export type TextProps = RNTextProps & {
  /** Estilo de la escala: display, heading, title, titleSm, bodyLg, body, bodyStrong, caption, label, overline, metadata, metadataStrong. */
  variant?: TypographyVariant;
  /** Color por token. Por defecto `text`; usa `text2` para secundario. `text3` solo para deshabilitado. */
  color?: ColorName;
};

export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const t = useTheme();
  const tabular = variant === 'metadata' || variant === 'metadataStrong';
  return (
    <RNText
      {...rest}
      style={[
        t.typography[variant],
        { color: t.colors[color] },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
