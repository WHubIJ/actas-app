// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // El patrón `useRef(new Animated.Value(...)).current` es la forma
      // estándar de animar con la API `Animated` de React Native, y el
      // proyecto ya la usa así (GrabacionScreen, MicPulse, Cronometro...).
      // `react-hooks/refs` (pensada para React Compiler) confunde ese
      // `.current` con un ref de DOM y genera ~60 falsos positivos en el
      // proyecto. Se desactiva hasta que el proyecto migre a Reanimated o la
      // regla distinga Animated.Value de un ref real.
      'react-hooks/refs': 'off',

      // El proyecto ya usa `ReadonlyArray<T>` de forma consistente
      // (SelectorSegmentos, ChipsFiltro, HojaOpciones, MisActasScreen,
      // DetalleActaScreen). El default de esta regla pide `readonly T[]`
      // para los arrays de solo lectura; se ajusta para no pelear con un
      // patrón ya establecido en vez de forzar un cambio masivo de estilo.
      '@typescript-eslint/array-type': ['warn', { default: 'array', readonly: 'generic' }],
    },
  },
  {
    ignores: ["dist/*"],
  }
]);
