import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  House,
  CalendarDays,
  FileText,
  ListChecks,
  Users,
  Settings,
  Search,
  User,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, AppIcon } from '../../components/ui';
import { PressableEscala } from './PressableEscala';
import { ANCHO_SIDEBAR_COLAPSADO } from './anchoSidebar';
import { useCuenta } from '../services/useCuenta';
import { iniciales, capitalizar } from '../utils/formato';

// Medidas de `Sidebar.html` (`ma-nav-item`, `ma-switcher`, `ma-input-search`,
// `ma-avatar-sm`) que el kit no expone como token.
const ALTO_ITEM = 32;
const LADO_ITEM_COLAPSADO = 40;
const ALTO_SWITCHER = 40;
const ALTO_BUSCADOR = 32;
const LADO_AVATAR = 22;

interface ItemNav {
  ruta: string;
  etiqueta: string;
  icono: LucideIcon;
}

/** Ruta de pestaña -> cómo se pinta en el menú. La etiqueta sale de aquí y no de `options.title`: "Cuenta" se muestra como "Ajustes". */
const GRUPO_PRINCIPAL: ReadonlyArray<ItemNav> = [
  { ruta: 'Inicio', etiqueta: 'Inicio', icono: House },
  { ruta: 'Reuniones', etiqueta: 'Reuniones', icono: CalendarDays },
  { ruta: 'Actas', etiqueta: 'Actas', icono: FileText },
  { ruta: 'Tareas', etiqueta: 'Tareas', icono: ListChecks },
  { ruta: 'Equipos', etiqueta: 'Equipos', icono: Users },
];

const GRUPO_ORGANIZACION: ReadonlyArray<ItemNav> = [{ ruta: 'Cuenta', etiqueta: 'Ajustes', icono: Settings }];

interface Props extends BottomTabBarProps {
  /** Se llama con Cmd/Ctrl+K (solo web) y al pulsar el buscador. El sidebar no sabe qué se busca: quien lo monte conecta el foco. */
  onBuscar?: () => void;
  /** Contador opcional por nombre de ruta (`ma-meta`). Solo se pinta si hay número: nunca se inventa. */
  contadores?: Readonly<Partial<Record<string, number>>>;
}

/**
 * Menú de escritorio y tablet: columna fija a la izquierda, como el
 * `aside.ma-sidebar` de `design/previews/Sidebar.html`. Entre `bpMobile` y
 * `bpTablet` se colapsa a solo iconos; en móvil `App.tsx` monta `TabBar` y
 * este componente no se renderiza. La acción "Nueva grabación" ya no vive
 * aquí: en el kit está en la topbar de cada página (`MarcoPagina`).
 */
export function Sidebar({ state, navigation, onBuscar, contadores }: Props) {
  const t = useTheme();
  const colapsado = useBreakpoint() === 'tablet';
  const { cuenta, cargando } = useCuenta();

  useAtajoBuscar(onBuscar);

  const itemDe = ({ ruta, etiqueta, icono }: ItemNav) => {
    const indice = state.routes.findIndex((r) => r.name === ruta);
    if (indice < 0) return null;
    const route = state.routes[indice];
    const activo = state.index === indice;

    const alPulsar = () => {
      const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!activo && !evento.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <ItemMenu
        key={route.key}
        icono={icono}
        etiqueta={etiqueta}
        activo={activo}
        colapsado={colapsado}
        meta={contadores?.[ruta]}
        onPress={alPulsar}
      />
    );
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: colapsado ? ANCHO_SIDEBAR_COLAPSADO : t.size.sidebarW,
        borderRightWidth: 1,
        borderRightColor: t.colors.border,
        backgroundColor: t.colors.bg,
        paddingHorizontal: colapsado ? t.spacing[2] : t.spacing[3],
        paddingTop: t.spacing[3],
        paddingBottom: t.spacing[4],
        gap: t.spacing[1],
        alignItems: colapsado ? 'center' : 'stretch',
      }}
    >
      <Switcher colapsado={colapsado} />

      {!colapsado && <Buscador onPress={onBuscar} />}

      <View style={{ gap: 1, marginTop: t.spacing[4], alignItems: colapsado ? 'center' : 'stretch' }}>
        {GRUPO_PRINCIPAL.map(itemDe)}
      </View>

      <View style={{ gap: 1, marginTop: t.spacing[4], alignItems: colapsado ? 'center' : 'stretch' }}>
        {!colapsado && (
          <Text variant="overline" color="text3" style={{ paddingHorizontal: t.spacing[2], paddingBottom: t.spacing[2] }}>
            Organización
          </Text>
        )}
        {GRUPO_ORGANIZACION.map(itemDe)}
      </View>

      <View style={{ flex: 1 }} />

      <PieOrganizacion
        colapsado={colapsado}
        cargando={cargando}
        nombreUsuario={cuenta ? cuenta.nombre || cuenta.email?.split('@')[0] || '' : ''}
        organizacion={cuenta?.organizacionNombre ?? null}
        plan={cuenta?.plan ?? null}
      />
    </View>
  );
}

/** Atajo Cmd/Ctrl+K: solo existe en web, donde hay teclado físico y `document`. */
function useAtajoBuscar(onBuscar?: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !onBuscar) return;

    const alPulsarTecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onBuscar();
      }
    };
    document.addEventListener('keydown', alPulsarTecla);
    return () => document.removeEventListener('keydown', alPulsarTecla);
  }, [onBuscar]);
}

