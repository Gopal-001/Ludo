import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { LudoTheme } from '../../themes/themes';

const DICE_SIZE = 56; // slightly compact base size

interface DiceProps {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  theme: LudoTheme;
  onRoll: () => void;
}

const DOT_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
};

export const Dice: React.FC<DiceProps> = ({ value, rolling, disabled, theme, onRoll }) => {
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const [rollingFace, setRollingFace] = useState(1);

  useEffect(() => {
    if (!rolling) {
      // Snap back to resting state if animation was interrupted
      scale.setValue(1);
      rotate.setValue(0);
      return;
    }

    // ── Flash random faces during the roll ──────────────────────────────────
    const faceInterval = setInterval(() => {
      setRollingFace(Math.floor(Math.random() * 6) + 1);
    }, 60);

    // Start from small
    scale.setValue(0.25);
    rotate.setValue(0);

    Animated.sequence([

      // Phase 1 — Grow + clockwise spin (0–420ms)
      // Slowly expand from tiny to 1.6× while doing one full CW rotation.
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,          // 0° → 360° CW
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 2 — Reverse wobble at peak (420–540ms)
      // Dice is biggest here; kicks back counterclockwise ~90°.
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0.75,       // 360° → 270° CCW
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 3 — Forward again (540–680ms)
      // Snaps clockwise past 360° to 450° before settling.
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.55,
          duration: 140,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1.25,       // 270° → 450° CW
          duration: 140,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 4 — Shrink + slow to rest (680–900ms)
      // Shrinks back to 1× while rotation eases out to final angle.
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1.5,        // 450° → 540° — gentle last turn, then stops
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

    ]).start(() => {
      clearInterval(faceInterval);
      rotate.setValue(0); // reset rotation so it doesn't compound next roll
    });

    return () => clearInterval(faceInterval);
  }, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  const rotateInterpolated = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend', // allows values > 1 to continue linearly
  });

  const displayValue = rolling ? rollingFace : (value ?? 1);
  const dots = DOT_POSITIONS[displayValue] ?? DOT_POSITIONS[1];
  const dotR = DICE_SIZE * 0.07;

  return (
    <TouchableOpacity
      onPress={!disabled ? onRoll : undefined}
      activeOpacity={disabled ? 1 : 0.7}
      style={[styles.wrapper, disabled && styles.disabled]}
    >
      <Animated.View
        style={{
          transform: [
            { rotate: rotateInterpolated },
            { scale },
          ],
        }}
      >
        <Svg width={DICE_SIZE} height={DICE_SIZE}>
          {/* Drop shadow */}
          <Rect
            x={3} y={3}
            width={DICE_SIZE - 2} height={DICE_SIZE - 2}
            rx={10}
            fill={theme.diceShadow}
          />
          {/* Face */}
          <Rect
            x={0} y={0}
            width={DICE_SIZE - 2} height={DICE_SIZE - 2}
            rx={10}
            fill={theme.diceFace}
            stroke={theme.border}
            strokeWidth={1.5}
          />
          {/* Dots */}
          {dots.map(([cx, cy], i) => (
            <Circle
              key={i}
              cx={cx * (DICE_SIZE - 2)}
              cy={cy * (DICE_SIZE - 2)}
              r={dotR}
              fill={displayValue === 6 ? theme.accent : theme.diceDot}
            />
          ))}
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper:  { padding: 4 },
  disabled: { opacity: 0.45 },
});
