import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  StackActions,
  createNavigationContainerRef,
  type NavigatorScreenParams,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';

import { MisActasScreen } from './src/screens/MisActasScreen';
import { ReunionesScreen } from './src/screens/ReunionesScreen';
import { ActasScreen } from './src/screens/ActasScreen';
import { TareasScreen } from './src/screens/TareasScreen';
import { EquiposScreen } from './src/screens/EquiposScreen';
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
import { anchoSidebar } from './src/components/anchoSidebar';
import { solicitarBusqueda } from './src/components/busquedaGlobal';
import { ProveedorReuniones, useContadoresReuniones } from './src/services/useListaReuniones';
import { supabase, haySupabase } from './src/services/supabaseClient';
import { procesarUrlRecuperacion } from './src/services/authService';
import { ThemeProvider, useAppFonts, useTheme } from './theme/ThemeProvider';
import { useBreakpoint } from './theme/useBreakpoint';
import { SeguimientoTranscripciones } from './src/notificaciones/SeguimientoTranscripciones';

// Se oculta a mano cuando fuentes + sesión están listas (ver `App`). Llamarlo
// en el cuerpo del módulo, no en un efecto: tiene que ganar la carrera contra
// el auto-hide nativo, que puede disparar antes de que monte el primer componente.
SplashScreen.preventAutoHideAsync();

/** Pestañas de la app. La barra inferior (móvil) solo muestra `Inicio` y `Cuenta`;
    el `Sidebar` (tablet y escritorio) las muestra todas. El FAB central NO es una pestaña. */
export type TabParamList = {
  Inicio: undefined;
  Reuniones: undefined;
  Actas: undefined;
  Tareas: undefined;
  Equipos: undefined;
  Cuenta: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  NuevaGrabacion: undefined;
  /** reunionId ya existe: lo crea NuevaGrabacionScreen antes de navegar aquí.
      `titulo` solo sirve para el texto del aviso al terminar la transcripción. */
  Grabacion: { reunionId: string; titulo?: string };
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

/** Para navegar desde fuera de las pantallas: el aviso de transcripción terminada y el toque en su notificación. */
const navigationRef = createNavigationContainerRef<RootStackParamList>();

function abrirActa(actaId: string) {
  if (!navigationRef.isReady()) return;
  // `navigate` sobre el mismo DetalleActa solo cambiaría los params y la
  // pantalla no recargaría el acta que acaba de terminar.
  if (navigationRef.getCurrentRoute()?.name === 'DetalleActa') {
    navigationRef.dispatch(StackActions.replace('DetalleActa', { actaId }));
  } else {
    navigationRef.navigate('DetalleActa', { actaId });
  }
}
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

/**
 * `Sidebar` con lo que sabe la app: el buscador enfoca el de la pestaña
 * activa (o lleva a Reuniones si esa pestaña no tiene) y los contadores salen
 * de la lista compartida, solo cuando ya ha cargado.
 */
function SidebarConectado(props: BottomTabBarProps) {
  const contadores = useContadoresReuniones();
  const { navigation } = props;
  // Estable: el sidebar registra con ella el atajo de teclado en un efecto.
  const buscar = useCallback(() => solicitarBusqueda(() => navigation.navigate('Reuniones')), [navigation]);
  return <Sidebar {...props} onBuscar={buscar} contadores={contadores} />;
}

function Pestanas() {
  const t = useTheme();
  const modo = useBreakpoint();

  return (
    // Dentro de las pestañas y no más arriba: al cerrar sesión se desmonta con
    // ellas y la lista de reuniones de la cuenta anterior no sobrevive.
    <ProveedorReuniones>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          // Deja sitio a la columna del Sidebar, que se posiciona absoluto
          // encima de esta misma vista (ver `Sidebar`, no cambia el layout del
          // propio Tab.Navigator). Colapsado en tablet, completo en escritorio.
          sceneStyle: modo === 'movil' ? undefined : { marginLeft: anchoSidebar(modo, t.size) },
        }}
        tabBar={(props) => {
          const onGrabar = () => props.navigation.navigate('NuevaGrabacion');
          return modo === 'movil' ? <TabBar {...props} onGrabar={onGrabar} /> : <SidebarConectado {...props} />;
        }}
      >
        <Tab.Screen name="Inicio" component={MisActasScreen} options={{ title: 'Inicio' }} />
        <Tab.Screen name="Reuniones" component={ReunionesScreen} options={{ title: 'Reuniones' }} />
        <Tab.Screen name="Actas" component={ActasScreen} options={{ title: 'Actas' }} />
        <Tab.Screen name="Tareas" component={TareasScreen} options={{ title: 'Tareas' }} />
        <Tab.Screen name="Equipos" component={EquiposScreen} options={{ title: 'Equipos' }} />
        <Tab.Screen name="Cuenta" component={MiCuentaScreen} options={{ title: 'Cuenta' }} />
      </Tab.Navigator>
    </ProveedorReuniones>
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
      <NavigationContainer ref={navigationRef} theme={temaNavegacion}>
        {haySupabase && !sesion ? (
          <Autenticacion />
        ) : (
          // Solo con sesión: al cerrarla se desmonta y el seguimiento empieza de cero.
          <SeguimientoTranscripciones onAbrirActa={abrirActa}>
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
          </SeguimientoTranscripciones>
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
