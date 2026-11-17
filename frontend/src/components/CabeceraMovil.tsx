import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { AvatarIniciales } from './AvatarIniciales';
import { useCuenta } from '../services/useCuenta';
import { iniciales } from '../utils/formato';

/** `.ma-avatar` de la cabecera móvil, que el kit no expone como token. */
const LADO_AVATAR = 28;

/** Cabecera de las pestañas móviles (`ActasMobile`): título de la pantalla y el avatar que lleva a la cuenta. */
export function CabeceraMovil({ titulo }: { titulo: string }) {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cuenta } = useCuenta();
  const letras = cuenta ? iniciales(cuenta.nombre || cuenta.email?.split('@')[0] || '') : '';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing[1] }}>
      <Text variant="heading">{titulo}</Text>
      {letras !== '' && (
        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Cuenta' })}
          accessibilityRole="button"
          accessibilityLabel="Tu cuenta"
          hitSlop={8}
        >
          <AvatarIniciales iniciales={letras} tamano={LADO_AVATAR} />
        </Pressable>
      )}
    </View>
  );
}
