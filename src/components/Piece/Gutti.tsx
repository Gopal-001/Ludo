import React from 'react';
import { G, Circle, Polygon, Rect, Ellipse } from 'react-native-svg';
import { Piece, GuttiSkin } from '../../engine/types';
import { LudoTheme, getPlayerColor } from '../../themes/themes';

interface GuttiProps {
  piece: Piece;
  cx: number;
  cy: number;
  radius: number;
  theme: LudoTheme;
  skin: GuttiSkin;
  isMovable: boolean;
  onPress: () => void;
}

// SVG doesn't have built-in animation, so we use a pulse effect via opacity cycling
// For native animation of SVG, we keep it simple with static rendering + press glow.

export const Gutti: React.FC<GuttiProps> = ({
  piece, cx, cy, radius, theme, skin, isMovable, onPress,
}) => {
  const fill = getPlayerColor(theme, piece.color);
  const stroke = isMovable ? '#FFFFFF' : fill;
  const strokeW = isMovable ? 2 : 1;

  // Finished pieces are rendered at the center triangle — no hit area needed
  if (piece.isFinished) {
    return (
      <G>
        {skin === 'round' ? (
          <RoundBun cx={cx} cy={cy} r={radius} fill={fill} stroke={fill} strokeWidth={1} isMovable={false} onPress={() => {}} />
        ) : (
          <StarGutti cx={cx} cy={cy} r={radius} fill={fill} stroke={fill} strokeWidth={1} isMovable={false} onPress={() => {}} />
        )}
      </G>
    );
  }

  const hitSize = radius * 2.5; // generous transparent hit area

  return (
    <G>
      {/* Invisible touch target — covers a larger area than the visual */}
      <Rect
        x={cx - hitSize / 2}
        y={cy - hitSize / 2}
        width={hitSize}
        height={hitSize}
        fill="transparent"
        onPress={onPress}
      />
      {skin === 'round' ? (
        <RoundBun cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeW} isMovable={isMovable} onPress={onPress} />
      ) : (
        <StarGutti cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeW} isMovable={isMovable} onPress={onPress} />
      )}
    </G>
  );
};

// ─── Round (Bun) skin — exported for use in the animation overlay ─────────────

export const RoundBun = ({ cx, cy, r, fill, isMovable, onPress, stroke, strokeWidth }: {
  cx: number; cy: number; r: number;
  fill: string; stroke?: string; strokeWidth?: number; isMovable: boolean; onPress: () => void;
}) => (
  <G onPress={onPress}>
    {/* Outline glow ring for movable */}
    {isMovable && (
      <Circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.9} />
    )}
    
    {/* 1. Drop shadow on the board */}
    <Circle cx={cx} cy={cy + r * 0.15} r={r * 0.95} fill="#00000055" />

    {/* 2. Base bottom edge (creates 3D thickness) */}
    <Circle cx={cx} cy={cy + r * 0.1} r={r} fill="#000000" opacity={0.3} />

    {/* 3. Main colored body (sphere base) */}
    <Circle cx={cx} cy={cy} r={r} fill={fill} stroke="#00000033" strokeWidth={1} />

    {/* 4. Glossy dome reflection (top half highlight) */}
    <Ellipse cx={cx} cy={cy - r * 0.3} rx={r * 0.65} ry={r * 0.35} fill="#FFFFFF44" />

    {/* 5. Inner recessed ring (the bun's flat top indent) */}
    <Circle cx={cx} cy={cy - r * 0.05} r={r * 0.5} fill="#0000001A" stroke="#FFFFFF44" strokeWidth={1} />
    
    {/* 6. Center raised cap */}
    <Circle cx={cx} cy={cy - r * 0.05} r={r * 0.35} fill={fill} stroke="#00000033" strokeWidth={0.5} />
    
    {/* 7. Center cap glossy highlight */}
    <Circle cx={cx - r * 0.08} cy={cy - r * 0.12} r={r * 0.12} fill="#FFFFFF77" />
  </G>
);

// ─── Star skin ────────────────────────────────────────────────────────────────

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    path += `${x},${y} `;
  }
  return path.trim();
}

const StarGutti = ({ cx, cy, r, fill, stroke, strokeWidth, isMovable, onPress }: {
  cx: number; cy: number; r: number;
  fill: string; stroke: string; strokeWidth: number; isMovable: boolean; onPress: () => void;
}) => {
  const pts = starPoints(cx, cy, r, r * 0.5, 5);
  return (
    <G onPress={onPress}>
      {isMovable && (
        <Polygon points={starPoints(cx, cy, r + 3, r * 0.55, 5)} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.8} />
      )}
      <Polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} onPress={onPress} />
      <Circle cx={cx} cy={cy} r={r * 0.2} fill="#FFFFFF55" />
    </G>
  );
};
