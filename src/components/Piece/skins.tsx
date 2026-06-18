/**
 * Piece Skin Registry
 * -------------------
 * To add a new skin:
 *   1. Create a component that accepts SkinProps
 *   2. Add it to PIECE_SKINS with its key
 *   3. Add the key to GuttiSkin in src/engine/types.ts
 *
 * No if/else anywhere else needs to change.
 */

import React from 'react';
import { View } from 'react-native';
import { GuttiSkin } from '../../engine/types';

// ─── Contract every skin must satisfy ────────────────────────────────────────

export interface SkinProps {
  radius: number;   // half the visual diameter — all sizing derives from this
  fill: string;     // player colour hex
  isMovable: boolean;
}

export type SkinComponent = React.FC<SkinProps>;

// ─── Bun (round ball with gloss) ─────────────────────────────────────────────

const BunSkin: SkinComponent = ({ radius, fill, isMovable }) => (
  <View
    style={{
      width: radius * 2,
      height: radius * 2,
      borderRadius: radius,
      backgroundColor: fill,
      borderWidth: isMovable ? 2.5 : 1,
      borderColor: isMovable ? '#FFF' : 'rgba(0,0,0,0.2)',
      elevation: isMovable ? 8 : 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {/* Indented centre ring */}
    <View
      style={{
        width: radius,
        height: radius,
        borderRadius: radius / 2,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
      }}
    />
    {/* Gloss highlight */}
    <View
      style={{
        position: 'absolute',
        width: radius * 0.65,
        height: radius * 0.32,
        borderRadius: radius * 0.2,
        top: radius * 0.12,
        left: radius * 0.22,
        backgroundColor: 'rgba(255,255,255,0.42)',
      }}
    />
  </View>
);

// ─── Pawn (chess-pawn silhouette) ─────────────────────────────────────────────

const PawnSkin: SkinComponent = ({ radius, fill, isMovable }) => {
  const headR    = radius * 0.55;
  const coneH    = radius * 1.3;
  const coneW    = radius * 1.1;
  const baseW    = radius * 1.6;
  const baseH    = radius * 0.5;

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        transform: [{ translateY: -radius * 0.3 }],
      }}
    >
      {/* Spherical head */}
      <View
        style={{
          width: headR * 2,
          height: headR * 2,
          borderRadius: headR,
          backgroundColor: fill,
          borderColor: isMovable ? '#FFF' : 'rgba(0,0,0,0.1)',
          borderWidth: isMovable ? 2 : 1,
          zIndex: 3,
          elevation: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: headR * 0.2,
            left: headR * 0.3,
            width: headR * 0.8,
            height: headR * 0.4,
            borderRadius: headR * 0.2,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
      </View>

      {/* Triangular cone body */}
      <View
        style={{
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: coneW / 2,
          borderRightWidth: coneW / 2,
          borderBottomWidth: coneH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: fill,
          marginTop: -headR * 0.6,
          zIndex: 2,
        }}
      />

      {/* Rounded base */}
      <View
        style={{
          width: baseW,
          height: baseH,
          borderRadius: baseH / 2,
          backgroundColor: fill,
          borderColor: isMovable ? '#FFF' : 'rgba(0,0,0,0.2)',
          borderWidth: isMovable ? 1.5 : 1,
          marginTop: -baseH * 0.4,
          zIndex: 1,
          elevation: 1,
        }}
      />
    </View>
  );
};

// ─── Happy (smiley face) ──────────────────────────────────────────────────────

const HappySkin: SkinComponent = ({ radius, fill, isMovable }) => {
  const eyeR = radius * 0.14;

  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: fill,
        borderWidth: isMovable ? 2.5 : 1.5,
        borderColor: isMovable ? '#FFF' : 'rgba(0,0,0,0.2)',
        elevation: isMovable ? 8 : 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Gloss */}
      <View
        style={{
          position: 'absolute',
          top: radius * 0.08,
          left: radius * 0.2,
          width: radius * 0.8,
          height: radius * 0.35,
          borderRadius: radius * 0.2,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }}
      />

      {/* Eyes */}
      <View style={{ flexDirection: 'row', marginBottom: radius * 0.12, gap: radius * 0.44 }}>
        <View
          style={{
            width: eyeR * 2,
            height: eyeR * 2,
            borderRadius: eyeR,
            backgroundColor: 'rgba(0,0,0,0.65)',
          }}
        />
        <View
          style={{
            width: eyeR * 2,
            height: eyeR * 2,
            borderRadius: eyeR,
            backgroundColor: 'rgba(0,0,0,0.65)',
          }}
        />
      </View>

      {/* Smile — a U-shape made from border-radius */}
      <View
        style={{
          width: radius * 0.88,
          height: radius * 0.5,
          borderBottomLeftRadius: radius * 0.6,
          borderBottomRightRadius: radius * 0.6,
          borderWidth: radius * 0.11,
          borderColor: 'rgba(0,0,0,0.65)',
          borderTopWidth: 0,
        }}
      />
    </View>
  );
};

// ─── Registry — the only place you edit when adding a skin ───────────────────

export const PIECE_SKINS: Record<GuttiSkin, SkinComponent> = {
  round: BunSkin,
  pawn:  PawnSkin,
  happy: HappySkin,
};

export const SKIN_META: Record<GuttiSkin, { label: string; emoji: string }> = {
  round: { label: 'Bun',   emoji: '🟤' },
  pawn:  { label: 'Pawn',  emoji: '♟️' },
  happy: { label: 'Happy', emoji: '😊' },
};
