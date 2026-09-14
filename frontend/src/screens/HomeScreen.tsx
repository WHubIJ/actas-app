import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Placeholder de la pantalla principal (lista de reuniones).
 * Sustituir por el diseño real una vez exportado desde Figma Make.
 */
export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>App de Actas</Text>
      <Text style={styles.subtitle}>Aquí irá el listado de reuniones grabadas.</Text>
      <Button title="Grabar nueva reunión" onPress={() => navigation.navigate('Recorder')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 24, textAlign: 'center' },
});
