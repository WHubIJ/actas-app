import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Bell, Globe, LogOut, SunMoon, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Aviso } from '../../components/ui';
import { TarjetaPerfil } from '../components/TarjetaPerfil';
import { TarjetaEstadistica } from '../components/TarjetaEstadistica';
import { FilaAjuste } from '../components/FilaAjuste';
import { EsqueletoPerfil, EsqueletoEstadisticas } from '../components/EsqueletoCuenta';
import { ALTURA_FAB_SOBRESALIENTE } from '../components/TabBar';
import { MarcoPagina } from '../components/MarcoPagina';
import { cerrarSesion, ErrorAuth } from '../services/authService';
import { hayBackend, obtenerCuenta, obtenerActas, ErrorApi, type Cuenta } from '../services/api';
import { calcularEstadisticas, formatearHorasGrabadas, type EstadisticasCuenta } from '../utils/estadisticasCuenta';
import { capitalizar } from '../utils/formato';

interface Ajuste {
  id: string;
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

/**
 * Solo ajustes con algo real detrás. Preferencias, Configuración de IA,
 * Almacenamiento y Privacidad del diseño no existen todavía (ni pantalla ni
 * dato en la API): se añaden aquí cuando existan, no antes. Ninguna fila
 * navega a ningún sitio, por eso `FilaAjuste` va sin `onPress`.
 */
const AJUSTES_CUENTA: ReadonlyArray<Ajuste> = [
  { id: 'tema', icono: SunMoon, titulo: 'Tema', descripcion: 'Sigue al sistema' },
  { id: 'notificaciones', icono: Bell, titulo: 'Notificaciones', descripcion: 'Aviso al terminar la transcripción' },
  { id: 'idioma', icono: Globe, titulo: 'Idioma', descripcion: 'Español (España)' },
];

/** Ancho de lectura en escritorio: los bloques del diseño móvil no ganan nada estirándose. */
const ANCHO_MAXIMO_CONTENIDO = 720;

const version = Constants.expoConfig?.version;

export function MiCuentaScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const esMovil = useBreakpoint() === 'movil';
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCuenta | null>(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(hayBackend);

  // Sin backend no hay perfil ni estadísticas que mostrar: se omiten esos
  // bloques en vez de pintar datos de ejemplo (el resto de la pantalla,
  // ajustes y cierre de sesión, no depende de él).
  useEffect(() => {
    if (!hayBackend) return;
    let cancelado = false;
    obtenerCuenta()
      .then((c) => {
        if (!cancelado) setCuenta(c);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCuenta(err instanceof ErrorApi ? err.message : 'No se pudo cargar tu cuenta.');
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!hayBackend) return;
    let cancelado = false;
    // Sin endpoint de estadísticas propio: se derivan de la misma lista de
    // actas que usa MisActasScreen. Si falla, la fila simplemente no aparece:
    // no es información crítica como para interrumpir el resto de la pantalla.
    obtenerActas()
      .then((actas) => {
        if (!cancelado) setEstadisticas(calcularEstadisticas(actas));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCargandoEstadisticas(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const manejarCerrarSesion = useCallback(async () => {
    setError(null);
    setCerrandoSesion(true);
    try {
      await cerrarSesion();
      // Sin navegar a mano: App.tsx reacciona a onAuthStateChange y muestra LoginScreen.
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
    } finally {
      setCerrandoSesion(false);
    }
  }, []);

  const mostrarPerfil = hayBackend && !errorCuenta;

  const contenido = (
    <>
        <Text variant="heading" style={{ marginBottom: t.spacing[4] }}>
          Mi cuenta
        </Text>

        {errorCuenta && (
          <View style={{ marginBottom: t.spacing[4] }}>
            <Aviso tono="error" mensaje={errorCuenta} onCerrar={() => setErrorCuenta(null)} />
          </View>
        )}

        {mostrarPerfil &&
          (cuenta ? (
            <TarjetaPerfil
              nombre={cuenta.nombre || cuenta.email?.split('@')[0] || 'Usuario'}
              email={cuenta.email ?? ''}
              organizacion={cuenta.organizacionNombre}
              plan={cuenta.plan ? capitalizar(cuenta.plan) : null}
            />
          ) : (
            <EsqueletoPerfil />
          ))}

        {hayBackend &&
          (cargandoEstadisticas ? (
            <View style={{ marginTop: t.spacing[3] }}>
              <EsqueletoEstadisticas />
            </View>
          ) : (
            estadisticas && (
              <View style={{ flexDirection: 'row', gap: t.spacing[2], marginTop: t.spacing[3] }}>
                <TarjetaEstadistica valor={String(estadisticas.reuniones)} etiqueta="Reuniones" />
                <TarjetaEstadistica valor={formatearHorasGrabadas(estadisticas.minutosGrabados)} etiqueta="Grabadas" />
                <TarjetaEstadistica valor={String(estadisticas.actasCompletadas)} etiqueta="Actas" />
              </View>
            )
          ))}

        <Text variant="overline" color="text2" style={{ marginTop: t.spacing[6], marginBottom: t.spacing[2] }}>
          Cuenta
        </Text>
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: t.radius.lg,
            overflow: 'hidden',
          }}
        >
          {AJUSTES_CUENTA.map((ajuste, i) => (
            <View key={ajuste.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.colors.border } : undefined}>
              <FilaAjuste icono={ajuste.icono} titulo={ajuste.titulo} descripcion={ajuste.descripcion} />
            </View>
          ))}
        </View>

        <View style={{ gap: t.spacing[3], marginTop: t.spacing[5] }}>
          {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
          <Button
            label={cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
            variant="danger"
            size="lg"
            fullWidth
            icon={(c) => <LogOut size={20} color={c} strokeWidth={1.6} />}
            loading={cerrandoSesion}
            onPress={manejarCerrarSesion}
          />
          <Text variant="caption" color="text3" style={{ textAlign: 'center' }}>
            {version ? `MeetingAI ${version}` : 'MeetingAI'}
          </Text>
        </View>
    </>
  );

  // Con sidebar la pantalla es una página web más: topbar con su miga,
  // padding y scroll los pone el marco. El ancho de lectura se mantiene.
  if (!esMovil) {
    return (
      <MarcoPagina migas={[{ etiqueta: 'Ajustes' }]}>
        <View style={{ width: '100%', maxWidth: ANCHO_MAXIMO_CONTENIDO }}>{contenido}</View>
      </MarcoPagina>
    );
  }

  return (
    // El hueco del FAB va en este contenedor, no en el `contentContainerStyle`
    // del ScrollView: un `paddingBottom` ahí solo libera espacio DEBAJO del
    // último elemento, invisible mientras no se haga scroll. Encogiendo aquí
    // la caja del ScrollView, el contenido nunca llega a esa zona ni en reposo.
    // Nota: el Tab.Navigator ya reserva su propia fila para el TabBar (no es
    // absoluto sobre las pantallas), así que la pantalla NO necesita sumar
    // `useBottomTabBarHeight()` aparte — solo lo que el FAB sobresale por
    // encima de la caja del TabBar. Solo hay FAB en móvil: con sidebar no
    // hay nada que esquivar.
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: esMovil ? ALTURA_FAB_SOBRESALIENTE + t.spacing[4] : 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: ANCHO_MAXIMO_CONTENIDO,
          alignSelf: 'center',
          paddingHorizontal: t.spacing[5],
          paddingBottom: t.spacing[8],
          // Mínimo garantizado: en web y en Android sin notch `insets.top` es 0
          // y el título quedaría pegado al borde.
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
        }}
      >
        {contenido}
      </ScrollView>
    </View>
  );
}
