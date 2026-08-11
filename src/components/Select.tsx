import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, space, type } from '../lib/theme';

interface Props<T extends string> {
  label: string;
  value: T | null;
  options: readonly T[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  /** Chips wrap onto multiple lines by default; `scroll` keeps them on one row. */
  layout?: 'wrap' | 'scroll';
  style?: ViewStyle;
}

/**
 * Inline chip picker. On a phone this beats a modal for 3–4 options: the whole
 * choice set stays visible, and picking is one tap.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  hint,
  layout = 'wrap',
  style,
}: Props<T>) {
  const chips = options.map((option) => {
    const selected = option === value;
    return (
      <Pressable
        key={option}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}: ${option}`}
        onPress={() => onChange(option)}
        style={({ pressed }) => [
          styles.chip,
          selected && styles.chipSelected,
          pressed && !selected && styles.chipPressed,
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
      </Pressable>
    );
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      {layout === 'scroll' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.wrap}>{chips}</View>
      )}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={type.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  label: { marginLeft: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, paddingRight: space.lg },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipPressed: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  chipText: { ...type.body, fontSize: 14, color: colors.textMuted },
  chipTextSelected: { color: colors.white },
  error: { ...type.small, color: colors.rejectedFg, marginLeft: 2 },
});
