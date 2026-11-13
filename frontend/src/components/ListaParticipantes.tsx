import { View, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Badge } from '../../components/ui';
import { AvatarIniciales } from './AvatarIniciales';
import { iniciales } from '../utils/formato';

interface Props {
  participantes: ReadonlyArray<string>;
  /** Nombre del usuario actual: el participante que coincida lleva la marca "Tú". */
  nombreUsuario?: string | null;
  onQuitar: (nombre: string) => void;
}

function esElUsuario(nombre: string, nombreUsuario?: string | null): boolean {
  return !!nombreUsuario && nombre.trim().toLowerCase() === nombreUsuario.trim().toLowerCase();
}

export function ListaParticipantes({ participantes, nombreUsuario, onQuitar }: Props) {
  const t = useTheme();
  return (
    <View>
      {participantes.map((nombre) => (
        <View
          key={nombre}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing[3],
            minHeight: 56,
            paddingVertical: t.spacing[2],
            borderBottomWidth: 1,
            borderBottomColor: t.colors.border,
          }}
        >
          <AvatarIniciales iniciales={iniciales(nombre)} tamano={36} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {nombre}
            </Text>
            {esElUsuario(nombre, nombreUsuario) && <Badge label="Tú" />}
          </View>
          <Pressable
            onPress={() => onQuitar(nombre)}
            accessibilityRole="button"
            accessibilityLabel={`Quitar a ${nombre}`}
            style={({ pressed }) => ({
              width: t.size.touchMin,
              height: t.size.touchMin,
              marginRight: -t.spacing[2],
              borderRadius: t.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? t.colors.fillPress : 'transparent',
            })}
          >
            <X size={20} color={t.colors.text2} strokeWidth={1.6} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
