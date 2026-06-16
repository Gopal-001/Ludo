import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { G, Circle, Rect } from 'react-native-svg';
import { LudoTheme, getPlayerColor, getHomeColor } from '../../themes/themes';
import { PlayerColor } from '../../engine/types';
import { HOME_BASE_CELLS } from '../../engine/boardData';
import { CELL, AnimatedRect } from './boardConstants';

interface HomeAreaProps {
  color: PlayerColor;
  row: number;
  col: number;
  theme: LudoTheme;
  isActive?: boolean;
}

export const HomeArea: React.FC<HomeAreaProps> = ({ color, row, col, theme, isActive }) => {
  const bg = getHomeColor(theme, color);
  const pc = getPlayerColor(theme, color);
  const x = col * CELL;
  const y = row * CELL;
  const size = 6 * CELL;
  const spots = HOME_BASE_CELLS[color];
  const spotR = CELL * 0.46;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ])
      ).start();
    } else {
      anim.stopAnimation();
      anim.setValue(0);
    }
  }, [isActive, anim]);

  const animatedOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0.95],
  });

  return (
    <G>
      {/* Outer home area (darker shade with pulse) */}
      <Rect x={x} y={y} width={size} height={size} fill={bg} stroke={theme.cellBorder} strokeWidth={1} />
      <AnimatedRect x={x} y={y} width={size} height={size} fill={pc} opacity={animatedOpacity as any} />

      {/* Inner home circle area (lighter shade) */}
      <Rect
        x={x + CELL * 0.6}
        y={y + CELL * 0.6}
        width={size - CELL * 1.2}
        height={size - CELL * 1.2}
        rx={CELL * 0.6}
        fill={bg}
        stroke={pc}
        strokeWidth={2}
        strokeOpacity={0.6}
      />

      {/* Individual piece spots */}
      {spots.map(([r, c], i) => {
        let cx = c * CELL + CELL / 2;
        let cy = r * CELL + CELL / 2;
        const homeCenterX = x + 3 * CELL;
        const homeCenterY = y + 3 * CELL;
        const spreadFactor = 1.35;
        cx = homeCenterX + (cx - homeCenterX) * spreadFactor;
        cy = homeCenterY + (cy - homeCenterY) * spreadFactor;
        return (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={spotR} fill={pc} opacity={0.35} stroke={pc} strokeWidth={2} strokeOpacity={0.85} />
            <Circle cx={cx} cy={cy} r={spotR * 0.42} fill={pc} opacity={0.65} />
          </G>
        );
      })}
    </G>
  );
};
