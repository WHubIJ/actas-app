import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { AppIcon } from './AppIcon';
import { PanelProductoAuth } from './PanelProductoAuth';

/** Escritorio (>= `bp-tablet`): formulario a la izquierda y panel de producto a la derecha. */
export function useAccesoEscritorio(): boolean {
  const t = useTheme();
  const { width } = useWindowDimensions();
  return width >= t.size.bpTablet;
}

interface Props {
  children: ReactNode;
  /** 380 para login; 420 para registro (más campos). */
  anchoMax?: 380 | 420;
  /** Enlace para retroceder: en escritorio arriba del formulario, en móvil como barra superior. */
  volver?: { etiqueta: string; onPress: () => void };
}

function EnlaceVolver({ etiqueta, onPress, escritorio }: { etiqueta: string; onPress: () => void; escritorio: boolean }) {
  const t = useTheme();
  const Icono = escritorio ? ArrowLeft : ChevronLeft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: escritorio ? t.spacing[1] : 2,
        minHeight: t.size.touchMin,
        marginTop: escritorio ? 0 : -t.spacing[2],
      }}
    >
      <Icono size={escritorio ? 16 : 22} color={t.colors.brandStrong} strokeWidth={escritorio ? 1.6 : 2} />
      <Text variant="body" color="brandStrong" style={{ fontSize: escritorio ? 14 : 16, fontFamily: 'Geist_500Medium' }}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

/**
 * Esquema común del acceso (login, registro y recuperación): formulario con
 * `ma-auth-form` y, en escritorio, lockup arriba, pie abajo y panel de producto.
 * Los hijos son los bloques del formulario; el marco les da el espaciado.
 */
export function MarcoAuth({ children, anchoMax = 380, volver }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const escritorio = useAccesoEscritorio();

  const formulario = (
    <View style={{ width: '100%', maxWidth: anchoMax, gap: t.spacing[4] }}>
      {escritorio && volver && <EnlaceVolver {...volver} escritorio />}
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {escritorio ? (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingHorizontal: t.spacing[12], paddingVertical: t.spacing[8] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
                <AppIcon size={20} />
                <Text variant="titleSm">MeetingAI</Text>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: t.spacing[6] }}
                keyboardShouldPersistTaps="handled"
              >
                {formulario}
              </ScrollView>
              <Text variant="caption" color="text2">
                © {new Date().getFullYear()} MeetingAI
              </Text>
            </View>
            <PanelProductoAuth />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: t.spacing[5],
              paddingTop: insets.top + t.spacing[2],
              paddingBottom: insets.bottom + t.spacing[6],
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexGrow: 1, width: '100%', maxWidth: anchoMax, alignSelf: 'center', gap: t.spacing[4] }}>
              {volver && <EnlaceVolver {...volver} escritorio={false} />}
              {children}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Título y entradilla de cada pantalla de acceso (`h1` + `ma-lead`). */
export function EncabezadoAuth({ titulo, children, centrado }: { titulo: string; children?: ReactNode; centrado?: boolean }) {
  const t = useTheme();
  const escritorio = useAccesoEscritorio();
  const alineacion = centrado ? 'center' : 'left';
  return (
    <View style={{ gap: t.spacing[2], alignItems: centrado ? 'center' : 'stretch' }}>
      <Text
        variant="heading"
        accessibilityRole="header"
        style={{
          fontSize: escritorio ? 30 : 28,
          lineHeight: escritorio ? 36 : 34,
          letterSpacing: escritorio ? -0.9 : -0.84,
          textAlign: alineacion,
        }}
      >
        {titulo}
      </Text>
      {children && (
        <Text color="text2" style={{ textAlign: alineacion }}>
          {children}
        </Text>
      )}
    </View>
  );
}

/** `ma-divider`: línea, texto y línea. */
export function SeparadorAuth({ texto }: { texto: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
      <Text variant="caption" color="text2">
        {texto}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
    </View>
  );
}

/** Pie de pantalla: "¿No tienes cuenta? Crear cuenta". Toda la frase es pulsable; mínimo 44px. */
export function PieEnlaceAuth({ pregunta, accion, onPress, disabled }: { pregunta: string; accion: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${pregunta} ${accion}`}
      style={{ minHeight: t.size.touchMin, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text color="text2" style={{ fontSize: 14, textAlign: 'center' }}>
        {pregunta}{' '}
        <Text color="brandStrong" style={{ fontSize: 14, fontFamily: 'Geist_500Medium' }}>
          {accion}
        </Text>
      </Text>
    </Pressable>
  );
}
