import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, space, type } from '../lib/theme';
import { ndviColor, riskColor } from '../lib/util';
import { FarmStatus, RiskLevel } from '../types';

const STATUS_LABEL: Record<FarmStatus, string> = {
  submitted: 'Pending review',
  active: 'Active',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<FarmStatus, { bg: string; fg: string }> = {
  submitted: { bg: colors.pendingBg, fg: colors.pendingFg },
  active: { bg: colors.activeBg, fg: colors.activeFg },
  rejected: { bg: colors.rejectedBg, fg: colors.rejectedFg },
};

export function StatusBadge({ status, style }: { status: FarmStatus; style?: ViewStyle }) {
  const tone = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[type.badge, { color: tone.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function RiskBadge({ level, style }: { level: RiskLevel; style?: ViewStyle }) {
  const fg = riskColor(level);
  return (
    <View style={[styles.badge, { backgroundColor: `${fg}14` }, style]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[type.badge, { color: fg }]}>{level} risk</Text>
    </View>
  );
}

/** Health score chip, coloured on the NDVI ramp. */
export function HealthChip({ score, style }: { score: number; style?: ViewStyle }) {
  const tone = ndviColor(score / 100);
  return (
    <View style={[styles.badge, { backgroundColor: `${tone}1f` }, style]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[type.badge, { color: tone }]}>{score} health</Text>
    </View>
  );
}

/** Neutral pill for metadata (crop, soil, irrigation). */
export function Chip({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.badge, styles.neutral, style]}>
      <Text style={[type.badge, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  neutral: { backgroundColor: colors.mist, borderWidth: 1, borderColor: colors.border },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
