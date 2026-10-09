import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type NavigatorScreenParams,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { MisActasScreen } from './src/screens/MisActasScreen';
import { MiCuentaScreen } from './src/screens/MiCuentaScreen';
import { NuevaGrabacionScreen } from './src/screens/NuevaGrabacionScreen';
import { GrabacionScreen } from './src/screens/GrabacionScreen';
import { DetalleActaScreen } from './src/screens/DetalleActaScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegistroScreen } from './src/screens/RegistroScreen';
import { TabBar } from './src/components/TabBar';
import { supabase, haySupabase } from './src/services/supabaseClient';
import { ThemeProvider, useAppFonts, useTheme } from './theme/ThemeProvider';

// Se oculta a mano cuando fuentes + sesión están listas (ver `App`). Llamarlo
// en el cuerpo del módulo, no en un efecto: tiene que ganar la carrera contra
// el auto-hide nativo, que puede disparar antes de que monte el primer componente.
SplashScreen.preventAutoHideAsync();

/** Pestañas de la barra inferior. El FAB central NO es una pestaña. */
export type TabParamList = {
  Inicio: undefined;
  Cuenta: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  NuevaGrabacion: undefined;
  /** reunionId ya existe: lo crea NuevaGrabacionScreen antes de navegar aquí. */
  Grabacion: { reunionId: string };
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
      tabBar={(props) => <TabBar {...props} onGrabar={() => props.navigation.navigate('NuevaGrabacion')} />}
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

/**
 * Separado de `App` para poder llamar `useTheme()`: el provider no puede
 * envolverse a sí mismo, así que todo lo que lee el tema vive un nivel por
 * debajo de donde se monta `<ThemeProvider>`.
 */
function Raiz({ sesion }: { sesion: Session | null }) {
  const t = useTheme();

  // Colores de fondo/texto/borde de React Navigation en los dos temas, para
  // que las transiciones entre pantallas no muestren un fondo blanco de
  // fábrica mientras el modo oscuro está activo.
  const temaNavegacion: NavTheme = {
    ...(t.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: t.colors.bg,
      card: t.colors.surface,
      text: t.colors.text,
      border: t.colors.border,
      primary: t.colors.brand,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={temaNavegacion}>
        {haySupabase && !sesion ? (
          <Autenticacion />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Pestanas} />
            <Stack.Screen
              name="NuevaGrabacion"
              component={NuevaGrabacionScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Grabacion"
              component={GrabacionScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            {/* El detalle entra de lado: es navegación jerárquica desde la lista,
                no una tarea modal como la grabación. */}
            <Stack.Screen name="DetalleActa" component={DetalleActaScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  const fuentesListas = useAppFonts();

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

  useEffect(() => {
    if (fuentesListas && sesion !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [fuentesListas, sesion]);

  // El splash nativo (ver app.json) sigue tapando la pantalla mientras esto
  // es `null`, así que no hace falta una pantalla de carga propia aquí.
  if (!fuentesListas || sesion === undefined) {
    return null;
  }

  return (
    <ThemeProvider>
      <Raiz sesion={sesion} />
    </ThemeProvider>
  );
}
