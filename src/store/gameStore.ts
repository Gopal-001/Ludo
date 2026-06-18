import { create } from 'zustand';
import {
  GameState, GameConfig, Player, Piece, PlayerColor,
  DEFAULT_CONFIG, GuttiSkin, PLAYER_COLORS,
} from '../engine/types';
import {
  rollDice, getMovablePieces, applyMove,
  checkWinner, shouldLoseTurnOnSixes,
} from '../engine/ruleEngine';
import { ThemePreset } from '../themes/themes';

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makePieces(color: PlayerColor): Piece[] {
  return [0, 1, 2, 3].map(i => ({
    id: `${color}-${i}`,
    color,
    index: i,
    position: -1,
    isHome: true,
    isFinished: false,
  }));
}

const PLAYER_NAMES: Record<PlayerColor, string> = {
  red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue',
};

function makePlayers(count: number, guttiSkin: GuttiSkin): Player[] {
  return PLAYER_COLORS.slice(0, count).map(color => ({
    id: color,
    name: PLAYER_NAMES[color],
    pieces: makePieces(color),
    guttiSkin,
    isBot: false,
  }));
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface GameStore {
  // ── State ──────────────────────────────────────────────────────────────────
  game: GameState | null;
  config: GameConfig;
  theme: ThemePreset;
  guttiSkin: GuttiSkin;

  // ── Config mutations ───────────────────────────────────────────────────────
  setConfig: (patch: Partial<GameConfig>) => void;
  setTheme: (theme: ThemePreset) => void;
  setGuttiSkin: (skin: GuttiSkin) => void;

  // ── Game lifecycle ─────────────────────────────────────────────────────────
  startGame: () => void;
  resetGame: () => void;

  // ── Gameplay actions ───────────────────────────────────────────────────────
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  config: DEFAULT_CONFIG,
  theme: 'nature',
  guttiSkin: 'round',

  setConfig: (patch) =>
    set(s => ({ config: { ...s.config, ...patch } })),

  setTheme: (theme) => set({ theme }),
  setGuttiSkin: (skin) => set({ guttiSkin: skin }),

  startGame: () => {
    const { config, guttiSkin } = get();
    const game: GameState = {
      players: makePlayers(config.playerCount, guttiSkin),
      currentPlayerIndex: 0,
      diceValue: null,
      lastDiceValue: null,
      consecutiveSixes: 0,
      phase: 'rolling',
      winner: null,
      config,
      movablePieceIds: [],
    };
    set({ game });
  },

  resetGame: () => set({ game: null }),

  rollDice: () => {
    const { game } = get();
    if (!game || game.phase !== 'rolling') return;

    const dice = rollDice();
    const currentPlayer = game.players[game.currentPlayerIndex];

    // Consecutive sixes penalty
    const newConsecutive = dice === 6 ? game.consecutiveSixes + 1 : 0;
    if (shouldLoseTurnOnSixes(newConsecutive, game.config.maxConsecutiveSixes)) {
      // Lose turn, reset
      set({
        game: {
          ...game,
          diceValue: dice,
          consecutiveSixes: 0,
          phase: 'moving', // Lock UI
          movablePieceIds: [],
        },
      });

      setTimeout(() => {
        const current = get().game;
        if (!current) return;
        set({
          game: {
            ...current,
            diceValue: null,
            phase: 'rolling',
            currentPlayerIndex: nextPlayerIndex(current),
          }
        });
      }, 500);
      return;
    }

    const movable = getMovablePieces(currentPlayer, dice, game.players, game.config);

    if (movable.length === 0) {
      // No moves — show dice, lock UI, wait 500ms, then pass turn
      set({
        game: {
          ...game,
          diceValue: dice,
          lastDiceValue: dice,
          consecutiveSixes: newConsecutive,
          phase: 'moving', // Lock UI
          movablePieceIds: [],
        },
      });

      setTimeout(() => {
        const current = get().game;
        if (!current) return;
        set({
          game: {
            ...current,
            diceValue: null,
            phase: 'rolling',
            currentPlayerIndex: dice === 6 && current.config.sixBehavior !== 'open_only'
              ? current.currentPlayerIndex
              : nextPlayerIndex(current),
          }
        });
      }, 500);
      return;
    }

    // Enter moving phase (UI will trigger animation if there is exactly 1 movable piece)
    if (movable.length === 1) {
      const nextGame: GameState = {
        ...game,
        diceValue: dice,
        lastDiceValue: dice,
        consecutiveSixes: newConsecutive,
        phase: 'moving',
        movablePieceIds: movable,
      };
      set({ game: nextGame });
      return;
    }

    set({
      game: {
        ...game,
        diceValue: dice,
        lastDiceValue: dice,
        consecutiveSixes: newConsecutive,
        phase: 'moving',
        movablePieceIds: movable,
      },
    });
  },

  movePiece: (pieceId) => {
    const { game } = get();
    if (!game || game.phase !== 'moving') return;
    if (!game.movablePieceIds.includes(pieceId)) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    const piece = currentPlayer.pieces.find(p => p.id === pieceId);
    if (!piece || game.diceValue === null) return;

    const result = applyMove(piece, game.diceValue, game.players, game.config);

    // Apply move to players
    const updatedPlayers = game.players.map(player => {
      if (player.id === currentPlayer.id) {
        return {
          ...player,
          pieces: player.pieces.map(p => p.id === pieceId ? result.piece : p),
        };
      }
      // Send killed pieces home
      return {
        ...player,
        pieces: player.pieces.map(p =>
          result.killedPieceIds.includes(p.id)
            ? { ...p, position: -1, isHome: true, isFinished: false }
            : p,
        ),
      };
    });

    const winner = checkWinner(updatedPlayers);

    const nextIdx = result.extraTurn
      ? game.currentPlayerIndex
      : nextPlayerIndex({ ...game, players: updatedPlayers });

    // Instantly update board state but lock turn phase
    set({
      game: {
        ...game,
        players: updatedPlayers,
        diceValue: null, // clear dice while piece animates/waits
        consecutiveSixes: result.extraTurn ? game.consecutiveSixes : 0,
        phase: winner ? 'finished' : 'moving', // lock UI
        winner,
        movablePieceIds: [],
      },
    });

    if (!winner) {
      // Wait 0.5s before formally passing turn to next player
      setTimeout(() => {
        const current = get().game;
        if (!current) return;
        set({
          game: {
            ...current,
            currentPlayerIndex: nextIdx,
            phase: 'rolling',
          }
        });
      }, 500);
    }
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextPlayerIndex(game: GameState): number {
  return (game.currentPlayerIndex + 1) % game.players.length;
}
