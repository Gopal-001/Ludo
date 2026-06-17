import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LudoTheme, getPlayerColor } from '../../themes/themes';
import { GameState, PlayerColor } from '../../engine/types';
import { getBoardCell } from '../../engine/boardData';
import { CELL, BOARD_SIZE } from './boardConstants';

interface PiecesLayerProps {
  game: GameState;
  theme: LudoTheme;
  onPiecePress: (pieceId: string) => void;
  animatingPieceId?: string;
}

// ── Center triangle cluster positions ─────────────────────────────────────────
const CENTER_X = 7.5 * CELL;
const CENTER_Y = 7.5 * CELL;

const FINISHED_OFFSETS: Record<PlayerColor, Array<[number, number]>> = {
  red:    [[-0.38, -0.15], [-0.38,  0.15], [-0.15, -0.15], [-0.15,  0.15]],
  green:  [[-0.15, -0.38], [ 0.15, -0.38], [-0.15, -0.15], [ 0.15, -0.15]],
  yellow: [[ 0.15, -0.15], [ 0.15,  0.15], [ 0.38, -0.15], [ 0.38,  0.15]],
  blue:   [[-0.15,  0.15], [ 0.15,  0.15], [-0.15,  0.38], [ 0.15,  0.38]],
};

const FINISHED_RADIUS = CELL * 0.28;

// ─────────────────────────────────────────────────────────────────────────────

export const PiecesLayer: React.FC<PiecesLayerProps> = ({
  game, theme, onPiecePress, animatingPieceId,
}) => {
  // Pre-compute stacks — finished and home pieces handled separately
  const pieceStacks = useMemo(() => {
    const stacks = new Map<string, Array<{ id: string }>>();
    game.players.forEach(player => {
      player.pieces.forEach(piece => {
        if (piece.position === -1) return;
        if (piece.isFinished) return;
        const cell = getBoardCell(piece.color, piece.position, piece.index);
        const key = `${cell[0]}-${cell[1]}`;
        if (!stacks.has(key)) stacks.set(key, []);
        stacks.get(key)!.push(piece);
      });
    });
    return stacks;
  }, [game]);

  const pieceNodes: React.ReactNode[] = [];

  game.players.forEach(player => {
    player.pieces.forEach(piece => {
      if (piece.id === animatingPieceId) return;

      const fill = getPlayerColor(theme, piece.color);
      const isMovable = game.movablePieceIds.includes(piece.id);

      let cx: number;
      let cy: number;
      let radius: number;

      // ── Finished: center triangle cluster ───────────────────────────────
      if (piece.isFinished) {
        radius = FINISHED_RADIUS;
        const [dx, dy] = FINISHED_OFFSETS[piece.color as PlayerColor]?.[piece.index] ?? [0, 0];
        cx = CENTER_X + dx * CELL;
        cy = CENTER_Y + dy * CELL;

        pieceNodes.push(
          <PieceDot key={piece.id} cx={cx} cy={cy} radius={radius}
            fill={fill} isMovable={false} onPress={() => {}} />
        );
        return;
      }

      // ── Compute position ─────────────────────────────────────────────────
      const cell = getBoardCell(piece.color, piece.position, piece.index);
      cx = cell[1] * CELL + CELL / 2;
      cy = cell[0] * CELL + CELL / 2;
      radius = CELL * 0.38;

      if (piece.position === -1) {
        // Home base — spread around quadrant center
        const homeCol = piece.color === 'red' || piece.color === 'blue' ? 0 : 9;
        const homeRow = piece.color === 'red' || piece.color === 'green' ? 0 : 9;
        const homeCenterX = homeCol * CELL + 3 * CELL;
        const homeCenterY = homeRow * CELL + 3 * CELL;
        cx = homeCenterX + (cx - homeCenterX) * 1.35;
        cy = homeCenterY + (cy - homeCenterY) * 1.35;
      } else {
        // Active track — stacking layout
        const key = `${cell[0]}-${cell[1]}`;
        const stack = pieceStacks.get(key) || [];
        const total = stack.length;
        if (total > 1) {
          const stackIndex = stack.findIndex(p => p.id === piece.id);
          radius = radius * 0.75;
          const offset = CELL * 0.22;
          if (total === 2) {
            cx += stackIndex === 0 ? -offset : offset;
          } else if (total === 3) {
            if (stackIndex === 0) cy -= offset;
            else if (stackIndex === 1) { cx -= offset; cy += offset; }
            else { cx += offset; cy += offset; }
          } else if (total === 4) {
            cx += stackIndex % 2 === 0 ? -offset : offset;
            cy += stackIndex < 2 ? -offset : offset;
          } else {
            const angle = (Math.PI * 2 / total) * stackIndex;
            cx += Math.cos(angle) * offset;
            cy += Math.sin(angle) * offset;
          }
        }
      }

      pieceNodes.push(
        <PieceDot
          key={piece.id}
          cx={cx} cy={cy} radius={radius}
          fill={fill} isMovable={isMovable}
          onPress={() => isMovable && onPiecePress(piece.id)}
        />
      );
    });
  });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {pieceNodes}
    </View>
  );
};

// ─── Single piece — TouchableOpacity + View circle ────────────────────────────

interface PieceDotProps {
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  isMovable: boolean;
  onPress: () => void;
}

const PieceDot: React.FC<PieceDotProps> = ({ cx, cy, radius, fill, isMovable, onPress }) => {
  const hitSize = radius * 2.8; // generous tap area

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isMovable ? 0.6 : 1}
      style={[
        styles.hitArea,
        { left: cx - hitSize / 2, top: cy - hitSize / 2, width: hitSize, height: hitSize },
      ]}
    >
      {/* Glow ring for movable pieces */}
      {isMovable && (
        <View style={[
          styles.glowRing,
          { width: radius * 2 + 10, height: radius * 2 + 10, borderRadius: radius + 5 },
        ]} />
      )}

      {/* Main piece body */}
      <View style={[
        styles.pieceBody,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: fill,
          borderWidth: isMovable ? 2.5 : 1,
          borderColor: isMovable ? '#FFF' : 'rgba(0,0,0,0.2)',
          elevation: isMovable ? 8 : 3,
        },
      ]}>
        {/* Recessed inner ring (bun indent) */}
        <View style={[
          styles.innerRing,
          {
            width: radius,
            height: radius,
            borderRadius: radius / 2,
            top: radius * 0.5,
            left: radius * 0.5,
          },
        ]} />
        {/* Gloss highlight */}
        <View style={[
          styles.gloss,
          {
            width: radius * 0.65,
            height: radius * 0.32,
            borderRadius: radius * 0.2,
            top: radius * 0.12,
            left: radius * 0.22,
          },
        ]} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BOARD_SIZE,
    height: BOARD_SIZE,
  },
  hitArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#FFF',
    opacity: 0.9,
  },
  pieceBody: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  innerRing: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  gloss: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
});
