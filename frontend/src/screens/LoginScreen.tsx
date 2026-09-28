import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleLogoIcon } from 'phosphor-react-native';
import { ScreenBackground } from '../components/ScreenBackground';
import { LogoBadge } from '../components/LogoBadge';
import { Boton } from '../components/Boton';
import { Aviso } from '../components/Aviso';
import { iniciarSesion, registrarse, iniciarSesionConProveedor, ErrorAuth } from '../services/authService';
import { colors, espaciado, radios, textos, tipografia } from '../theme';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

interface CampoProps {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  secreto?: boolean;
  tipoTeclado?: 'default' | 'email-address';
}

/** Campo de formulario. Mismo lenguaje visual que Buscador: borde que cambia al enfocar, sin halo de sistema. */
function Campo({ etiqueta, valor, onCambiar, secreto = false, tipoTeclado = 'default' }: CampoProps) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={styles.campo}>
      <Text style={textos.etiqueta}>{etiqueta}</Text>
      <View style={[styles.campoEntrada, enfocado && styles.campoEnfocado]}>
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          secureTextEntry={secreto}
          keyboardType={tipoTeclado}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel={etiqueta}
        />
      </View>
    </View>
  );
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [registrando, setRegistrando] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoRegistro, setAvisoRegistro] = useState<string | null>(null);

  const enviar = useCallback(async () => {
    setError(null);
    setAvisoRegistro(null);
    setCargando(true);
    try {
      if (registrando) {
        await registrarse(email, password);
        // Con confirmación de email activada, signUp no deja sesión iniciada
        // todavía: se avisa en vez de fingir que ya se puede entrar.
        setAvisoRegistro('Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesión.');
        setRegistrando(false);
      } else {
        await iniciarSesion(email, password);
        // Sin navegar a mano: App.tsx escucha el cambio de sesión de Supabase
        // y muestra la app principal en cuanto onAuthStateChange dispare.
      }
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [registrando, email, password]);

  const alternarModo = useCallback(() => {
    setError(null);
    setAvisoRegistro(null);
    setRegistrando((r) => !r);
  }, []);

  const continuarConGoogle = useCallback(async () => {
    setError(null);
    setAvisoRegistro(null);
    setCargando(true);
    try {
      await iniciarSesionConProveedor('google');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, []);

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.contenido,
            { paddingTop: Math.max(insets.top, espaciado.xxl) + espaciado.xxl, paddingBottom: insets.bottom + espaciado.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encabezado}>
            <LogoBadge size={56} />
            <Text style={textos.display}>MeetingAI</Text>
            <Text style={[textos.apoyo, styles.centrado]}>
              {registrando ? 'Crea tu cuenta para empezar' : 'Inicia sesión para continuar'}
            </Text>
          </View>

          <View style={styles.formulario}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
            {avisoRegistro && <Aviso tono="info" mensaje={avisoRegistro} onCerrar={() => setAvisoRegistro(null)} />}

            <Campo etiqueta="Email" valor={email} onCambiar={setEmail} tipoTeclado="email-address" />
            <Campo etiqueta="Contraseña" valor={password} onCambiar={setPassword} secreto />

            <Boton
              titulo={cargando ? 'Un momento…' : registrando ? 'Crear cuenta' : 'Iniciar sesión'}
              cargando={cargando}
              disabled={!email || !password}
              onPress={enviar}
            />

            <View style={styles.separador}>
              <View style={styles.linea} />
              <Text style={textos.meta}>O</Text>
              <View style={styles.linea} />
            </View>

            <Boton
              titulo="Continuar con Google"
              variante="secundario"
              icono={(color, size) => <GoogleLogoIcon size={size} weight="bold" color={color} />}
              onPress={continuarConGoogle}
              disabled={cargando}
            />

            <Pressable onPress={alternarModo} disabled={cargando} accessibilityRole="button">
              <Text style={[textos.accion, styles.enlace]}>
                {registrando ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crea una'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: espaciado.xxl,
    justifyContent: 'center',
    gap: espaciado.xxxl,
  },
  encabezado: { alignItems: 'center', gap: espaciado.md },
  centrado: { textAlign: 'center' },
  formulario: { gap: espaciado.lg },
  campo: { gap: espaciado.sm },
  campoEntrada: {
    height: 52,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    justifyContent: 'center',
  },
  campoEnfocado: { borderColor: colors.acento },
  input: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    color: colors.textoPrincipal,
    outlineStyle: 'none',
  } as never,
  enlace: { textAlign: 'center', color: colors.marronClaro },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espaciado.sm },
  linea: { flex: 1, height: 1, backgroundColor: colors.borde },
});
