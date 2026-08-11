import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, space, type } from '../lib/theme';

type Tone = 'pending' | 'active' | 'rejected' | 'info';

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  pending: { bg: colors.pendingBg, fg: colors.pendingFg, border: '#f5d78a' },
  active: { bg: colors.accentSoft, fg: colors.accentDark, border: '#c9e0c9' },
  rejected: { bg: colors.rejectedBg, fg: colors.rejectedFg, border: '#f5b9b9' },
  info: { bg: colors.surface, fg: colors.text, border: colors.border },
};

interface Props {
  tone?: Tone;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function Banner({ tone = 'info', title, message, action, style }: Props) {
  const palette = TONES[tone];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }, style]}
    >
      <View style={[styles.rail, { backgroundColor: palette.fg }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: palette.fg }]}>{title}</Text>
        {message ? <Text style={[styles.message, { color: palette.fg }]}>{message}</Text> : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  rail: { width: 3 },
  content: { flex: 1, padding: space.lg, gap: space.xs },
  title: { ...type.bodyStrong, fontSize: 14.5 },
  message: { ...type.small, opacity: 0.88, lineHeight: 19 },
  action: { marginTop: space.sm, alignItems: 'flex-start' },
});
