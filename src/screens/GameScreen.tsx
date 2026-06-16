import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Modal,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getTheme, getPlayerColor } from '../themes/themes';
import { Board, BOARD_SIZE } from '../components/Board/Board';
import { CELL } from '../components/Board/boardConstants';
import { Dice } from '../components/Dice/Dice';
import { PlayerColor } from '../engine/types';
import { getBoardCell } from '../engine/boardData';
import { applyMove } from '../engine/ruleEngine';
import { usePieceAnimation, PathStep } from '../hooks/usePieceAnimation';
import { useSounds } from '../hooks/useSounds';

interface GameScreenProps {
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
  const game = useGameStore(s => s.game);
  const themePreset = useGameStore(s => s.theme);
  const roll = useGameStore(s => s.rollDice);
  const move = useGameStore(s => s.movePiece);
  const resetGame = useGameStore(s => s.resetGame);
  const theme = getTheme(themePreset);

  const [rolling, setRolling] = useState(false);
  const [lastAutoMove, setLastAutoMove] = useState('');

  if (!game) return null;

  const currentPlayer = game.players[game.currentPlayerIndex];
  const playerColor = getPlayerColor(theme, currentPlayer.id);
  const isDark = themePreset === 'dark' || themePreset === 'neon';
  const needsToPickPiece = game.phase === 'moving' && game.movablePieceIds.length > 1;

  const { isAnimating, animPiece, trailCells, startAnimation, startKillAnimation } = usePieceAnimation();
  const { playDice, playMove, playHit, playWin } = useSounds();

  const handleRoll = () => {
    if (rolling || isAnimating || game.phase !== 'rolling') return;
    setRolling(true);
    playDice(); // 🎲 dice rattle starts immediately with the animation
    // Match the 900ms grow-spin-shrink animation before committing the roll result
    setTimeout(() => {
      setRolling(false);
      roll();
    }, 900);
  };

  const handlePiecePress = useCallback((pieceId: string) => {
    if (game.phase !== 'moving' || !game.movablePieceIds.includes(pieceId)) return;
    if (isAnimating) return;

    const piece = currentPlayer.pieces.find(p => p.id === pieceId);
    if (!piece || game.diceValue === null) return;

    // Calculate path
    const path: PathStep[] = [];
    let startCx, startCy;
    const startCell = getBoardCell(piece.color, piece.position, piece.index);
    startCx = startCell[1] * CELL + CELL / 2;
    startCy = startCell[0] * CELL + CELL / 2;

    if (piece.position === -1) {
      // Piece is at home, compute its spread position
      const homeCol = piece.color === 'red' || piece.color === 'blue' ? 0 : 9;
      const homeRow = piece.color === 'red' || piece.color === 'green' ? 0 : 9;
      const homeCenterX = homeCol * CELL + 3 * CELL;
      const homeCenterY = homeRow * CELL + 3 * CELL;
      startCx = homeCenterX + (startCx - homeCenterX) * 1.35;
      startCy = homeCenterY + (startCy - homeCenterY) * 1.35;

      // Hop straight to opening cell 0
      const destCell = getBoardCell(piece.color, 0, piece.index);
      path.push({
        row: destCell[0], col: destCell[1],
        cx: destCell[1] * CELL + CELL / 2,
        cy: destCell[0] * CELL + CELL / 2,
      });
    } else {
      // Piece is on the track, hop cell by cell
      for (let i = 1; i <= game.diceValue; i++) {
        const nextPos = piece.position + i;
        if (nextPos > 56) break;
        const stepCell = getBoardCell(piece.color, nextPos, piece.index);
        path.push({
          row: stepCell[0], col: stepCell[1],
          cx: stepCell[1] * CELL + CELL / 2,
          cy: stepCell[0] * CELL + CELL / 2,
        });
      }
    }

    // Capture game snapshot NOW (before move) so onDone can find killed positions
    const snapshotGame  = game;
    const snapshotPiece = piece;

    startAnimation(
      piece.id,
      piece.color,
      getPlayerColor(theme, piece.color),
      CELL * 0.38,
      startCx,
      startCy,
      path,
      playMove,
      () => {
        // Dry-run applyMove to discover kills BEFORE changing store state
        const result = snapshotGame.diceValue !== null
          ? applyMove(snapshotPiece, snapshotGame.diceValue, snapshotGame.players, snapshotGame.config)
          : null;

        // Apply move to store (attacker advances, killed pieces go home in state)
        move(pieceId);

        if (result) {
          if (result.killedPieceIds.length > 0) {
            playHit(); // 🔊 a piece was knocked out

            const killedId = result.killedPieceIds[0];
            for (const pl of snapshotGame.players) {
              const kp = pl.pieces.find(p => p.id === killedId);
              if (kp && !kp.isHome && kp.position >= 0) {
                startKillAnimation(
                  kp.id,
                  kp.color as PlayerColor,
                  getPlayerColor(theme, kp.color as PlayerColor),
                  CELL * 0.38,
                  kp.position,
                  kp.index,
                );
                break; // animate one kill at a time
              }
            }
          }

          if (result.finished) {
            playWin(); // 🔊 piece reached home
          }
        }
      },
    );
  }, [game.phase, game.movablePieceIds, game.diceValue, isAnimating, currentPlayer.pieces, theme, move, startAnimation, startKillAnimation, playMove, playHit, playWin, game]);

