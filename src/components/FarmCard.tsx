import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '../lib/theme';
import { formatNumber, healthScoreOf, ndviColor } from '../lib/util';
import { Farm } from '../types';
import { HealthChip, StatusBadge } from './Badge';
import { Card } from './Card';
import { FarmMap } from './FarmMap';
import { ChevronRightIcon } from './Icons';

interface Props {
  farm: Farm;
  /** Latest NDVI, present only for monitored (active) farms. */
  ndvi?: number;
  onPress: () => void;
}

export function FarmCard({ farm, ndvi, onPress }: Props) {
  const score = ndvi !== undefined ? healthScoreOf(ndvi) : undefined;
  const tone = ndvi !== undefined ? ndviColor(ndvi) : colors.textFaint;

  return (
    <Card flush onPress={onPress} accessibilityLabel={`Open ${farm.name}`}>
      <View style={styles.row}>
        <FarmMap
          boundary={farm.boundary}
          fillColor={tone}
          strokeColor={colors.white}
          height={96}
          interactive={false}
          showVertices={false}
          style={styles.thumb}
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {farm.name}
            </Text>
            <ChevronRightIcon size={18} color={colors.textFaint} />
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {farm.state} · {farm.cropType} · {formatNumber(farm.landSizeAcres, 1)} acres
          </Text>

          <View style={styles.badges}>
            <StatusBadge status={farm.status} />
            {score !== undefined ? <HealthChip score={score} /> : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: space.md, gap: space.md, alignItems: 'center' },
  thumb: { width: 96, height: 96, borderRadius: 12 },
  body: { flex: 1, gap: 6, paddingRight: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { ...type.heading, flex: 1 },
  meta: { ...type.small },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 2 },
});
