import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Input, type InputProps } from './Input';
import { MedidorContrasena } from './MedidorContrasena';

type Props = Omit<InputProps, 'secureTextEntry' | 'icon' | 'right' | 'help' | 'helpTone' | 'value'> & {
  value: string;
  /** Contraseña nueva: activa el autocompletado de "contraseña nueva" del gestor de contraseñas. */
  nueva?: boolean;
  /** Añade el medidor de fortaleza bajo el campo. */
  medidor?: boolean;
  /** Convierte el campo en una confirmación y muestra si coincide con esta contraseña. */
  confirmaA?: string;
};

export function CampoContrasena({ value, nueva, medidor, confirmaA, error, ...rest }: Props) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);

  const esConfirmacion = confirmaA !== undefined;
  const coincide = esConfirmacion && value.length > 0 && value === confirmaA;
  // No se avisa mientras la confirmación sea más corta: aún se está escribiendo.
  const noCoincide = esConfirmacion && value.length > 0 && value.length >= (confirmaA?.length ?? 0) && value !== confirmaA;

  return (
    <View style={{ gap: t.spacing[2] }}>
      <Input
        {...rest}
        value={value}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={nueva || esConfirmacion ? 'new-password' : 'current-password'}
        icon={(c) => <Lock size={18} color={c} strokeWidth={1.6} />}
        error={error ?? (noCoincide ? 'No coinciden.' : undefined)}
        help={coincide ? 'Coinciden' : undefined}
        helpTone="success"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {coincide && <Check size={18} color={t.colors.success} strokeWidth={1.6} />}
            <Pressable
              onPress={() => setVisible((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              // Caja de 44px (`touchMin`) sin agrandar el campo: el margen negativo anula el relleno lateral del input.
              style={{ width: t.size.touchMin, height: t.size.touchMin, marginRight: -t.spacing[3], alignItems: 'center', justifyContent: 'center' }}
            >
              {visible ? (
                <EyeOff size={18} color={t.colors.text2} strokeWidth={1.6} />
              ) : (
                <Eye size={18} color={t.colors.text2} strokeWidth={1.6} />
              )}
            </Pressable>
          </View>
        }
      />
      {medidor && <MedidorContrasena contrasena={value} />}
    </View>
  );
}
