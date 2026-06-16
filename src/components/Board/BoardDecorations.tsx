import React from 'react';
import { G, Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import { LudoTheme, getPlayerColor } from '../../themes/themes';
import { PlayerColor } from '../../engine/types';
import { MAIN_TRACK, SAFE_MAIN_POSITIONS, ENTRY_OFFSET } from '../../engine/boardData';
import { CELL, BOARD_SIZE } from './boardConstants';

// ─── Center Area ─────────────────────────────────────────────────────────────

interface CenterAreaProps {
  theme: LudoTheme;
}

export const CenterArea: React.FC<CenterAreaProps> = ({ theme }) => {
  const x = 6 * CELL;
  const y = 6 * CELL;
  const size = 3 * CELL;
  const mid = size / 2;

  return (
    <G>
      <Rect x={x} y={y} width={size} height={size} fill={theme.boardBackground} stroke={theme.cellBorder} strokeWidth={1} />
      {/* 4-color triangles pointing to center */}
      <Path d={`M ${x} ${y} L ${x + mid} ${y + mid} L ${x + size} ${y}`}            fill={getPlayerColor(theme, 'green')  + 'AA'} />
      <Path d={`M ${x + size} ${y} L ${x + mid} ${y + mid} L ${x + size} ${y + size}`} fill={getPlayerColor(theme, 'yellow') + 'AA'} />
      <Path d={`M ${x + size} ${y + size} L ${x + mid} ${y + mid} L ${x} ${y + size}`} fill={getPlayerColor(theme, 'blue')   + 'AA'} />
      <Path d={`M ${x} ${y + size} L ${x + mid} ${y + mid} L ${x} ${y}`}            fill={getPlayerColor(theme, 'red')    + 'AA'} />
    </G>
  );
};

// ─── Safe Markers ─────────────────────────────────────────────────────────────

interface SafeMarkersProps {
  theme: LudoTheme;
}

export const SafeMarkers: React.FC<SafeMarkersProps> = ({ theme }) => {
  const safeIndices = Array.from(SAFE_MAIN_POSITIONS);
  return (
    <G>
      {safeIndices.map(i => {
        const [r, c] = MAIN_TRACK[i];
        const cx = c * CELL + CELL / 2;
        const cy = r * CELL + CELL / 2;
        return (
          <SvgText key={i} x={cx} y={cy + 4} textAnchor="middle" fontSize={CELL * 0.6} fill={theme.accent} opacity={0.7}>
            ★
          </SvgText>
        );
      })}
      {/* Entry circles per color */}
      {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(color => {
        const idx = ENTRY_OFFSET[color];
        const [r, c] = MAIN_TRACK[idx];
        const cx = c * CELL + CELL / 2;
        const cy = r * CELL + CELL / 2;
        return (
          <Circle
            key={`entry-${color}`}
            cx={cx} cy={cy} r={CELL * 0.35}
            fill={getPlayerColor(theme, color) + '33'}
            stroke={getPlayerColor(theme, color)}
            strokeWidth={1}
          />
        );
      })}
    </G>
  );
};
