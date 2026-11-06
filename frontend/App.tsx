import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
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
import { RecuperarContrasenaScreen } from './src/screens/RecuperarContrasenaScreen';
import { NuevaContrasenaScreen } from './src/screens/NuevaContrasenaScreen';
import { TabBar } from './src/components/TabBar';
import { Sidebar } from './src/components/Sidebar';
import { supabase, haySupabase } from './src/services/supabaseClient';
import { procesarUrlRecuperacion } from './src/services/authService';
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
  RecuperarContrasena: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function Pestanas() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  // Mismo umbral que `esEscritorio` en las pantallas de auth (LoginScreen):
  // por debajo, barra inferior con FAB; por encima, columna fija a la izquierda.
  const esEscritorio = width >= t.size.bpTablet;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Deja sitio a la columna del Sidebar, que se posiciona absoluto
        // encima de esta misma vista (ver `Sidebar`, no cambia el layout del
        // propio Tab.Navigator).
        sceneStyle: esEscritorio ? { marginLeft: t.size.sidebarW } : undefined,
      }}
      tabBar={(props) => {
        const onGrabar = () => props.navigation.navigate('NuevaGrabacion');
        return esEscritorio ? <Sidebar {...props} onGrabar={onGrabar} /> : <TabBar {...props} onGrabar={onGrabar} />;
      }}
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
      <AuthStack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Separado de `App` para poder llamar `useTheme()`: el provider no puede
 * envolverse a sí mismo, así que todo lo que lee el tema vive un nivel por
 * debajo de donde se monta `<ThemeProvider>`.
 */
interface PropsRaiz {
  sesion: Session | null;
  /** Hay una sesión de recuperación de contraseña activa (ver efecto de
      deep links en `App`): se muestra por encima de todo lo demás, haya o
      no sesión normal, porque el enlace del email puede llegar con la app
      en cualquier estado. */
  recuperacionPendiente: boolean;
  onContrasenaActualizada: () => void;
}

function Raiz({ sesion, recuperacionPendiente, onContrasenaActualizada }: PropsRaiz) {
  const t = useTheme();

  if (recuperacionPendiente) {
    return (
      <SafeAreaProvider>
        <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
        <NuevaContrasenaScreen onCompletado={onContrasenaActualizada} />
      </SafeAreaProvider>
    );
  }

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
  const [recuperacionPendiente, setRecuperacionPendiente] = useState(false);

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

    const { data: suscripcion } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      setSesion(nuevaSesion);
      // Camino "web": Supabase detecta el enlace de recuperación solo en la
      // URL (`detectSessionInUrl`) y dispara este evento. El camino nativo
      // lo cubre el efecto de abajo (`procesarUrlRecuperacion`), que no
      // depende de este evento por si el SDK no lo clasifica igual ahí.
      if (evento === 'PASSWORD_RECOVERY') setRecuperacionPendiente(true);
    });
    return () => suscripcion.subscription.unsubscribe();
  }, []);

  // Enlace de recuperación de contraseña por deep link: puede llegar con la
  // app cerrada (getInitialURL) o en primer plano (listener 'url'). Mismo
  // tratamiento en web y nativo; `procesarUrlRecuperacion` ignora cualquier
  // URL que no sea `type=recovery` (p.ej. el callback de OAuth), así que es
  // seguro dejarlo escuchando siempre.
  useEffect(() => {
    if (!haySupabase) return;

    const procesar = async (url: string | null) => {
      if (!url) return;
      const esRecuperacion = await procesarUrlRecuperacion(url);
      if (esRecuperacion) setRecuperacionPendiente(true);
    };

    Linking.getInitialURL().then(procesar);
    const suscripcion = Linking.addEventListener('url', ({ url }) => procesar(url));
    return () => suscripcion.remove();
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
      <Raiz
        sesion={sesion}
        recuperacionPendiente={recuperacionPendiente}
        onContrasenaActualizada={() => setRecuperacionPendiente(false)}
      />
    </ThemeProvider>
  );
}
