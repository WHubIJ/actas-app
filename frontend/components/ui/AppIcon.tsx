import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Line } from 'react-native-svg';

const SQUIRCLE_PATH =
  'M972 512L971 704L967 764L961 807L953 841L942 869L929 893L912 912L893 929L869 942L841 953L807 961L764 967L704 971L512 972L320 971L260 967L217 961L183 953L155 942L131 929L112 912L95 893L82 869L71 841L63 807L57 764L53 704L52 512L53 320L57 260L63 217L71 183L82 155L95 131L112 112L131 95L155 82L183 71L217 63L260 57L320 53L512 52L704 53L764 57L807 63L841 71L869 82L893 95L912 112L929 131L942 155L953 183L961 217L967 260L971 320Z';

/** Las 5 barras del motivo de audio, centradas en el squircle (viewBox 1024). */
const BARRAS = [
  { x: 272, y1: 460, y2: 564 },
  { x: 392, y1: 372, y2: 652 },
  { x: 512, y1: 288, y2: 736 },
  { x: 632, y1: 400, y2: 624 },
  { x: 752, y1: 464, y2: 560 },
];

/**
 * Marca de MeetingAI: squircle violeta con degradado + motivo de audio.
 * Mismo path en todos los previews de `design/` — no es una aproximación,
 * es el icono real a cualquier tamaño (viewBox 0 0 1024 1024).
 */
export function AppIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="MeetingAI">
      <Defs>
        <LinearGradient id="eg-meeting" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7768dd" />
          <Stop offset="1" stopColor="#5a4ac2" />
        </LinearGradient>
      </Defs>
      <Path d={SQUIRCLE_PATH} fill="url(#eg-meeting)" />
      <Path d={SQUIRCLE_PATH} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={4} />
      {BARRAS.map((b) => (
        <Line key={b.x} x1={b.x} y1={b.y1} x2={b.x} y2={b.y2} stroke="#fff" strokeWidth={72} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
