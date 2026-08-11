import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette, radius } from '../lib/theme';

interface Props {
  size?: number;
  /** Inverted mark for use on the accent colour or over imagery. */
  tone?: 'brand' | 'light';
  style?: ViewStyle;
}

/**
 * The Cropsat mark: a rounded green tile holding a dashed field circle with a
 * satellite arc sweeping across it. Matches the web panel's <BrandMark />.
 */
export function BrandMark({ size = 40, tone = 'brand', style }: Props) {
  const tile = tone === 'brand' ? palette.accent : palette.white;
  const stroke = tone === 'brand' ? palette.white : palette.accent;

  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Rect x={0} y={0} width={40} height={40} rx={radius.md} fill={tile} />
        {/* Field boundary */}
        <Circle
          cx={20}
          cy={21}
          r={9.5}
          stroke={stroke}
          strokeOpacity={0.85}
          strokeWidth={1.8}
          strokeDasharray="3.2 3"
          fill="none"
        />
        {/* Crop core */}
        <Circle cx={20} cy={21} r={3.6} fill={stroke} fillOpacity={0.9} />
        {/* Satellite arc */}
        <Path
          d="M6.5 14.5C11 8.5 20.5 6 27.5 9.2"
          stroke={stroke}
          strokeOpacity={0.95}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={29.6} cy={10.4} r={2.4} fill={stroke} />
      </Svg>
    </View>
  );
}
