import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LudoTheme } from '../../themes/themes';
import { GameState } from '../../engine/types';
import { HomeArea } from './HomeArea';
import { TrackCells } from './TrackCells';
import { CenterArea, SafeMarkers } from './BoardDecorations';
import { PiecesLayer } from './PiecesLayer';
import { TrailLayer } from './TrailLayer';
import { BOARD_SIZE } from './boardConstants';
import { AnimPiece, TrailCell } from '../../hooks/usePieceAnimation';
import { RoundBun } from '../Piece/Gutti';

// Re-export BOARD_SIZE for GameScreen
export { BOARD_SIZE };

interface BoardProps {
  theme: LudoTheme;
  game: GameState;
  onPiecePress: (pieceId: string) => void;
  // Animation state (optional)
  animPiece?: AnimPiece | null;
  trailCells?: TrailCell[];
}

export const Board: React.FC<BoardProps> = ({
  theme, game, onPiecePress, animPiece, trailCells,
}) => {
  const activeColor = game.players[game.currentPlayerIndex].id;

  return (
    <View style={[styles.container, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
      <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
        {/* Background */}
        <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill={theme.boardBackground} />

        {/* Home areas — 4 colored quadrants with active pulse */}
        <HomeArea color="red"    row={0} col={0} theme={theme} isActive={activeColor === 'red'} />
        <HomeArea color="green"  row={0} col={9} theme={theme} isActive={activeColor === 'green'} />
        <HomeArea color="yellow" row={9} col={9} theme={theme} isActive={activeColor === 'yellow'} />
        <HomeArea color="blue"   row={9} col={0} theme={theme} isActive={activeColor === 'blue'} />

        {/* Cross-shaped track cells (includes colored home paths) */}
        <TrackCells theme={theme} />

        {/* Center finishing triangle */}
        <CenterArea theme={theme} />

        {/* Fading trail of active piece's path */}
        <TrailLayer cells={trailCells ?? []} />

        {/* Safe cell star markers */}
        <SafeMarkers theme={theme} />

        {/* All pieces — skip the one being animated */}
        <PiecesLayer
          game={game}
          theme={theme}
          onPiecePress={onPiecePress}
          animatingPieceId={animPiece?.id}
        />
      </Svg>

      {/* Animated piece overlay — rendered as Animated.View on top of SVG */}
      {animPiece && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.animPieceOverlay,
            {
              width: animPiece.radius * 2 + 12,
              height: animPiece.radius * 2 + 12,
              transform: [
                { translateX: Animated.add(animPiece.cx, -(animPiece.radius + 6)) },
                { translateY: Animated.add(animPiece.cy, -(animPiece.radius + 6)) },
              ],
            },
          ]}
        >
          <Svg width={animPiece.radius * 2 + 12} height={animPiece.radius * 2 + 12}>
            <RoundBun
              cx={animPiece.radius + 6}
              cy={animPiece.radius + 6}
              r={animPiece.radius}
              fill={animPiece.fill}
              isMovable={false}
              onPress={() => {}}
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  animPieceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
