import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PencilSimpleIcon, StarIcon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';

interface Props {
  nombre: string;
  email: string;
  plan: string;
  onEditar?: () => void;
}

export function TarjetaPerfil({ nombre, email, plan, onEditar }: Props) {
  return (
    <LinearGradient
      colors={[...colors.marronGradiente]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.tarjeta}
    >
      <View>
        <View style={styles.avatar}>
          <Text style={styles.inicial}>{nombre.charAt(0).toUpperCase()}</Text>
        </View>

        <PressableEscala
          onPress={onEditar}
          escala={0.88}
          style={styles.editar}
          accessibilityLabel="Editar perfil"
        >
          <PencilSimpleIcon size={12} weight="fill" color={colors.marronOscuro} />
        </PressableEscala>
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.nombre} numberOfLines={1}>
          {nombre}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>

        <View style={styles.plan}>
          <StarIcon size={11} weight="fill" color={colors.textoInverso} />
          <Text style={styles.planTexto}>{plan}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const TAMANO_AVATAR = 62;

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.lg,
    padding: espaciado.xl,
    borderRadius: radios.xxl,
    ...sombras.elevada,
  },
  avatar: {
    width: TAMANO_AVATAR,
    height: TAMANO_AVATAR,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.acento,
  },
  inicial: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.xxl,
    color: colors.textoInverso,
  },
  editar: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.crema,
    borderWidth: 2,
    borderColor: colors.marronOscuro,
  },
  cuerpo: { flex: 1, gap: 3 },
  nombre: {
    ...textos.subtitulo,
    fontSize: tipografia.tamano.xl,
    color: colors.textoInverso,
  },
  email: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.sm,
    color: colors.textoInversoSuave,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaciado.xs + 1,
    marginTop: espaciado.sm,
    paddingVertical: 5,
    paddingHorizontal: espaciado.md,
    borderRadius: radios.pill,
    backgroundColor: 'rgba(255, 252, 248, 0.18)',
  },
  planTexto: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.xs,
    color: colors.textoInverso,
  },
});
