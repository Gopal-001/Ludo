// ─── Player Colors ────────────────────────────────────────────────────────────
export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// ─── Gutti (piece) visual skin ───────────────────────────────────────────────
export type GuttiSkin = 'round' | 'star';

// ─── A single piece on the board ─────────────────────────────────────────────
export interface Piece {
  id: string;           // e.g. "red-0"
  color: PlayerColor;
  index: number;        // 0–3
  position: number;     // -1 = home base, 0–56 = on board path, 57 = finished
  isHome: boolean;      // still in starting home area
  isFinished: boolean;
}

// ─── A player ────────────────────────────────────────────────────────────────
export interface Player {
  id: PlayerColor;
  name: string;
  pieces: Piece[];
  guttiSkin: GuttiSkin;
  isBot: boolean;
}

// ─── Configurable rules ───────────────────────────────────────────────────────
export type SixBehavior =
  | 'open_only'      // 6 only opens a gutti (no extra turn)
  | 'extra_turn'     // 6 = extra turn, separate throw needed to open
  | 'open_and_turn'; // 6 = opens gutti AND grants extra turn (classic)

export type OneBehavior =
  | 'off'            // 1 has no special power
  | 'open_only'      // 1 opens a gutti, no extra turn
  | 'open_and_turn'; // 1 opens a gutti AND grants an extra turn

export interface GameConfig {
  /** What rolling a 6 does */
  sixBehavior: SixBehavior;

  /** If true, pieces of same color can stack on a cell and the stack blocks opponents */
  stackingEnabled: boolean;

  /** If true, a stack of 2+ same-color pieces is safe and cannot be killed */
  stackIsInvincible: boolean;

  /** If true, landing on opponent sends them home; false = peaceful */
  killEnabled: boolean;

  /** How many consecutive 6s triggers a penalty (0 = no limit) */
  maxConsecutiveSixes: number;

  /** If true, you must land exactly on cell 57 to finish; overshooting is invalid */
  exactFinish: boolean;

  /** Extra safe zones beyond the default stars (absolute path positions 0-56) */
  extraSafePositions: number[];

  /** What rolling a 1 does */
  oneBehavior: OneBehavior;

  /** Number of active players (2-4) */
  playerCount: 2 | 3 | 4;
}

export const DEFAULT_CONFIG: GameConfig = {
  sixBehavior: 'open_and_turn',
  stackingEnabled: true,
  stackIsInvincible: true,
  killEnabled: true,
  maxConsecutiveSixes: 3,
  exactFinish: true,
  extraSafePositions: [],
  oneBehavior: 'off',
  playerCount: 4,
};

// ─── Game phase ───────────────────────────────────────────────────────────────
export type GamePhase = 'rolling' | 'moving' | 'finished';

// ─── Full game state ──────────────────────────────────────────────────────────
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  consecutiveSixes: number;
  phase: GamePhase;
  winner: PlayerColor | null;
  config: GameConfig;
  movablePieceIds: string[]; // pieces that can legally move this turn
}

// ─── Move result ──────────────────────────────────────────────────────────────
export interface MoveResult {
  piece: Piece;
  killedPieceIds: string[];
  finished: boolean;
  extraTurn: boolean;
}
