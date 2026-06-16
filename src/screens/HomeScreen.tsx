import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getTheme, THEMES, ThemePreset } from '../themes/themes';
import { GuttiSkin } from '../engine/types';

interface HomeScreenProps {
  onStart: () => void;
  onConfig: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, onConfig }) => {
  const themePreset = useGameStore(s => s.theme);
  const config = useGameStore(s => s.config);
  const guttiSkin = useGameStore(s => s.guttiSkin);
  const setTheme = useGameStore(s => s.setTheme);
  const setConfig = useGameStore(s => s.setConfig);
  const setGuttiSkin = useGameStore(s => s.setGuttiSkin);
  const startGame = useGameStore(s => s.startGame);

  const theme = getTheme(themePreset);

  const handleStart = () => {
    startGame();
    onStart();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themePreset === 'dark' || themePreset === 'neon' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={[styles.titleEmoji]}>🎲</Text>
          <Text style={[styles.title, { color: theme.text }]}>LUDO</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Customize & Play</Text>
        </View>

        {/* ── Players ── */}
        <Card title="Players" theme={theme}>
          <View style={styles.chipRow}>
            {([2, 3, 4] as const).map(n => (
              <Chip
                key={n}
                label={`${n} Players`}
                active={config.playerCount === n}
                theme={theme}
                onPress={() => setConfig({ playerCount: n })}
              />
            ))}
          </View>
        </Card>

        {/* ── Theme ── */}
        <Card title="Theme" theme={theme}>
          <View style={styles.chipRow}>
            {(Object.keys(THEMES) as ThemePreset[]).map(t => (
              <Chip
                key={t}
                label={THEMES[t].label}
                active={themePreset === t}
                theme={theme}
                onPress={() => setTheme(t)}
              />
            ))}
          </View>
        </Card>

        {/* ── Gutti skin ── */}
        <Card title="Piece Style" theme={theme}>
          <View style={styles.chipRow}>
            {(['round', 'star'] as GuttiSkin[]).map(skin => (
              <Chip
                key={skin}
                label={skin === 'round' ? '⚫ Round' : '⭐ Star'}
                active={guttiSkin === skin}
                theme={theme}
                onPress={() => setGuttiSkin(skin)}
              />
            ))}
          </View>
        </Card>

        {/* ── Custom Rules summary ── */}
        <TouchableOpacity
          style={[styles.rulesPreview, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onConfig}
        >
          <View style={styles.rulesHeader}>
            <Text style={[styles.rulesTitle, { color: theme.text }]}>⚙️  Custom Rules</Text>
            <Text style={[styles.rulesEdit, { color: theme.accent }]}>Edit →</Text>
          </View>
          <View style={styles.rulesBadges}>
            <RuleBadge theme={theme} label={`6: ${config.sixBehavior.replace(/_/g, ' ')}`} />
            {config.stackingEnabled && <RuleBadge theme={theme} label="Stacking ON" />}
            {!config.killEnabled && <RuleBadge theme={theme} label="No Killing" />}
            {config.exactFinish && <RuleBadge theme={theme} label="Exact Finish" />}
            {config.maxConsecutiveSixes > 0 && <RuleBadge theme={theme} label={`Max ${config.maxConsecutiveSixes}×6`} />}
          </View>
        </TouchableOpacity>

        {/* ── Start ── */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: theme.accent }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startText}>Start Game</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Small components ─────────────────────────────────────────────────────────

const Card = ({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) => (
  <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Text style={[styles.cardTitle, { color: theme.accent }]}>{title}</Text>
    {children}
  </View>
);

const Chip = ({ label, active, theme, onPress }: {
  label: string; active: boolean; theme: any; onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
      active && { backgroundColor: theme.accent, borderColor: theme.accent },
    ]}
  >
    <Text style={[styles.chipText, { color: active ? '#FFF' : theme.text }]}>{label}</Text>
  </TouchableOpacity>
);

const RuleBadge = ({ label, theme }: { label: string; theme: any }) => (
  <View style={[styles.badge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },
  titleArea: { alignItems: 'center', marginBottom: 28 },
  titleEmoji: { fontSize: 48 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: 6, marginTop: 4 },
  subtitle: { fontSize: 14, letterSpacing: 2, marginTop: 2 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  rulesPreview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  rulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rulesTitle: { fontSize: 15, fontWeight: '700' },
  rulesEdit: { fontSize: 14, fontWeight: '600' },
  rulesBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '500' },

  startBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startText: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
});
