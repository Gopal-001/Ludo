import { useRef, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import { PlayerColor } from '../engine/types';
import { getBoardCell, HOME_BASE_CELLS } from '../engine/boardData';
import { CELL } from '../components/Board/boardConstants';

export interface TrailCell {
  key: string;
  row: number;
  col: number;
  colorHex: string;
  opacity: Animated.Value;
}

export interface AnimPiece {
  id: string;
  color: PlayerColor;
  fill: string;
  radius: number;
  cx: Animated.Value; // absolute pixel position on board
  cy: Animated.Value;
}

export interface PathStep {
  row: number;
  col: number;
  cx: number; // pixel center x on board
  cy: number; // pixel center y on board
}

const FORWARD_STEP_MS = 250; // ms per cell hop (forward move)
const KILL_STEP_MS    = 55;  // ms per cell hop (kill return — faster)
const TRAIL_FADE_MS   = 500; // ms for trail glow to fade out

export function usePieceAnimation() {
  // Shared animated values reused for every animation (forward + kill)
  const animCx = useRef(new Animated.Value(0)).current;
  const animCy = useRef(new Animated.Value(0)).current;

  const isAnimatingRef  = useRef(false);
  const trailClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAnimatingState, setIsAnimatingState] = useState(false);
  const [animPiece, setAnimPiece]   = useState<AnimPiece | null>(null);
  const [trailCells, setTrailCells] = useState<TrailCell[]>([]);

  // Cancel any pending trail-clear so a chained kill animation
  // can set its own trail without it being wiped prematurely.
  const cancelTrailClear = () => {
    if (trailClearTimer.current !== null) {
      clearTimeout(trailClearTimer.current);
      trailClearTimer.current = null;
    }
  };

  // ─── Core runner (shared by forward + kill) ──────────────────────────────

  const runAnimation = useCallback((
    pieceId:   string,
    pieceColor: PlayerColor,
    fill:      string,
    radius:    number,
    startCx:   number,
    startCy:   number,
    path:      PathStep[],
    stepMs:    number,
    onStep?:   () => void,
    onDone?:   () => void,
  ) => {
    cancelTrailClear();

    if (path.length === 0) { onDone?.(); return; }

    isAnimatingRef.current = true;
    setIsAnimatingState(true);

    animCx.setValue(startCx);
    animCy.setValue(startCy);

    setAnimPiece({ id: pieceId, color: pieceColor, fill, radius, cx: animCx, cy: animCy });

    // Pre-build trail cells — each gets its own Animated.Value so they
    // fade independently as the piece passes through them.
    const trailOpacities = path.map(() => new Animated.Value(0));
    setTrailCells(
      path.map((step, i) => ({
        key: `trail-${pieceId}-${i}-${Date.now()}`,
        row: step.row,
        col: step.col,
        colorHex: fill,
        opacity: trailOpacities[i],
      })),
    );

    // Hop animations: one parallel x+y timing per step
    const hopAnims = path.map(step =>
      Animated.parallel([
        Animated.timing(animCx, { toValue: step.cx, duration: stepMs, useNativeDriver: false }),
        Animated.timing(animCy, { toValue: step.cy, duration: stepMs, useNativeDriver: false }),
      ]),
    );

    // Staggered trail fade: cell i's glow appears when the piece reaches/leaves it
    trailOpacities.forEach((opAnim, i) => {
      setTimeout(() => {
        opAnim.setValue(0.55);
        Animated.timing(opAnim, { toValue: 0, duration: TRAIL_FADE_MS, useNativeDriver: false }).start();
      }, (i + 1) * stepMs);
    });

    // Staggered sound effect: plays exactly at the start of each hop
    path.forEach((_, i) => {
      setTimeout(() => {
        onStep?.();
      }, i * stepMs);
    });

    Animated.sequence(hopAnims).start(() => {
      isAnimatingRef.current = false;
      setIsAnimatingState(false);
      setAnimPiece(null);
      // Schedule trail clear AFTER glow fades — cancelTrailClear() can abort
      // this if a kill animation chains immediately after.
      trailClearTimer.current = setTimeout(() => setTrailCells([]), TRAIL_FADE_MS);
      onDone?.();
    });
  }, [animCx, animCy]);

  // ─── Public API ──────────────────────────────────────────────────────────

  /** Animate a piece moving FORWARD along its path. onDone fires when finished. */
  const startAnimation = useCallback((
    pieceId:    string,
    pieceColor: PlayerColor,
    fill:       string,
    radius:     number,
    startCx:    number,
    startCy:    number,
    path:       PathStep[],
    onStep:     () => void,
    onDone:     () => void,
  ) => {
    if (isAnimatingRef.current) return;
    runAnimation(pieceId, pieceColor, fill, radius, startCx, startCy, path, FORWARD_STEP_MS, onStep, onDone);
  }, [runAnimation]);

  /**
   * Animate a killed piece sliding BACK to its home base.
   * Call this right after move() has been applied to the store —
   * the piece is already at home in state; we overlay the return trip.
   *
   * @param fromPosition  The board position (0–50) the piece was at when killed.
   * @param pieceIndex    Which piece slot (0–3) — determines which home-base cell.
   */
  const startKillAnimation = useCallback((
    killedPieceId: string,
    killedColor:   PlayerColor,
    fill:          string,
    radius:        number,
    fromPosition:  number,
    pieceIndex:    number,
  ) => {
    if (fromPosition < 0) return; // safety guard

    // Build the reverse path: fromPos-1, fromPos-2, …, 0, home-base-cell
    const path: PathStep[] = [];
    for (let p = fromPosition - 1; p >= 0; p--) {
      const [row, col] = getBoardCell(killedColor, p, pieceIndex);
      path.push({ row, col, cx: col * CELL + CELL / 2, cy: row * CELL + CELL / 2 });
    }
    const [hRow, hCol] = HOME_BASE_CELLS[killedColor][pieceIndex];
    path.push({ row: hRow, col: hCol, cx: hCol * CELL + CELL / 2, cy: hRow * CELL + CELL / 2 });

    const [sRow, sCol] = getBoardCell(killedColor, fromPosition, pieceIndex);

    // runAnimation directly — no isAnimating guard because this always
    // chains right after a forward animation that just cleared the flag.
    runAnimation(
      killedPieceId, killedColor, fill, radius,
      sCol * CELL + CELL / 2,
      sRow * CELL + CELL / 2,
      path,
      KILL_STEP_MS,
    );
  }, [runAnimation]);

  return {
    get isAnimating() { return isAnimatingRef.current || isAnimatingState; },
    animPiece,
    trailCells,
    startAnimation,
    startKillAnimation,
  };
}
