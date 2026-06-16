import { GameConfig, GameState, Piece, Player, MoveResult, PlayerColor } from './types';
import { computeNewPosition, isSafePosition } from './boardData';

// ─── Dice ─────────────────────────────────────────────────────────────────────

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// ─── Which pieces can move this turn? ────────────────────────────────────────

export function getMovablePieces(
  player: Player,
  dice: number,
  allPlayers: Player[],
  config: GameConfig,
): string[] {
  const movable: string[] = [];

  for (const piece of player.pieces) {
    if (piece.isFinished) continue;

    // Piece is in home base — needs 6 (or 1 if configured) to come out
    if (piece.isHome) {
      if (dice === 6 || (config.oneBehavior !== 'off' && dice === 1)) movable.push(piece.id);
      continue;
    }

    // Piece is on board — check if move is valid
    const newPos = computeNewPosition(piece.position, dice, config.exactFinish);
    if (newPos === null) continue;

    // Check if target cell is blocked by own stacked pieces (if stacking blocks)
    // (We allow landing on own pieces unless maxStack logic is needed)
    movable.push(piece.id);
  }

  return movable;
}

// ─── Execute a move ──────────────────────────────────────────────────────────

export function applyMove(
  piece: Piece,
  dice: number,
  players: Player[],
  config: GameConfig,
): MoveResult {
  const killedPieceIds: string[] = [];
  let newPosition: number;

  // Opening a piece from home base (6 always opens; 1 opens if configured)
  if (piece.isHome && (dice === 6 || (config.oneBehavior !== 'off' && dice === 1))) {
    newPosition = 0;
  } else {
    const next = computeNewPosition(piece.position, dice, config.exactFinish);
    if (next === null) throw new Error('Invalid move attempted');
    newPosition = next;
  }

  const finished = newPosition === 56;

  // Kill logic: only on main track (positions 0-50), not safe cells, not home stretch
  if (config.killEnabled && !finished && newPosition < 51) {
    const isLandingSafe = isSafePosition(piece.color, newPosition, config.extraSafePositions);

    if (!isLandingSafe) {
      for (const opponent of players) {
        if (opponent.id === piece.color) continue;

        for (const op of opponent.pieces) {
          if (op.isHome || op.isFinished) continue;
          // Home-stretch pieces (positions 51–56) are never on the main track.
          // getAbsoluteMainIndex wraps their positions via % 52, producing false
          // collisions with main-track cells — so we must skip them here.
          if (op.position > 50) continue;

          // Check if opponent is on the same cell
          const opCell = getAbsoluteMainIndex(opponent.id as PlayerColor, op.position);
          const myCell  = getAbsoluteMainIndex(piece.color, newPosition);

          if (opCell === myCell) {
            // Check if opponent has a protective stack (same color, same cell)
            if (config.stackingEnabled && config.stackIsInvincible) {
              const stackCount = opponent.pieces.filter(
                p => !p.isHome && !p.isFinished && getAbsoluteMainIndex(opponent.id as PlayerColor, p.position) === opCell,
              ).length;
              if (stackCount >= 2) continue; // stack is safe
            }
            killedPieceIds.push(op.id);
          }
        }
      }
    }
  }

  // Extra turn: gets another roll if dice === 6 (based on config) OR killed a piece
  let extraTurn = false;
  switch (config.sixBehavior) {
    case 'open_and_turn':
      extraTurn = dice === 6;
      break;
    case 'extra_turn':
      extraTurn = dice === 6;
      break;
    case 'open_only':
      extraTurn = false;
      break;
  }
  // Rolling a 1 with open_and_turn always grants an extra turn
  if (dice === 1 && config.oneBehavior === 'open_and_turn') extraTurn = true;
  // Always get extra turn for killing or finishing
  if (killedPieceIds.length > 0 || finished) extraTurn = true;

  return {
    piece: { ...piece, position: newPosition, isHome: false, isFinished: finished },
    killedPieceIds,
    finished,
    extraTurn,
  };
}

// Helper: convert color-relative position to absolute main track index
function getAbsoluteMainIndex(color: PlayerColor, position: number): number {
  const ENTRY_OFFSETS: Record<PlayerColor, number> = {
    red: 0, green: 13, yellow: 26, blue: 39,
  };
  return (ENTRY_OFFSETS[color] + position) % 52;
}

// ─── Check for winner ─────────────────────────────────────────────────────────

export function checkWinner(players: Player[]): PlayerColor | null {
  for (const p of players) {
    if (p.pieces.every(pc => pc.isFinished)) return p.id;
  }
  return null;
}

// ─── Consecutive six penalty ──────────────────────────────────────────────────

export function shouldLoseTurnOnSixes(consecutiveSixes: number, max: number): boolean {
  if (max === 0) return false;
  return consecutiveSixes >= max;
}
