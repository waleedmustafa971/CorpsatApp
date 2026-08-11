import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, layout, shadow, space, type } from '../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Removes the inner padding when the card holds a map or full-bleed media. */
  flush?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ children, style, flush = false, onPress, accessibilityLabel }: CardProps) {
  const content = [styles.card, flush ? styles.flush : styles.padded, style];

  if (!onPress) {
    return <View style={content}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [...content, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <Text style={type.label}>{children}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

/** Label/value row used across Farm detail and Review. */
export function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={styles.rowValue} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  padded: { padding: space.lg },
  flush: { padding: 0 },
  pressed: { backgroundColor: '#fbfdfa', borderColor: colors.accentSoft },
  sectionLabel: { marginBottom: space.md, marginTop: space['2xl'] },
  divider: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingVertical: space.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { ...type.small, flexShrink: 0 },
  rowValue: { ...type.bodyStrong, flex: 1, textAlign: 'right' },
});
