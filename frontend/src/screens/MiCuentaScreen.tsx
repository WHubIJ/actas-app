import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
import { obtenerCuenta, ErrorApi, type Cuenta } from '../services/api';
import { colors, espaciado, textos } from '../theme';

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

/** Las métricas siguen siendo de ejemplo: no hay endpoint de estadísticas todavía. */
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
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);

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

        {errorCuenta && <Aviso tono="error" mensaje={errorCuenta} onCerrar={() => setErrorCuenta(null)} />}

        {cuenta ? (
          <TarjetaPerfil
            nombre={cuenta.nombre || cuenta.email?.split('@')[0] || 'Usuario'}
            email={cuenta.email ?? ''}
            plan={cuenta.plan ?? cuenta.organizacionNombre ?? 'Sin organización'}
            onEditar={() => {}}
          />
        ) : (
          !errorCuenta && (
            <View style={styles.cargandoCuenta}>
              <ActivityIndicator color={colors.marronClaro} />
            </View>
          )
        )}

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
  cargandoCuenta: { height: 94, alignItems: 'center', justifyContent: 'center' },
  estadisticas: { flexDirection: 'row', gap: espaciado.md },
  seccion: { gap: espaciado.md },
  filas: { gap: espaciado.sm },
});
