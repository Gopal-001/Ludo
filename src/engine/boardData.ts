import { PlayerColor } from './types';

/**
 * Classic Ludo board: 15x15 grid.
 * Each color has a 56-step path on the board + 6 home stretch steps.
 * We model the path as an ordered array of [row, col] coordinates.
 *
 * Position encoding:
 *   -1           = still in home base (not yet opened)
 *    0 .. 50     = main track (51 cells, shared, but entry offsets differ per color)
 *   51 .. 55     = color's home stretch (5 cells)
 *   56           = FINISHED
 *
 * Each color's path[i] gives the board [row,col] for position i.
 */

export type Cell = [number, number]; // [row, col]

// The 52-cell outer track starting from Red's entry at position 0
// Red enters at (6,1) and goes clockwise.
// Positions 0-51 = shared main track
const MAIN_TRACK: Cell[] = [
  // Red side (bottom of left column going up)
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],
  [0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],
  [6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],
  [14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],
  [8,0],[7,0],[6,0],
];

// Safe positions on the main track (0-indexed in MAIN_TRACK)
// These are the classic star positions
export const SAFE_MAIN_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home stretch paths (positions 51-55) per color
const HOME_STRETCHES: Record<PlayerColor, Cell[]> = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// Track entry offset: which index in MAIN_TRACK is position 0 for each color
const ENTRY_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Home base cells (the 4 starting squares per color)
export const HOME_BASE_CELLS: Record<PlayerColor, Cell[]> = {
  red:    [[2,2],[3,2],[2,3],[3,3]],
  green:  [[2,11],[3,11],[2,12],[3,12]],
  yellow: [[11,11],[12,11],[11,12],[12,12]],
  blue:   [[11,2],[12,2],[11,3],[12,3]],
};

// Final center cell
export const CENTER_CELL: Cell = [7,7];

/**
 * Get the board [row,col] for a piece at given position for given color.
 * position -1 = home base (returns a base cell based on piece index).
 * position 57 = center/finished.
 */
export function getBoardCell(color: PlayerColor, position: number, pieceIndex: number): Cell {
  if (position === -1) {
    return HOME_BASE_CELLS[color][pieceIndex];
  }
  if (position === 56) {
    switch (color) {
      case 'red': return [7, 6];
      case 'green': return [6, 7];
      case 'yellow': return [7, 8];
      case 'blue': return [8, 7];
    }
  }
  if (position >= 51) {
    return HOME_STRETCHES[color][position - 51];
  }
  const offset = ENTRY_OFFSET[color];
  const mainIndex = (offset + position) % 52;
  return MAIN_TRACK[mainIndex];
}

/**
 * Returns true if the given position on the main track is a safe cell for color.
 */
export function isSafePosition(color: PlayerColor, position: number, extraSafe: number[]): boolean {
  if (position < 0 || position >= 51) return false;
  const offset = ENTRY_OFFSET[color];
  const mainIndex = (offset + position) % 52;
  return SAFE_MAIN_POSITIONS.has(mainIndex) || extraSafe.includes(position);
}

/**
 * Compute new position after rolling dice.
 *
 * Home stretch: positions 51–55.  Finish cell: 56.
 *
 * exactFinish = true  → must land EXACTLY on 56; overshoot → null (can't move).
 * exactFinish = false → overshoot still wins (returns 56).
 *
 * Returning null causes getMovablePieces to skip this piece.  If all pieces
 * return null, movable.length === 0 and the store passes the turn automatically.
 */
export function computeNewPosition(
  current: number,
  dice: number,
  exactFinish: boolean,
): number | null {
  if (current === -1) {
    return null; // not opened yet — handled by the rule engine
  }

  const next = current + dice;

  if (next > 56) {
    // Overshoot: blocked when exact finish is required; wins otherwise.
    return exactFinish ? null : 56;
  }

  if (next === 56) return 56; // exact finish — piece wins

  return next; // normal advance (main track or inside home stretch)
}

export { MAIN_TRACK, HOME_STRETCHES, ENTRY_OFFSET };
