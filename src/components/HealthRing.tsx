import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, type } from '../lib/theme';
import { healthClassOf, ndviColor } from '../lib/util';

interface Props {
  /** 0-100, derived as round(latestNdvi * 100). */
  score: number;
  size?: number;
  strokeWidth?: number;
  caption?: string;
}

/**
 * Circular health gauge. The arc is coloured on the same NDVI ramp the web
 * panel uses, so a field reads the same on both surfaces.
 */
export function HealthRing({ score, size = 132, strokeWidth = 12, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = ndviColor(clamped / 100);
  const healthClass = healthClassOf(clamped / 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      {/* Rotated with a plain RN transform so the arc starts at 12 o'clock —
          SVG's own <G rotation> emits an invalid DOM prop on web. */}
      <View style={styles.rotated}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tone}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            fill="none"
          />
        </Svg>
      </View>
      <View style={styles.center}>
        <Text style={[styles.score, { fontSize: size * 0.28 }]}>{clamped}</Text>
        <Text style={[styles.class, { color: tone }]}>{caption ?? healthClass}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: { transform: [{ rotate: '-90deg' }] },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.displayBold, color: colors.text, letterSpacing: -1.2 },
  class: { ...type.badge, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.2 },
});
