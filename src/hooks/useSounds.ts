import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

type SoundKey = 'dice' | 'move' | 'hit' | 'win';

/**
 * Loads all game sounds lazily inside useEffect so the asset system and
 * native Audio module are guaranteed to be ready before we touch them.
 * All requires are intentionally inside the async function — keeping them
 * at module level causes "Cannot read property 'prototype' of undefined"
 * on Hermes because native modules aren't initialised yet at import time.
 */
export function useSounds() {
  const pool = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS:    true,
          allowsRecordingIOS:      false,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.warn('[useSounds] setAudioModeAsync failed:', e);
      }

      // Requires are here — NOT at module level — so Metro/Hermes asset
      // resolution runs after the native layer is fully initialised.
      const sources: Record<SoundKey, any> = {
        dice: require('../../assets/sounds/dice_roll2.wav'),
        move: require('../../assets/sounds/piece_move2.wav'),
        hit:  require('../../assets/sounds/hit2.wav'),
        win:  require('../../assets/sounds/win_piece.wav'),
      };

      for (const key of Object.keys(sources) as SoundKey[]) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            sources[key],
            { shouldPlay: false, volume: 1.0, isLooping: false },
          );
          if (mounted) pool.current[key] = sound;
        } catch (e) {
          console.warn(`[useSounds] failed to load "${key}":`, e);
        }
      }
    }

    load();

    return () => {
      mounted = false;
      Object.values(pool.current).forEach(s => s?.unloadAsync?.());
      pool.current = {};
    };
  }, []);

  const play = useCallback(async (key: SoundKey) => {
    const sound = pool.current[key];
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // Silently ignore — audio may be unavailable on some devices
    }
  }, []);

  return {
    playDice: () => play('dice'),
    playMove: () => play('move'),
    playHit:  () => play('hit'),
    playWin:  () => play('win'),
  };
}
