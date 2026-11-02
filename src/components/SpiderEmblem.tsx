import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface SpiderEmblemProps {
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * SpiderEmblem:
 * Minimalist, laser-precision geometric Spider-Man insignia.
 * Used for subtle brand hallmarks, watermarks, and settings icons.
 */
export const SpiderEmblem: React.FC<SpiderEmblemProps> = ({
  size = 28,
  color = '#64748B',
  opacity = 0.5,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <G opacity={opacity}>
        {/* Head Segment */}
        <Path
          d="M50 35 C48 35 46 37 46 40 C46 42 48 44 50 44 C52 44 54 42 54 40 C54 37 52 35 50 35 Z"
          fill={color}
        />
        {/* Thorax & Abdomen Body */}
        <Path
          d="M50 46 C46 46 44 51 44 60 C44 68 47 74 50 80 C53 74 56 68 56 60 C56 51 54 46 50 46 Z"
          fill={color}
        />
        {/* Upper Left Legs */}
        <Path
          d="M46 42 L24 24 M45 47 L16 38"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lower Left Legs */}
        <Path
          d="M45 54 L14 64 M47 62 L22 84"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Upper Right Legs */}
        <Path
          d="M54 42 L76 24 M55 47 L84 38"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lower Right Legs */}
        <Path
          d="M55 54 L86 64 M53 62 L78 84"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};
