import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { MisActasScreen } from './src/screens/MisActasScreen';
import { MiCuentaScreen } from './src/screens/MiCuentaScreen';
import { GrabacionScreen } from './src/screens/GrabacionScreen';
import { DetalleActaScreen } from './src/screens/DetalleActaScreen';
import { TabBar } from './src/components/TabBar';
import { colors } from './src/theme';

/** Pestañas de la barra inferior. El FAB central NO es una pestaña. */
export type TabParamList = {
  Inicio: undefined;
  Cuenta: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Grabacion: { reunionId?: string } | undefined;
  DetalleActa: { actaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Pestanas() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} onGrabar={() => props.navigation.navigate('Grabacion')} />}
    >
      <Tab.Screen name="Inicio" component={MisActasScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Cuenta" component={MiCuentaScreen} options={{ title: 'Cuenta' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fuentesListas] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Se pinta el color de fondo mientras cargan las fuentes para evitar el
  // flash blanco entre el splash y la primera pantalla.
  if (!fuentesListas) {
    return <View style={styles.cargando} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Pestanas} />
          <Stack.Screen
            name="Grabacion"
            component={GrabacionScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          {/* El detalle entra de lado: es navegación jerárquica desde la lista,
              no una tarea modal como la grabación. */}
          <Stack.Screen name="DetalleActa" component={DetalleActaScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargando: { flex: 1, backgroundColor: colors.crema },
});
