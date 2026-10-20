import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Globe,
  AudioLines,
  HardDrive,
  LogOut,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Aviso } from '../../components/ui';
import { TarjetaPerfil } from '../components/TarjetaPerfil';
import { TarjetaEstadistica } from '../components/TarjetaEstadistica';
import { FilaAjuste } from '../components/FilaAjuste';
import { ALTURA_FAB_SOBRESALIENTE } from '../components/TabBar';
import { cerrarSesion, ErrorAuth } from '../services/authService';
import { obtenerCuenta, obtenerActas, ErrorApi, type Cuenta } from '../services/api';
import { formatearMinutos } from '../utils/formato';

interface Ajuste {
  id: string;
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

interface Seccion {
  id: string;
  titulo: string;
  ajustes: Ajuste[];
}

interface Estadisticas {
  reuniones: number;
  minutosGrabados: number;
  /** Reuniones cuya acta ya terminó de procesarse. No hay endpoint que cuente
      archivos generados (PDF/Word/MD, reintentos incluidos), así que esto es
      lo más fiel a "actas" que se puede derivar de los datos ya disponibles. */
  actasCompletadas: number;
}

const SECCIONES: Seccion[] = [
  {
    id: 'cuenta',
    titulo: 'Cuenta',
    ajustes: [
      { id: 'preferencias', icono: Settings, titulo: 'Preferencias', descripcion: 'Idioma, notificaciones' },
      { id: 'notificaciones', icono: Bell, titulo: 'Notificaciones', descripcion: 'Alertas y recordatorios' },
      { id: 'idioma', icono: Globe, titulo: 'Idioma', descripcion: 'Español (España)' },
    ],
  },
  {
    id: 'ia',
    titulo: 'IA y almacenamiento',
    ajustes: [
      { id: 'ia', icono: AudioLines, titulo: 'Configuración de IA', descripcion: 'Modelo, precisión, idioma' },
      { id: 'almacenamiento', icono: HardDrive, titulo: 'Almacenamiento', descripcion: '4.2 GB de 10 GB usados' },
      { id: 'privacidad', icono: ShieldCheck, titulo: 'Privacidad y datos', descripcion: 'Gestiona tus datos' },
    ],
  },
];

export function MiCuentaScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);

  useEffect(() => {
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
    let cancelado = false;
    // Sin endpoint de estadísticas propio: se derivan de la misma lista de
    // actas que ya usa MisActasScreen. Si falla, las tarjetas se quedan en su
    // placeholder de carga en vez de mostrar un error — no es información
    // crítica como para interrumpir el resto de la pantalla por esto.
    obtenerActas()
      .then((actas) => {
        if (cancelado) return;
        setEstadisticas({
          reuniones: actas.length,
          minutosGrabados: actas.reduce((total, a) => total + a.duracionMinutos, 0),
          actasCompletadas: actas.filter((a) => a.estadoTranscripcion === 'COMPLETADA').length,
        });
      })
      .catch(() => {});
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

  return (
    // El hueco del FAB va en este contenedor, no en el `contentContainerStyle`
    // del ScrollView: un `paddingBottom` ahí solo libera espacio DEBAJO del
    // último elemento, invisible mientras no se haga scroll. Encogiendo aquí
    // la caja del ScrollView, el contenido nunca llega a esa zona ni en reposo.
    // Nota: el Tab.Navigator ya reserva su propia fila para el TabBar (no es
    // absoluto sobre las pantallas), así que la pantalla NO necesita sumar
    // `useBottomTabBarHeight()` aparte — solo lo que el FAB sobresale por
    // encima de la caja del TabBar. Sumar el alto completo del TabBar aquí
    // duplicaba esa reserva y dejaba un bloque entero de `bg` vacío encima
    // de la barra.
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: ALTURA_FAB_SOBRESALIENTE + t.spacing[4] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: t.spacing[5],
          gap: t.spacing[5],
          // Mínimo garantizado: en web y en Android sin notch `insets.top` es 0
          // y el título quedaría pegado al borde.
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
        }}
      >
        <Text variant="heading">Mi cuenta</Text>

        {errorCuenta && <Aviso tono="error" mensaje={errorCuenta} onCerrar={() => setErrorCuenta(null)} />}

        {cuenta ? (
          <TarjetaPerfil
            nombre={cuenta.nombre || cuenta.email?.split('@')[0] || 'Usuario'}
            email={cuenta.email ?? ''}
            organizacion={cuenta.organizacionNombre}
            plan={cuenta.plan}
            onEditar={() => {}}
          />
        ) : (
          !errorCuenta && (
            <View style={{ height: 94, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={t.colors.brand} />
            </View>
          )
        )}

        <View style={{ flexDirection: 'row', gap: t.spacing[2] }}>
          <TarjetaEstadistica valor={estadisticas ? String(estadisticas.reuniones) : '—'} etiqueta="Reuniones" />
          <TarjetaEstadistica
            valor={estadisticas ? formatearMinutos(estadisticas.minutosGrabados) : '—'}
            etiqueta="Grabadas"
          />
          <TarjetaEstadistica valor={estadisticas ? String(estadisticas.actasCompletadas) : '—'} etiqueta="Actas" />
        </View>

        {SECCIONES.map((seccion) => (
          <View key={seccion.id} style={{ gap: t.spacing[2] }}>
            <Text variant="overline" color="text2">
              {seccion.titulo}
            </Text>
            <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.lg, overflow: 'hidden' }}>
              {seccion.ajustes.map((ajuste, i) => (
                <View key={ajuste.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.colors.border } : undefined}>
                  <FilaAjuste icono={ajuste.icono} titulo={ajuste.titulo} descripcion={ajuste.descripcion} onPress={() => {}} />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ gap: t.spacing[3] }}>
          {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
          <Button
            label={cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
            variant="danger"
            size="lg"
            fullWidth
            icon={(c) => <LogOut size={18} color={c} strokeWidth={1.8} />}
            loading={cerrandoSesion}
            onPress={manejarCerrarSesion}
          />
          <Text variant="caption" color="text3" style={{ textAlign: 'center' }}>
            MeetingAI 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
