import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

/**
 * Placeholder de la pantalla de grabación (Épica 1: grabar, pausar, reanudar, detener).
 * La implementación real usará expo-av para el control del micrófono y
 * services/uploadService.ts para subir cada clip a Supabase Storage al finalizar.
 */
export function RecorderScreen() {
  const [estado, setEstado] = useState<'inactivo' | 'grabando' | 'pausado'>('inactivo');

  return (
    <View style={styles.container}>
      <Text style={styles.estado}>Estado: {estado}</Text>

      {estado === 'inactivo' && (
        <Button title="Iniciar grabación" onPress={() => setEstado('grabando')} />
      )}
      {estado === 'grabando' && (
        <>
          <Button title="Pausar" onPress={() => setEstado('pausado')} />
          <Button title="Detener" onPress={() => setEstado('inactivo')} />
        </>
      )}
      {estado === 'pausado' && (
        <>
          <Button title="Reanudar" onPress={() => setEstado('grabando')} />
          <Button title="Detener" onPress={() => setEstado('inactivo')} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  estado: { fontSize: 18, marginBottom: 16 },
});
