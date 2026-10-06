import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenBackground } from '../components/ScreenBackground';
import { LogoBadge } from '../components/LogoBadge';
import { Boton } from '../components/Boton';
import { Aviso } from '../components/Aviso';
import { CampoFormulario } from '../components/CampoFormulario';
import { registrarse, ErrorAuth } from '../services/authService';
import { colors, espaciado, textos } from '../theme';
import type { AuthStackParamList } from '../../App';

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

export function RegistroScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [organizacionNombre, setOrganizacionNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await registrarse(email, password, { nombre, organizacionNombre, telefono });
      // Con confirmación de email activada, signUp no deja sesión iniciada
      // todavía: se vuelve a Login con un aviso en vez de fingir que ya se puede entrar.
      navigation.navigate('Login', {
        avisoRegistro: 'Cuenta creada. Revisa tu email para confirmarla antes de iniciar sesión.',
      });
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [email, password, nombre, organizacionNombre, telefono, navigation]);

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
            <Text style={[textos.apoyo, styles.centrado]}>Crea tu cuenta para empezar</Text>
          </View>

          <View style={styles.formulario}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

            <CampoFormulario etiqueta="Nombre" valor={nombre} onCambiar={setNombre} placeholder="Tu nombre completo" />
            <CampoFormulario
              etiqueta="Email"
              valor={email}
              onCambiar={setEmail}
              tipoTeclado="email-address"
              placeholder="tu@email.com"
            />
            <CampoFormulario
              etiqueta="Contraseña"
              valor={password}
              onCambiar={setPassword}
              secreto
              placeholder="••••••••"
            />
            <CampoFormulario
              etiqueta="Nombre de la organización (opcional)"
              valor={organizacionNombre}
              onCambiar={setOrganizacionNombre}
              placeholder="Ej. Iglesia Central"
            />
            <CampoFormulario
              etiqueta="Teléfono (opcional)"
              valor={telefono}
              onCambiar={setTelefono}
              tipoTeclado="phone-pad"
              placeholder="600 000 000"
            />

            <Boton
              titulo={cargando ? 'Un momento…' : 'Crear cuenta'}
              cargando={cargando}
              disabled={!email || !password}
              onPress={enviar}
            />

            <Pressable onPress={() => navigation.navigate('Login')} disabled={cargando} accessibilityRole="button">
              <Text style={[textos.accion, styles.enlace]}>¿Ya tienes cuenta? Inicia sesión</Text>
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
  enlace: { textAlign: 'center', color: colors.marronClaro },
});
