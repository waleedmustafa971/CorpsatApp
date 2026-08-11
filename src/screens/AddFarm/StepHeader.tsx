import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '../../components/Button';
import { ChevronLeftIcon } from '../../components/Icons';
import { colors, radius, space, type } from '../../lib/theme';

interface Props {
  step: number; // 0-based
  total: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export function StepHeader({ step, total, title, subtitle, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <IconButton label="Back a step" onPress={onBack}>
            <ChevronLeftIcon color={colors.text} />
          </IconButton>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={type.label}>
          Step {step + 1} of {total}
        </Text>
      </View>

      <View style={styles.track} accessibilityRole="progressbar">
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index <= step ? styles.segmentDone : styles.segmentTodo,
            ]}
          />
        ))}
      </View>

      <View style={styles.text}>
        <Text style={type.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: 40, height: 40 },
  track: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: radius.pill },
  segmentDone: { backgroundColor: colors.accent },
  segmentTodo: { backgroundColor: colors.border },
  text: { gap: space.xs, marginTop: space.xs },
  subtitle: { ...type.body, color: colors.textMuted },
});
