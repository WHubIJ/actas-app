import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
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
import { LoginScreen } from './src/screens/LoginScreen';
import { RegistroScreen } from './src/screens/RegistroScreen';
import { TabBar } from './src/components/TabBar';
import { supabase, haySupabase } from './src/services/supabaseClient';
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

/** Pantallas previas a tener sesión. Login y Registro son pantallas distintas,
    navegables entre sí, no un único formulario con un toggle interno. */
export type AuthStackParamList = {
  Login: { avisoRegistro?: string } | undefined;
  Registro: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

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

function Autenticacion() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Registro" component={RegistroScreen} />
    </AuthStack.Navigator>
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

  // undefined = todavía comprobando con Supabase; null = sin sesión.
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!haySupabase || !supabase) {
      // Provisional (ADR-005): el backend tampoco exige auth todavía
      // (permitAll() en SecurityConfig), así que sin Supabase configurado no
      // se bloquea la app entera — mismo criterio que hayBackend/haySupabase
      // en el resto del proyecto.
      setSesion(null);
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSesion(data.session));

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
    });
    return () => suscripcion.subscription.unsubscribe();
  }, []);

  // Se pinta el color de fondo mientras cargan las fuentes o se comprueba la
  // sesión, para evitar el flash blanco (o un parpadeo de login) al arrancar.
  if (!fuentesListas || sesion === undefined) {
    return <View style={styles.cargando} />;
  }

  if (haySupabase && !sesion) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Autenticacion />
        </NavigationContainer>
      </SafeAreaProvider>
    );
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
