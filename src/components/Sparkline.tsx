import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, space, type } from '../lib/theme';
import { formatShortDate, ndviColor } from '../lib/util';
import { Snapshot } from '../types';

interface Props {
  snapshots: Snapshot[];
  height?: number;
  width: number;
}

/** Season NDVI curve, oldest → newest, with the latest capture marked. */
export function Sparkline({ snapshots, width, height = 92 }: Props) {
  if (snapshots.length < 2) return null;

  const values = snapshots.map((snapshot) => snapshot.indices.ndvi);
  // Scale to the data with a little headroom — a fixed 0-1 axis flattens the
  // season into a straight line for most fields.
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const pad = Math.max((highest - lowest) * 0.25, 0.04);
  const min = Math.max(lowest - pad, 0);
  const max = Math.min(highest + pad, 1);
  const span = Math.max(max - min, 0.0001);

  const padY = 10;
  const usableH = height - padY * 2;
  const stepX = width / (values.length - 1);

  const points = values.map((value, index) => ({
    x: index * stepX,
    y: padY + (1 - (value - min) / span) * usableH,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  const latest = points[points.length - 1];
  const latestValue = values[values.length - 1];
  const tone = ndviColor(latestValue);

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tone} stopOpacity={0.22} />
            <Stop offset="1" stopColor={tone} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#ndviFill)" />
        <Path d={line} stroke={tone} strokeWidth={2.2} strokeLinejoin="round" fill="none" />
        <Circle cx={latest.x} cy={latest.y} r={4.5} fill={tone} stroke={colors.surface} strokeWidth={2} />
      </Svg>
      <View style={styles.axis}>
        <Text style={type.small}>{formatShortDate(snapshots[0].captureDate)}</Text>
        <Text style={type.small}>{formatShortDate(snapshots[snapshots.length - 1].captureDate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
});
