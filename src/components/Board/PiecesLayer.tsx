import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LudoTheme, getPlayerColor } from '../../themes/themes';
import { GameState, GuttiSkin, PlayerColor } from '../../engine/types';
import { getBoardCell } from '../../engine/boardData';
import { CELL, BOARD_SIZE } from './boardConstants';
import { PIECE_SKINS } from '../Piece/skins';

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
    const skin = player.guttiSkin;

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
            fill={fill} isMovable={false} skin={skin} onPress={() => {}} />
        );
        return;
      }

      // ── Compute position ─────────────────────────────────────────────────
      const cell = getBoardCell(piece.color, piece.position, piece.index);
      cx = cell[1] * CELL + CELL / 2;
      cy = cell[0] * CELL + CELL / 2;
      radius = CELL * 0.38;

      if (piece.position === -1) {
        const homeCol = piece.color === 'red' || piece.color === 'blue' ? 0 : 9;
        const homeRow = piece.color === 'red' || piece.color === 'green' ? 0 : 9;
        const homeCenterX = homeCol * CELL + 3 * CELL;
        const homeCenterY = homeRow * CELL + 3 * CELL;
        cx = homeCenterX + (cx - homeCenterX) * 1.35;
        cy = homeCenterY + (cy - homeCenterY) * 1.35;
      } else {
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
          fill={fill} isMovable={isMovable} skin={skin}
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

// ─── Single piece ─────────────────────────────────────────────────────────────
// Touch + glow ring live here. The visual is pure SkinComponent — no if/else.

interface PieceDotProps {
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  isMovable: boolean;
  skin: GuttiSkin;
  onPress: () => void;
}

const PieceDot: React.FC<PieceDotProps> = ({ cx, cy, radius, fill, isMovable, skin, onPress }) => {
  const hitSize = radius * 2.8;
  // Falls back to BunSkin if an unknown skin key is ever stored in state
  const SkinView = PIECE_SKINS[skin] ?? PIECE_SKINS.round;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isMovable ? 0.6 : 1}
      style={[
        styles.hitArea,
        { left: cx - hitSize / 2, top: cy - hitSize / 2, width: hitSize, height: hitSize },
      ]}
    >
      {isMovable && (
        <View style={[
          styles.glowRing,
          {
            width: radius * 2 + 10,
            height: radius * 2 + 10,
            borderRadius: radius + 5,
            // Centre the ring inside the larger hit area
            top: hitSize / 2 - radius - 5,
            left: hitSize / 2 - radius - 5,
          },
        ]} />
      )}

      {/* Skin component — swap the skin, nothing else changes */}
      <SkinView radius={radius} fill={fill} isMovable={isMovable} />
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
});