/** Selector de organización (`ma-switcher`). Solo visual: todavía no hay más de una organización por usuario. */
function Switcher({ colapsado }: { colapsado: boolean }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);

  return (
    <PressableEscala
      escala={0.98}
      accessibilityLabel="MeetingAI, cambiar de organización"
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: colapsado ? 'center' : undefined,
        gap: 10,
        height: ALTO_SWITCHER,
        width: colapsado ? LADO_ITEM_COLAPSADO : undefined,
        paddingHorizontal: colapsado ? 0 : t.spacing[2],
        borderRadius: t.radius.md,
        backgroundColor: hover ? t.colors.fillHover : 'transparent',
      }}
    >
      <AppIcon size={24} />
      {!colapsado && (
        <>
          <Text variant="label" style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, letterSpacing: -0.14 }}>
            MeetingAI
          </Text>
          <View style={{ marginLeft: 'auto' }}>
            <ChevronsUpDown size={t.size.iconSm} color={t.colors.text3} strokeWidth={1.6} />
          </View>
        </>
      )}
    </PressableEscala>
  );
}

function Buscador({ onPress }: { onPress?: () => void }) {
  const t = useTheme();
  const esMac = Platform.OS === 'web' && typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Buscar"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[2],
        height: ALTO_BUSCADOR,
        marginTop: 6,
        paddingHorizontal: t.spacing[3],
        borderRadius: t.radius.md,
        backgroundColor: t.colors.surface2,
      }}
    >
      <Search size={t.size.iconSm} color={t.colors.text2} strokeWidth={1.6} />
      <Text variant="label" color="text3" style={{ flex: 1, fontFamily: 'Geist_400Regular' }}>
        Buscar
      </Text>
      {Platform.OS === 'web' && (
        <View
          style={{
            minWidth: 18,
            paddingHorizontal: 5,
            borderRadius: t.radius.xs,
            borderWidth: 1,
            borderColor: t.colors.border,
            backgroundColor: t.colors.surface2,
            alignItems: 'center',
          }}
        >
          <Text variant="metadata" color="text2" style={{ fontSize: 11, lineHeight: 16 }}>
            {esMac ? '⌘K' : 'Ctrl K'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface PropsItemMenu {
  icono: LucideIcon;
  etiqueta: string;
  activo: boolean;
  colapsado: boolean;
  meta?: number;
  onPress: () => void;
}

function ItemMenu({ icono: Icono, etiqueta, activo, colapsado, meta, onPress }: PropsItemMenu) {
  const t = useTheme();
  const [hover, setHover] = useState(false);

  return (
    <PressableEscala
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      escala={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: colapsado ? 'center' : undefined,
        gap: 10,
        height: colapsado ? LADO_ITEM_COLAPSADO : ALTO_ITEM,
        width: colapsado ? LADO_ITEM_COLAPSADO : undefined,
        paddingHorizontal: colapsado ? 0 : t.spacing[2],
        borderRadius: t.radius.sm,
        backgroundColor: activo ? t.colors.fillPress : hover ? t.colors.fillHover : 'transparent',
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
    >
      <Icono size={18} color={activo ? t.colors.brand : t.colors.text2} strokeWidth={1.6} />
      {!colapsado && (
        <Text variant="label" color={activo ? 'text' : 'text2'} style={{ fontSize: 13.5 }}>
          {etiqueta}
        </Text>
      )}
      {!colapsado && meta !== undefined && (
        <Text variant="metadata" color="text3" style={{ marginLeft: 'auto', fontSize: 11 }}>
          {meta}
        </Text>
      )}
    </PressableEscala>
  );
}

interface PropsPie {
  colapsado: boolean;
  cargando: boolean;
  nombreUsuario: string;
  organizacion: string | null;
  plan: string | null;
}

/** Pie del sidebar (`ma-sidebar-foot`): avatar del usuario y organización con su plan. Sin dato, texto neutro en vez de inventarlo. */
function PieOrganizacion({ colapsado, cargando, nombreUsuario, organizacion, plan }: PropsPie) {
  const t = useTheme();
  const letras = iniciales(nombreUsuario);

  const avatar = (
    <View
      accessibilityLabel={nombreUsuario || undefined}
      style={{
        width: LADO_AVATAR,
        height: LADO_AVATAR,
        borderRadius: t.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.surface2,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    >
      {letras ? (
        <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 9.5, lineHeight: 12, letterSpacing: 0.1 }} color="text2">
          {letras}
        </Text>
      ) : (
        <User size={12} color={t.colors.text2} strokeWidth={1.6} />
      )}
    </View>
  );

  if (colapsado) {
    return <View style={{ padding: t.spacing[2] }}>{avatar}</View>;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: t.spacing[2] }}>
      {avatar}
      {!cargando && (
        <View style={{ flex: 1 }}>
          <Text variant="label" numberOfLines={1} style={{ fontSize: 13, lineHeight: 16 }}>
            {organizacion ?? 'Sin organización'}
          </Text>
          {plan && (
            <Text variant="caption" color="text2" numberOfLines={1} style={{ fontSize: 12, lineHeight: 16 }}>
              Plan {capitalizar(plan)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
