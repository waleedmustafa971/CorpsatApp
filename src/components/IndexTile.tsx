import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../lib/theme';

interface Props {
  label: string;
  value: number;
  /** What the index means, in a farmer's words. */
  caption: string;
  tone: string;
}

/** One vegetation index in the Farm detail grid (NDVI, NDWI, NDRE, soil). */
export function IndexTile({ label, value, caption, tone }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.tile}>
      <View style={styles.head}>
        <Text style={type.label}>{label}</Text>
        <Text style={styles.value}>{value.toFixed(2)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: tone }]} />
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.mist,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { ...type.bodyStrong, fontSize: 16 },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  caption: { ...type.small, fontSize: 11.5, lineHeight: 15 },
});
