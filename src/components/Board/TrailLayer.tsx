import React from 'react';
import { G, Circle, Rect } from 'react-native-svg';
import { TrailCell } from '../../hooks/usePieceAnimation';
import { CELL } from './boardConstants';

interface TrailLayerProps {
  cells: TrailCell[];
}

/**
 * Renders fading colored circles on each cell the active piece passed through.
 * Uses Animated.Value opacity so they fade out smoothly.
 */
export const TrailLayer: React.FC<TrailLayerProps> = ({ cells }) => {
  if (cells.length === 0) return null;

  // We need AnimatedCircle for opacity support
  const { Animated } = require('react-native');
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const AnimatedRect = Animated.createAnimatedComponent(Rect);

  return (
    <G>
      {cells.map(cell => {
        const cx = cell.col * CELL + CELL / 2;
        const cy = cell.row * CELL + CELL / 2;
        return (
          <G key={cell.key}>
            {/* Glow fill */}
            <AnimatedRect
              x={cell.col * CELL}
              y={cell.row * CELL}
              width={CELL}
              height={CELL}
              fill={cell.colorHex}
              opacity={cell.opacity as any}
            />
            {/* Bright center dot */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={CELL * 0.18}
              fill="#FFFFFF"
              opacity={cell.opacity as any}
            />
          </G>
        );
      })}
    </G>
  );
};
