import { Fragment, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text } from '../../components/ui';

/** Un tramo del breadcrumb. Con `onPress` es navegable; el último tramo es la página actual y no suele llevarlo. */
export interface Miga {
  etiqueta: string;
  onPress?: () => void;
}

interface Props {
  migas: ReadonlyArray<Miga>;
  acciones?: ReactNode;
  panelDerecho?: ReactNode;
  /** `true` (por defecto) envuelve el contenido en un `ScrollView`. Ponlo a `false` si la pantalla trae su propia lista virtualizada. */
  scroll?: boolean;
  children: ReactNode;
}

/** Ancho del panel derecho; el kit lo mueve entre 316 y 340 (`ReviewScreen.html`). */
const ANCHO_PANEL = 316;

/**
 * Marco común de las pantallas web del kit (`EmptyWeb`, `LoadingWeb`,
 * `ReviewScreen`): topbar con breadcrumb y acciones, contenido con padding y,
 * opcionalmente, un panel derecho.
 *
 * Contrato:
 * - `migas`: el último elemento es la página actual (texto pleno); los
 *   anteriores van atenuados y son pulsables si traen `onPress`.
 * - `acciones`: lo que va a la derecha de la topbar. Botones `size="sm"`,
 *   secundarios o ghost y como máximo UN primario. Esta es la ubicación de
 *   "Nueva grabación"; el sidebar ya no la lleva.
 * - `panelDerecho`: columna de 316px separada por hairline, con su propio
 *   scroll, padding y `gap`. En tablet no cabe al lado: se apila debajo del
 *   contenido, separado por hairline.
 * - `children`: contenido de la página. El marco aporta el padding y limita
 *   el ancho a `t.size.contentMax`; el título (`heading`) lo pone la pantalla.
 * - `scroll`: ver `Props.scroll`. Si es `false`, `children` ocupa todo el
 *   alto disponible (`flex: 1`).
 *
 * En móvil (`< bpMobile`) no pinta nada propio: las pantallas móviles del kit
 * llevan su cabecera, su padding y su navegación inferior, y una topbar con
 * breadcrumb encima duplicaría la cabecera. Allí `acciones`, `migas`,
 * `panelDerecho` y `scroll` se ignoran y se devuelve `children` tal cual.
 */
export function MarcoPagina({ migas, acciones, panelDerecho, scroll = true, children }: Props) {
  const t = useTheme();
  const modo = useBreakpoint();

  if (modo === 'movil') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const escritorio = modo === 'escritorio';
  const panelAlLado = escritorio && panelDerecho != null;
  const panelApilado = !escritorio && panelDerecho != null;

  const contenido = (
    <View
      style={{
        width: '100%',
        maxWidth: t.size.contentMax,
        alignSelf: 'center',
        paddingTop: t.spacing[10],
        paddingHorizontal: escritorio ? t.spacing[12] : t.spacing[8],
        ...(scroll ? { paddingBottom: t.spacing[10] } : { flex: 1 }),
      }}
    >
      {children}
    </View>
  );

  const columnaPrincipal = scroll ? (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {contenido}
      {panelApilado && <Panel apilado>{panelDerecho}</Panel>}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>
      {contenido}
      {panelApilado && <Panel apilado>{panelDerecho}</Panel>}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View
        style={{
          height: t.size.topbarH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing[3],
          paddingLeft: t.spacing[6],
          paddingRight: t.spacing[5],
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border,
        }}
      >
        <Migas migas={migas} />
        <View style={{ flex: 1 }} />
        {acciones != null && <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>{acciones}</View>}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', minHeight: 0 }}>
        {columnaPrincipal}
        {panelAlLado && <Panel>{panelDerecho}</Panel>}
      </View>
    </View>
  );
}

function Migas({ migas }: { migas: ReadonlyArray<Miga> }) {
  const t = useTheme();

  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2], flexShrink: 1 }}>
      {migas.map((miga, i) => {
        const actual = i === migas.length - 1;
        const texto = (
          <Text variant="label" color={actual ? 'text' : 'text2'} numberOfLines={1} style={{ fontSize: 13.5 }}>
            {miga.etiqueta}
          </Text>
        );
        return (
          <Fragment key={`${i}-${miga.etiqueta}`}>
            {i > 0 && (
              <Text variant="label" color="text3" style={{ fontSize: 13.5 }}>
                /
              </Text>
            )}
            {miga.onPress ? (
              <Pressable onPress={miga.onPress} accessibilityRole="link" accessibilityLabel={miga.etiqueta}>
                {texto}
              </Pressable>
            ) : (
              <View style={{ flexShrink: 1 }}>{texto}</View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

function Panel({ children, apilado = false }: { children: ReactNode; apilado?: boolean }) {
  const t = useTheme();
  const relleno = { padding: t.spacing[6], paddingHorizontal: t.spacing[5], gap: t.spacing[5] } as const;

  if (apilado) {
    return <View style={{ borderTopWidth: 1, borderTopColor: t.colors.border, ...relleno }}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ width: ANCHO_PANEL, flexGrow: 0, borderLeftWidth: 1, borderLeftColor: t.colors.border }}
      contentContainerStyle={relleno}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
