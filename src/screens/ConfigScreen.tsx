import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getTheme } from '../themes/themes';
import { GameConfig, GuttiSkin, SixBehavior, OneBehavior } from '../engine/types';
import { SKIN_META } from '../components/Piece/skins';

export const ConfigScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const config = useGameStore(s => s.config);
  const themePreset = useGameStore(s => s.theme);
  const guttiSkin = useGameStore(s => s.guttiSkin);
  const setConfig = useGameStore(s => s.setConfig);
  const setGuttiSkin = useGameStore(s => s.setGuttiSkin);
  const theme = getTheme(themePreset);

  const set = (patch: Partial<GameConfig>) => setConfig(patch);

  const ONE_OPTIONS: Array<{ value: OneBehavior; label: string; desc: string }> = [
    {
      value: 'off',
      label: 'Disabled',
      desc: 'Rolling a 1 has no special effect (default)',
    },
    {
      value: 'open_only',
      label: 'Open Only',
      desc: 'Rolling a 1 brings a piece out of home base; no extra turn',
    },
    {
      value: 'open_and_turn',
      label: 'Open + Extra Turn',
      desc: 'Rolling a 1 always grants an extra roll (also opens a home piece)',
    },
  ];

  const SIX_OPTIONS: Array<{ value: SixBehavior; label: string; desc: string }> = [
    {
      value: 'open_and_turn',
      label: 'Open + Extra Turn',
      desc: 'Rolling 6 opens a piece AND grants an extra roll (classic)',
    },
    {
      value: 'extra_turn',
      label: 'Extra Turn Only',
      desc: 'Rolling 6 gives extra roll; needs separate roll to open',
    },
    {
      value: 'open_only',
      label: 'Open Only',
      desc: 'Rolling 6 only opens a piece; no extra turn',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Piece Style ── */}
        <Section title="Piece Style" theme={theme}>
          <View style={styles.skinRow}>
            {(Object.keys(SKIN_META) as GuttiSkin[]).map(key => {
              const meta = SKIN_META[key];
              const active = guttiSkin === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setGuttiSkin(key)}
                  style={[
                    styles.skinChip,
                    { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.surfaceAlt : theme.surface },
                  ]}
                >
                  <Text style={styles.skinEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.skinLabel, { color: active ? theme.accent : theme.text }]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* ── Rolling a 6 ── */}
        <Section title="Rolling a 6" theme={theme}>
          {SIX_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                { borderColor: theme.border, backgroundColor: theme.surface },
                config.sixBehavior === opt.value && { borderColor: theme.accent, backgroundColor: theme.surfaceAlt },
              ]}
              onPress={() => set({ sixBehavior: opt.value })}
            >
              <View style={[styles.radio, { borderColor: theme.accent }]}>
                {config.sixBehavior === opt.value && (
                  <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optLabel, { color: theme.text }]}>{opt.label}</Text>
                <Text style={[styles.optDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* ── Rolling a 1 ── */}
        <Section title="Rolling a 1" theme={theme}>
          {ONE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                { borderColor: theme.border, backgroundColor: theme.surface },
                config.oneBehavior === opt.value && { borderColor: theme.accent, backgroundColor: theme.surfaceAlt },
              ]}
              onPress={() => set({ oneBehavior: opt.value })}
            >
              <View style={[styles.radio, { borderColor: theme.accent }]}>
                {config.oneBehavior === opt.value && (
                  <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optLabel, { color: theme.text }]}>{opt.label}</Text>
                <Text style={[styles.optDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* ── Stacking ── */}
        <Section title="Stacking" theme={theme}>
          <ToggleRow
            label="Allow stacking"
            desc="Same-color pieces can share a cell"
            value={config.stackingEnabled}
            onChange={v => set({ stackingEnabled: v })}
            theme={theme}
          />
          {config.stackingEnabled && (
            <ToggleRow
              label="Stack is invincible"
              desc="A stack of 2+ pieces cannot be killed"
              value={config.stackIsInvincible}
              onChange={v => set({ stackIsInvincible: v })}
              theme={theme}
            />
          )}
        </Section>

        {/* ── Combat ── */}
        <Section title="Combat" theme={theme}>
          <ToggleRow
            label="Killing enabled"
            desc="Landing on an opponent sends them back to base"
            value={config.killEnabled}
            onChange={v => set({ killEnabled: v })}
            theme={theme}
          />
        </Section>

        {/* ── Finishing ── */}
        <Section title="Finishing" theme={theme}>
          <ToggleRow
            label="Exact finish required"
            desc="Must land exactly on the final cell; overshooting is invalid"
            value={config.exactFinish}
            onChange={v => set({ exactFinish: v })}
            theme={theme}
          />
        </Section>

        {/* ── Consecutive sixes ── */}
        <Section title="Consecutive Sixes Limit" theme={theme}>
          {[0, 2, 3].map(n => (
            <TouchableOpacity
              key={n}
              style={[
                styles.optionRow,
                { borderColor: theme.border, backgroundColor: theme.surface },
                config.maxConsecutiveSixes === n && { borderColor: theme.accent, backgroundColor: theme.surfaceAlt },
              ]}
              onPress={() => set({ maxConsecutiveSixes: n })}
            >
              <View style={[styles.radio, { borderColor: theme.accent }]}>
                {config.maxConsecutiveSixes === n && (
                  <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optLabel, { color: theme.text }]}>
                  {n === 0 ? 'No limit' : `Max ${n} sixes`}
                </Text>
                <Text style={[styles.optDesc, { color: theme.textSecondary }]}>
                  {n === 0
                    ? 'Roll 6 as many times as you like'
                    : `After ${n} consecutive 6s, lose your turn`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Helper components ────────────────────────────────────────────────────────

const Section = ({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.accent }]}>{title}</Text>
    {children}
  </View>
);

const ToggleRow = ({ label, desc, value, onChange, theme }: {
  label: string; desc: string; value: boolean;
  onChange: (v: boolean) => void; theme: any;
}) => (
  <View style={[styles.toggleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
    <View style={styles.toggleText}>
      <Text style={[styles.optLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.optDesc, { color: theme.textSecondary }]}>{desc}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: theme.border, true: theme.accent + '88' }}
      thumbColor={value ? theme.accent : theme.textSecondary}
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1 },
  optLabel: { fontSize: 15, fontWeight: '600' },
  optDesc: { fontSize: 12, marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  toggleText: { flex: 1 },
  skinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skinChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
  },
  skinEmoji: { fontSize: 24 },
  skinLabel: { fontSize: 13, fontWeight: '600' },
});
