import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { LudoTheme, getPlayerColor } from '../../themes/themes';
import { PlayerColor, GuttiSkin } from '../../engine/types';
import { PIECE_SKINS } from '../Piece/skins';

const DICE_SIZE = 56; // slightly compact base size

interface DiceProps {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  theme: LudoTheme;
  playerColor: PlayerColor;
  playerSkin: GuttiSkin;
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

export const Dice: React.FC<DiceProps> = ({ value, rolling, disabled, theme, playerColor, playerSkin, onRoll }) => {
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const [rollingFace, setRollingFace] = useState(1);

  useEffect(() => {
    if (!rolling) {
      // Snap back to resting state if animation was interrupted
      // Use 0-duration timing to force instant native-driver sync
      Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }).start();
      Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      return;
    }

    // ── Flash random faces during the roll ──────────────────────────────────
    const faceInterval = setInterval(() => {
      setRollingFace(Math.floor(Math.random() * 6) + 1);
    }, 60);

    // Start from small and grounded
    scale.setValue(0.25);
    rotate.setValue(0);
    translateY.setValue(0);

    const sequence = Animated.sequence([

      // Phase 1 — Jump up + Grow + Spin (0–420ms)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -80, // Jump high up
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Phase 2 — Hang time + Wobble (420–540ms)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1.25,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -90, // Float slightly higher at the apex
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 3 — Start falling + Forward spin (540–680ms)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.55,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1.5,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50, // Start accelerating down
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Phase 4 — Hit the ground (680–900ms)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 2,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0, // Slam back onto the board
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(() => {
      clearInterval(faceInterval);
      rotate.setValue(0);
    });

    return () => {
      clearInterval(faceInterval);
      sequence.stop();
    };
  }, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if(!!value){
      setRollingFace(value)
    }
  }, [value])

  const rotateInterpolated = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend', // allows values > 1 to continue linearly
  });
  
  const displayValue = rollingFace;
  const dots = DOT_POSITIONS[displayValue] ?? DOT_POSITIONS[1];
  const dotR = DICE_SIZE * 0.07;
  
  const SkinView = PIECE_SKINS[playerSkin] ?? PIECE_SKINS.round;
  const playerFill = getPlayerColor(theme, playerColor);

  // Derive gradient based on player color for the left compartment
  const getGradientColors = (color: PlayerColor) => {
    switch(color) {
      case 'red': return ['#8B0000', '#FF7F7F'] as const;
      case 'green': return ['#006400', '#90EE90'] as const;
      case 'yellow': return ['#B8860B', '#FFFACD'] as const;
      case 'blue': return ['#00008B', '#ADD8E6'] as const;
      default: return ['#333', '#888'] as const;
    }
  };

  const isRightSide = playerColor === 'green' || playerColor === 'yellow';

  return (
    <TouchableOpacity
      onPress={!disabled ? onRoll : undefined}
      activeOpacity={disabled ? 1 : 0.8}
      style={[
        styles.padContainer,
        (disabled && !rolling) && styles.disabled,
      ]}
    >
      <View style={[styles.innerContainer, { flexDirection: isRightSide ? 'row-reverse' : 'row' }]}>
        {/* Compartment: Player Icon (Outer Edge) */}
        <LinearGradient
          colors={getGradientColors(playerColor)}
          start={isRightSide ? { x: 1, y: 0 } : { x: 0, y: 0 }}
          end={isRightSide ? { x: 0, y: 0 } : { x: 1, y: 0 }}
          style={[
            styles.iconCompartment,
            isRightSide 
              ? { borderLeftWidth: 2, borderLeftColor: '#FFD700', borderTopRightRadius: 9, borderBottomRightRadius: 9 } 
              : { borderRightWidth: 2, borderRightColor: '#FFD700', borderTopLeftRadius: 9, borderBottomLeftRadius: 9 }
          ]}
        >
          <View pointerEvents="none" style={{ transform: [{ scale: 0.85 }] }}>
            <SkinView radius={18} fill={playerFill} isMovable={false} />
          </View>
        </LinearGradient>

        {/* Compartment: Dice (Inner Board Side) */}
        <View style={[
          styles.diceCompartment, 
          { backgroundColor: theme.surface, zIndex: 10 },
          isRightSide 
             ? { borderRightWidth: 0, borderTopLeftRadius: 9, borderBottomLeftRadius: 9 } 
             : { borderLeftWidth: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9 }
        ]}>
          <Animated.View
            style={{
              transform: [
                { translateY },
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
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  padContainer: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFD700', // Gold outer border
    backgroundColor: '#FFD700',
    // Outer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  innerContainer: {
    flexDirection: 'row',
    borderRadius: 9,
  },
  iconCompartment: {
    width: DICE_SIZE * 0.8,
    height: DICE_SIZE + 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceCompartment: {
    width: DICE_SIZE + 16,
    height: DICE_SIZE + 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Slight inner shadow effect
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  disabled: { opacity: 0.45 },
});
