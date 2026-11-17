import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, FileText, House, ListChecks, Search, User, Users, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text } from '../../components/ui';
import type { RootStackParamList, TabParamList } from '../../App';
import { FilaAjuste } from '../components/FilaAjuste';
import { MarcoPagina } from '../components/MarcoPagina';
import { ALTURA_FAB_SOBRESALIENTE } from '../components/TabBar';
import { solicitarBusqueda } from '../components/busquedaGlobal';
import { useCuenta } from '../services/useCuenta';
import { useContadoresReuniones } from '../services/useListaReuniones';
import { capitalizar, iniciales } from '../utils/formato';

/** `.ma-org-mark` y la caja de búsqueda móvil de `MenuMobile`; el kit no los expone como tokens. */
const LADO_MARCA_ORG = 40;
const RADIO_MARCA_ORG = 12;
const ALTO_BUSCADOR = 40;
const ANCHO_MAXIMO_CONTENIDO = 720;

interface Seccion {
  ruta: keyof TabParamList;
  titulo: string;
  icono: LucideIcon;
  descripcion?: string;
}

/**
 * Mismas secciones y mismos iconos que el `Sidebar`. Del kit se quitan los
 * subtítulos que prometen datos inexistentes ("Pendientes de aprobar",
 * nombres de equipos) y, más abajo, "Ajustes de la organización" y "Ayuda y
 * soporte", que no tienen pantalla detrás.
 */
const SECCIONES: ReadonlyArray<Seccion> = [
  { ruta: 'Inicio', titulo: 'Inicio', icono: House },
  { ruta: 'Reuniones', titulo: 'Reuniones', icono: CalendarDays },
  { ruta: 'Actas', titulo: 'Actas', icono: FileText, descripcion: 'Reuniones con la transcripción lista' },
  { ruta: 'Tareas', titulo: 'Tareas', icono: ListChecks },
  { ruta: 'Equipos', titulo: 'Equipos', icono: Users },
];

/** Pestaña "Más" de la barra móvil (`MenuMobile`): el contenido del `Sidebar` para quien no tiene sidebar. */
export function MasScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const movil = useBreakpoint() === 'movil';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cuenta } = useCuenta();
  const contadores = useContadoresReuniones();

  const ir = (ruta: keyof TabParamList) => navigation.navigate('Tabs', { screen: ruta });
  // "Más" no tiene buscador propio: se salta al de Inicio y se enfoca allí.
  const buscar = () => solicitarBusqueda(() => ir('Inicio'));

  const nombreUsuario = cuenta ? cuenta.nombre || cuenta.email?.split('@')[0] || '' : '';
  const letrasUsuario = nombreUsuario ? iniciales(nombreUsuario) : undefined;

  const contenido = (
    <>
      {movil && (
        <Text variant="heading" style={{ marginBottom: t.spacing[4] }}>
          Más
        </Text>
      )}

      {cuenta && <TarjetaOrganizacion nombre={cuenta.organizacionNombre} plan={cuenta.plan} />}

      <Pressable
        onPress={buscar}
        accessibilityRole="search"
        accessibilityLabel="Buscar en reuniones y actas"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing[2],
          height: ALTO_BUSCADOR,
          paddingHorizontal: t.spacing[3],
          marginTop: cuenta ? t.spacing[3] : 0,
          borderRadius: RADIO_MARCA_ORG,
          backgroundColor: t.colors.surface2,
        }}
      >
        <Search size={18} color={t.colors.text2} strokeWidth={1.6} />
        <Text variant="body" color="text3">
          Buscar en reuniones y actas
        </Text>
      </Pressable>

      <Bloque style={{ marginTop: t.spacing[3] }}>
        {SECCIONES.map((s) => (
          <FilaAjuste
            key={s.ruta}
            icono={s.icono}
            titulo={s.titulo}
            descripcion={s.descripcion}
            contador={contadores?.[s.ruta]}
            onPress={() => ir(s.ruta)}
          />
        ))}
      </Bloque>

      <Text variant="overline" color="text2" style={{ marginTop: t.spacing[6], marginBottom: t.spacing[2] }}>
        Cuenta
      </Text>
      <Bloque>
        <FilaAjuste
          icono={User}
          avatar={letrasUsuario}
          titulo="Mi cuenta"
          descripcion={cuenta?.email ?? undefined}
          onPress={() => ir('Cuenta')}
        />
      </Bloque>
    </>
  );

  if (!movil) {
    return (
      <MarcoPagina migas={[{ etiqueta: 'Más' }]}>
        <View style={{ width: '100%', maxWidth: ANCHO_MAXIMO_CONTENIDO }}>{contenido}</View>
      </MarcoPagina>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: ALTURA_FAB_SOBRESALIENTE + t.spacing[4] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: t.spacing[5],
          paddingBottom: t.spacing[8],
          // Mismo mínimo que MiCuentaScreen: en web `insets.top` es 0.
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
        }}
      >
        {contenido}
      </ScrollView>
    </View>
  );
}

/** `.ma-settings`: filas separadas por hairline dentro de una superficie con borde. */
function Bloque({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useTheme();
  const filas = Array.isArray(children) ? children : [children];
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.lg,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {filas.map((fila, i) => (
        <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.colors.border } : undefined}>
          {fila}
        </View>
      ))}
    </View>
  );
}

/**
 * `.ma-org` sin el selector de organización del kit: hoy cada cuenta tiene una
 * sola organización y no hay API para cambiar, así que no lleva chevron ni hoja.
 */
function TarjetaOrganizacion({ nombre, plan }: { nombre: string | null; plan: string | null }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[3],
        paddingVertical: t.spacing[3],
        paddingHorizontal: 14,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    >
      <View
        style={{
          width: LADO_MARCA_ORG,
          height: LADO_MARCA_ORG,
          borderRadius: RADIO_MARCA_ORG,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.brandSoft,
        }}
      >
        {nombre ? (
          <Text variant="bodyStrong" color="brandStrong">
            {iniciales(nombre)}
          </Text>
        ) : (
          <User size={20} color={t.colors.brandStrong} strokeWidth={1.6} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="titleSm" numberOfLines={1}>
          {nombre ?? 'Personal'}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1}>
          {nombre ? (plan ? `Plan ${capitalizar(plan)}` : 'Organización') : 'Sin organización'}
        </Text>
      </View>
    </View>
  );
}
