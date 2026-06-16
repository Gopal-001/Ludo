import React, { useMemo } from 'react';
import { G } from 'react-native-svg';
import { LudoTheme } from '../../themes/themes';
import { GameState, PlayerColor } from '../../engine/types';
import { getBoardCell } from '../../engine/boardData';
import { Gutti } from '../Piece/Gutti';
import { CELL } from './boardConstants';

interface PiecesLayerProps {
  game: GameState;
  theme: LudoTheme;
  onPiecePress: (pieceId: string) => void;
  animatingPieceId?: string;
}

// ── Center triangle cluster positions ─────────────────────────────────────────
// The board center is at pixel (7.5*CELL, 7.5*CELL).
// Each color gets a 2×2 cluster of 4 slots inside its triangle quadrant.
// Offsets are in CELL units, relative to the board center.
const CENTER_X = 7.5 * CELL;
const CENTER_Y = 7.5 * CELL;

const FINISHED_OFFSETS: Record<PlayerColor, Array<[number, number]>> = {
  //            piece 0              piece 1              piece 2              piece 3
  red:    [[-0.38, -0.15], [-0.38,  0.15], [-0.15, -0.15], [-0.15,  0.15]],
  green:  [[-0.15, -0.38], [ 0.15, -0.38], [-0.15, -0.15], [ 0.15, -0.15]],
  yellow: [[ 0.15, -0.15], [ 0.15,  0.15], [ 0.38, -0.15], [ 0.38,  0.15]],
  blue:   [[-0.15,  0.15], [ 0.15,  0.15], [-0.15,  0.38], [ 0.15,  0.38]],
};

const FINISHED_RADIUS = CELL * 0.28; // smaller than active pieces (0.38)

// ─────────────────────────────────────────────────────────────────────────────

export const PiecesLayer: React.FC<PiecesLayerProps> = ({
  game, theme, onPiecePress, animatingPieceId,
}) => {
  // Pre-compute stacks — finished pieces live in the center, not on the track
  const pieceStacks = useMemo(() => {
    const stacks = new Map<string, Array<{ id: string }>>();
    game.players.forEach(player => {
      player.pieces.forEach(piece => {
        if (piece.position === -1) return; // home base — handled separately
        if (piece.isFinished) return;      // center cluster — handled separately
        const cell = getBoardCell(piece.color, piece.position, piece.index);
        const key = `${cell[0]}-${cell[1]}`;
        if (!stacks.has(key)) stacks.set(key, []);
        stacks.get(key)!.push(piece);
      });
    });
    return stacks;
  }, [game]);

  return (
    <G>
      {game.players.map(player =>
        player.pieces.map(piece => {
          // ── Skip piece being animated ──────────────────────────────────────
          if (piece.id === animatingPieceId) return null;

          // ── Finished: render inside center triangle cluster ────────────────
          if (piece.isFinished) {
            const [dx, dy] = FINISHED_OFFSETS[piece.color as PlayerColor]?.[piece.index] ?? [0, 0];
            return (
              <Gutti
                key={piece.id}
                piece={piece}
                cx={CENTER_X + dx * CELL}
                cy={CENTER_Y + dy * CELL}
                radius={FINISHED_RADIUS}
                theme={theme}
                skin={player.guttiSkin}
                isMovable={false}
                onPress={() => {}}
              />
            );
          }

          // ── Home base: spread pieces within the colored quadrant ───────────
          const cell = getBoardCell(piece.color, piece.position, piece.index);
          let cx = cell[1] * CELL + CELL / 2;
          let cy = cell[0] * CELL + CELL / 2;
          let radius = CELL * 0.38;

          if (piece.position === -1) {
            const homeCol = piece.color === 'red' || piece.color === 'blue' ? 0 : 9;
            const homeRow = piece.color === 'red' || piece.color === 'green' ? 0 : 9;
            const homeCenterX = homeCol * CELL + 3 * CELL;
            const homeCenterY = homeRow * CELL + 3 * CELL;
            cx = homeCenterX + (cx - homeCenterX) * 1.35;
            cy = homeCenterY + (cy - homeCenterY) * 1.35;
          } else {
            // ── Active track: stacking layout ─────────────────────────────
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

          const isMovable = game.movablePieceIds.includes(piece.id);
          return (
            <Gutti
              key={piece.id}
              piece={piece}
              cx={cx}
              cy={cy}
              radius={radius}
              theme={theme}
              skin={player.guttiSkin}
              isMovable={isMovable}
              onPress={() => isMovable && onPiecePress(piece.id)}
            />
          );
        })
      )}
    </G>
  );
};
