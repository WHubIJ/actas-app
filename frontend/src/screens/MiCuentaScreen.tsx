import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  BellIcon,
  GearIcon,
  GlobeIcon,
  HardDrivesIcon,
  ShieldCheckIcon,
  SignOutIcon,
  WaveformIcon,
  type Icon,
} from 'phosphor-react-native';
import { ScreenBackground } from '../components/ScreenBackground';
import { TarjetaPerfil } from '../components/TarjetaPerfil';
import { TarjetaEstadistica } from '../components/TarjetaEstadistica';
import { FilaAjuste } from '../components/FilaAjuste';
import { Boton } from '../components/Boton';
import { Aviso } from '../components/Aviso';
import { cerrarSesion, ErrorAuth } from '../services/authService';
import { espaciado, textos } from '../theme';

interface Ajuste {
  id: string;
  icono: Icon;
  titulo: string;
  descripcion: string;
}

interface Seccion {
  id: string;
  titulo: string;
  ajustes: Ajuste[];
}

/**
 * Los datos de perfil y las métricas son de ejemplo: el backend aún no tiene
 * autenticación (fuera de alcance del Sprint 1) ni endpoint de estadísticas.
 */
const PERFIL = {
  nombre: 'Ana Martínez',
  email: 'ana.martinez@empresa.com',
  plan: 'Plan Pro',
};

const ESTADISTICAS = [
  { id: 'reuniones', valor: '24', etiqueta: 'Reuniones' },
  { id: 'grabadas', valor: '18h', etiqueta: 'Grabadas' },
  { id: 'actas', valor: '142', etiqueta: 'Actas' },
];

const SECCIONES: Seccion[] = [
  {
    id: 'cuenta',
    titulo: 'Cuenta',
    ajustes: [
      { id: 'preferencias', icono: GearIcon, titulo: 'Preferencias', descripcion: 'Idioma, notificaciones' },
      { id: 'notificaciones', icono: BellIcon, titulo: 'Notificaciones', descripcion: 'Alertas y recordatorios' },
      { id: 'idioma', icono: GlobeIcon, titulo: 'Idioma', descripcion: 'Español (España)' },
    ],
  },
  {
    id: 'ia',
    titulo: 'IA y almacenamiento',
    ajustes: [
      { id: 'ia', icono: WaveformIcon, titulo: 'Configuración de IA', descripcion: 'Modelo, precisión, idioma' },
      { id: 'almacenamiento', icono: HardDrivesIcon, titulo: 'Almacenamiento', descripcion: '4.2 GB de 10 GB usados' },
      { id: 'privacidad', icono: ShieldCheckIcon, titulo: 'Privacidad y datos', descripcion: 'Gestiona tus datos' },
    ],
  },
];

export function MiCuentaScreen() {
  const insets = useSafeAreaInsets();
  const altoTabBar = useBottomTabBarHeight();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          // Mínimo garantizado: en web y en Android sin notch `insets.top` es 0
          // y el título quedaría pegado al borde.
          {
            paddingTop: Math.max(insets.top, espaciado.lg) + espaciado.lg,
            paddingBottom: altoTabBar + espaciado.xxl,
          },
        ]}
      >
        <Text style={textos.display}>Mi cuenta</Text>

        <TarjetaPerfil {...PERFIL} onEditar={() => {}} />

        <View style={styles.estadisticas}>
          {ESTADISTICAS.map((e) => (
            <TarjetaEstadistica key={e.id} valor={e.valor} etiqueta={e.etiqueta} />
          ))}
        </View>

        {SECCIONES.map((seccion) => (
          <View key={seccion.id} style={styles.seccion}>
            <Text style={textos.etiqueta}>{seccion.titulo}</Text>
            <View style={styles.filas}>
              {seccion.ajustes.map((ajuste) => (
                <FilaAjuste
                  key={ajuste.id}
                  icono={ajuste.icono}
                  titulo={ajuste.titulo}
                  descripcion={ajuste.descripcion}
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.seccion}>
          {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
          <Boton
            titulo={cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
            variante="secundario"
            icono={(color, size) => <SignOutIcon size={size} weight="bold" color={color} />}
            cargando={cerrandoSesion}
            onPress={manejarCerrarSesion}
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  contenido: {
    paddingHorizontal: espaciado.xl,
    gap: espaciado.xl,
  },
  estadisticas: { flexDirection: 'row', gap: espaciado.md },
  seccion: { gap: espaciado.md },
  filas: { gap: espaciado.sm },
});
