import React, { useMemo } from 'react';
import { G, Rect } from 'react-native-svg';
import { LudoTheme, getPlayerColor, getHomeColor } from '../../themes/themes';
import { PlayerColor } from '../../engine/types';
import { MAIN_TRACK, ENTRY_OFFSET } from '../../engine/boardData';
import { CELL } from './boardConstants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrackCells(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const inHomeArea =
        (r < 6 && c < 6) || (r < 6 && c > 8) ||
        (r > 8 && c < 6) || (r > 8 && c > 8) ||
        (r >= 6 && r <= 8 && c >= 6 && c <= 8); // center 3x3
      if (!inHomeArea) cells.push([r, c]);
    }
  }
  return cells;
}

// Colored home-path cells per color (home stretch + entry)
const COLORED_CELLS: Array<{ cells: Array<[number, number]>; color: PlayerColor }> = [
  { color: 'red',    cells: [[7,1],[7,2],[7,3],[7,4],[7,5]] },
  { color: 'green',  cells: [[1,7],[2,7],[3,7],[4,7],[5,7]] },
  { color: 'yellow', cells: [[7,13],[7,12],[7,11],[7,10],[7,9]] },
  { color: 'blue',   cells: [[13,7],[12,7],[11,7],[10,7],[9,7]] },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TrackCellsProps {
  theme: LudoTheme;
}

export const TrackCells: React.FC<TrackCellsProps> = ({ theme }) => {
  const trackCells = useMemo(() => getTrackCells(), []);

  const colorMap = useMemo(() => {
    const m = new Map<string, PlayerColor>();
    for (const { cells, color } of COLORED_CELLS) {
      for (const [r, c] of cells) m.set(`${r}-${c}`, color);
    }
    return m;
  }, []);

  // Entry cells also get colored
  const entrySet = useMemo(() => {
    const s = new Map<string, PlayerColor>();
    for (const color of ['red', 'green', 'yellow', 'blue'] as PlayerColor[]) {
      const [er, ec] = MAIN_TRACK[ENTRY_OFFSET[color]];
      s.set(`${er}-${ec}`, color);
    }
    return s;
  }, []);

  return (
    <G>
      {trackCells.map(([r, c]) => {
        const colorKey = colorMap.get(`${r}-${c}`) ?? entrySet.get(`${r}-${c}`);

        if (colorKey) {
          const pc = getPlayerColor(theme, colorKey);
          const bg = getHomeColor(theme, colorKey);
          return (
            <G key={`${r}-${c}`}>
              <Rect x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={bg} stroke={theme.cellBorder} strokeWidth={1.5} />
              <Rect x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={pc} opacity={0.65} />
            </G>
          );
        }

        return (
          <Rect
            key={`${r}-${c}`}
            x={c * CELL}
            y={r * CELL}
            width={CELL}
            height={CELL}
            fill={theme.trackCell}
            stroke={theme.cellBorder}
            strokeWidth={1.5}
          />
        );
      })}
    </G>
  );
};
