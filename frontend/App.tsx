import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecorderScreen } from './src/screens/RecorderScreen';

// Pantallas reales según el diseño de Figma Make, pendientes de exportar y adaptar.
// Este stack de navegación es un punto de partida mínimo para arrancar el desarrollo.
export type RootStackParamList = {
  Home: undefined;
  Recorder: { reunionId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Reuniones' }} />
        <Stack.Screen name="Recorder" component={RecorderScreen} options={{ title: 'Grabar reunión' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
