import { useCallback, useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, KeyRound, MailCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Text,
  Button,
  Input,
  Aviso,
  PasosAuth,
  GlifoAuth,
  MarcoAuth,
  EncabezadoAuth,
  PieEnlaceAuth,
  useAccesoEscritorio,
} from '../../components/ui';
import { enviarEnlaceRecuperacion, ErrorAuth } from '../services/authService';
import type { AuthStackParamList } from '../../App';

/** Supabase limita los correos de recuperación por usuario; esperar evita pedirlos en vano. */
const ESPERA_REENVIO_SEGUNDOS = 60;

/** Mismo patrón que en las demás pantallas: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorAuth) return err.message;
  return porDefecto;
}

function formatearEspera(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

/**
 * Pasos 1 (correo) y 2 (revisa tu correo) de la recuperación. El 3 y el 4
 * viven en `NuevaContrasenaScreen`, que se abre al llegar el enlace del email.
 */
export function RecuperarContrasenaScreen() {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const esEscritorio = useAccesoEscritorio();

  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const enviar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await enviarEnlaceRecuperacion(email.trim());
      // Mismo resultado exista o no esa cuenta (no enumerar correos).
      setEnviado(true);
      setEspera(ESPERA_REENVIO_SEGUNDOS);
    } catch (err) {
      setError(mensajeError(err, 'Algo ha ido mal. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [email]);

  const tamano = esEscritorio ? 'lg' : 'xl';
  const volverALogin = () => navigation.navigate('Login');

  if (enviado) {
    return (
      <MarcoAuth volver={{ etiqueta: 'Cambiar correo', onPress: () => setEnviado(false) }}>
        <PasosAuth total={4} actual={2} etiqueta="Revisa tu correo" />
        <GlifoAuth icono={(c) => <MailCheck size={24} color={c} strokeWidth={1.6} />} />
        <EncabezadoAuth titulo="Revisa tu correo">
          Si existe una cuenta con{' '}
          <Text color="text" style={{ fontFamily: 'Geist_500Medium' }}>
            {email.trim()}
          </Text>
          , recibirás un enlace en unos segundos. Ábrelo desde este dispositivo para crear una contraseña nueva.
        </EncabezadoAuth>

        {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          <Text variant="caption" color="text2" style={{ fontSize: 13.5 }}>
            ¿No te llega? Revisa la carpeta de spam o{' '}
          </Text>
          <Pressable
            onPress={enviar}
            disabled={espera > 0 || cargando}
            accessibilityRole="button"
            style={{ minHeight: t.size.touchMin, justifyContent: 'center', marginVertical: -t.spacing[3] }}
          >
            <Text variant="caption" color={espera > 0 ? 'text3' : 'brandStrong'} style={{ fontSize: 13.5, fontFamily: 'Geist_500Medium' }}>
              {espera > 0 ? 'reenvía en ' : 'reenvíalo ahora'}
              {espera > 0 && <Text variant="metadata">{formatearEspera(espera)}</Text>}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: esEscritorio ? t.spacing[2] : 'auto' }}>
          <Button label="Volver a iniciar sesión" variant="secondary" size={tamano} fullWidth onPress={volverALogin} />
        </View>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth volver={{ etiqueta: esEscritorio ? 'Volver a iniciar sesión' : 'Iniciar sesión', onPress: volverALogin }}>
      <PasosAuth total={4} actual={1} etiqueta="Tu correo" />
      <GlifoAuth icono={(c) => <KeyRound size={24} color={c} strokeWidth={1.6} />} />
      <EncabezadoAuth titulo="¿Olvidaste tu contraseña?">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.
      </EncabezadoAuth>

      {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

      <Input
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        placeholder="nombre@organizacion.org"
        icon={(c) => <Mail size={18} color={c} strokeWidth={1.6} />}
        onSubmitEditing={email.trim() ? enviar : undefined}
      />

      <View style={{ marginTop: esEscritorio ? 0 : 'auto' }}>
        <Button label={cargando ? 'Enviando…' : 'Enviar enlace'} size={tamano} fullWidth loading={cargando} disabled={!email.trim()} onPress={enviar} />
      </View>

      {esEscritorio && <PieEnlaceAuth pregunta="¿Ya la recuerdas?" accion="Inicia sesión" onPress={volverALogin} disabled={cargando} />}
    </MarcoAuth>
  );
}