  // Auto-move single piece via animation
  useEffect(() => {
    if (game.phase === 'moving' && game.movablePieceIds.length === 1 && !isAnimating) {
      const pieceId = game.movablePieceIds[0];
      // Create a unique key for this exact turn state
      const moveKey = `${game.currentPlayerIndex}-${game.diceValue}-${pieceId}`;
      if (lastAutoMove !== moveKey) {
        setLastAutoMove(moveKey);
        handlePiecePress(pieceId);
      }
    } else if (game.phase === 'rolling' && lastAutoMove !== '') {
      // Reset tracker when it's back to rolling
      setLastAutoMove('');
    }
  }, [game.phase, game.movablePieceIds, isAnimating, handlePiecePress, lastAutoMove, game.currentPlayerIndex, game.diceValue]);

  const handleExit = () => {
    resetGame();
    onExit();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
          <Text style={[styles.exitText, { color: theme.accent }]}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>LUDO</Text>
        <View style={styles.exitBtn} />
      </View>

      {/* Player turn banner & Hints */}
      <View style={[styles.turnBanner, { backgroundColor: playerColor + '22', borderColor: playerColor }]}>
        <View style={[styles.colorDot, { backgroundColor: playerColor }]} />
        <Text style={[styles.turnText, { color: theme.text }]}>
          {currentPlayer.name}'s Turn
        </Text>
        {needsToPickPiece ? (
          <Text style={[styles.hintBadge, { color: theme.accent }]}>👆 Tap piece</Text>
        ) : game.phase === 'rolling' && !rolling ? (
          <Text style={[styles.hintBadge, { color: theme.textSecondary }]}>🎲 Tap to roll</Text>
        ) : game.diceValue === 6 ? (
          <Text style={[styles.sixBadge, { color: theme.accent }]}>🎉 SIX!</Text>
        ) : null}
      </View>

      {/* Board & Player-Side Dice */}
      <View style={styles.boardContainer}>
        {/* Top Dice Row (Red & Green) */}
        <View style={[styles.diceRow, { width: BOARD_SIZE }]}>
          <View style={styles.diceSlot}>
            {currentPlayer.id === 'red' && (
              <Dice value={game.diceValue} rolling={rolling} disabled={game.phase !== 'rolling' || rolling || game.winner !== null} theme={theme} onRoll={handleRoll} />
            )}
          </View>
          <View style={styles.diceSlot}>
            {currentPlayer.id === 'green' && (
              <Dice value={game.diceValue} rolling={rolling} disabled={game.phase !== 'rolling' || rolling || game.winner !== null} theme={theme} onRoll={handleRoll} />
            )}
          </View>
        </View>

        <Board
          theme={theme}
          game={game}
          onPiecePress={handlePiecePress}
          animPiece={animPiece}
          trailCells={trailCells}
        />

        {/* Bottom Dice Row (Blue & Yellow) */}
        <View style={[styles.diceRow, { width: BOARD_SIZE }]}>
          <View style={styles.diceSlot}>
            {currentPlayer.id === 'blue' && (
              <Dice value={game.diceValue} rolling={rolling} disabled={game.phase !== 'rolling' || rolling || game.winner !== null} theme={theme} onRoll={handleRoll} />
            )}
          </View>
          <View style={styles.diceSlot}>
            {currentPlayer.id === 'yellow' && (
              <Dice value={game.diceValue} rolling={rolling} disabled={game.phase !== 'rolling' || rolling || game.winner !== null} theme={theme} onRoll={handleRoll} />
            )}
          </View>
        </View>
      </View>

      {/* Controls: player scores */}
      <View style={[styles.controls, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <PlayerScores game={game} theme={theme} currentIdx={game.currentPlayerIndex} />
      </View>

      {/* Winner modal */}
      {game.winner && (
        <WinnerModal
          winner={game.winner}
          theme={theme}
          themePreset={themePreset}
          onRestart={() => {
            resetGame();
            onExit();
          }}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Player Scores ────────────────────────────────────────────────────────────

const PlayerScores = ({ game, theme, currentIdx }: { game: any; theme: any; currentIdx: number }) => (
  <View style={styles.scores}>
    {game.players.map((player: any, i: number) => {
      const pc = getPlayerColor(theme, player.id);
      const finished = player.pieces.filter((p: any) => p.isFinished).length;
      const active = i === currentIdx;
      return (
        <View
          key={player.id}
          style={[
            styles.scoreItem,
            active && { borderColor: pc, borderWidth: 2 },
            { backgroundColor: pc + '22' },
          ]}
        >
          <View style={[styles.scoreColorDot, { backgroundColor: pc }]} />
          <Text style={[styles.scoreText, { color: theme.text }]}>{finished}/4</Text>
        </View>
      );
    })}
  </View>
);

// ─── Winner Modal ─────────────────────────────────────────────────────────────

const WinnerModal = ({ winner, theme, themePreset, onRestart }: {
  winner: PlayerColor; theme: any; themePreset: string; onRestart: () => void;
}) => {
  const winColor = getPlayerColor(theme, winner);
  return (
    <Modal transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: winColor }]}>
          <Text style={styles.winEmoji}>🏆</Text>
          <Text style={[styles.winTitle, { color: winColor }]}>
            {winner.toUpperCase()} WINS!
          </Text>
          <Text style={[styles.winSub, { color: theme.textSecondary }]}>
            Congratulations!
          </Text>
          <TouchableOpacity
            style={[styles.restartBtn, { backgroundColor: winColor }]}
            onPress={onRestart}
          >
            <Text style={styles.restartText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  exitBtn: { width: 64 },
  exitText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 4 },

  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    gap: 8,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  turnText: { fontSize: 15, fontWeight: '700', flex: 1 },
  sixBadge: { fontSize: 14, fontWeight: '800' },
  hintBadge: { fontSize: 14, fontWeight: '700' },

  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 16,
  },

  diceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  diceSlot: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },

  scores: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  scoreColorDot: { width: 10, height: 10, borderRadius: 5 },
  scoreText: { fontSize: 13, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    minWidth: 260,
  },
  winEmoji: { fontSize: 60, marginBottom: 8 },
  winTitle: { fontSize: 30, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  winSub: { fontSize: 15, marginBottom: 24 },
  restartBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  restartText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
