import React from 'react';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

/**
 * A small hand-rolled icon set. Stroke-based, 24×24, 1.8 weight — chosen so the
 * icons sit at the same visual weight as IBM Plex Sans body text.
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export function FieldIcon({ size = 24, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 13.2 12 17.4l8.5-4.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={8.2} r={3.6} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M4.8 19.4c1-3.2 3.8-5 7.2-5s6.2 1.8 7.2 5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Polyline
        points="9,5 16,12 9,19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Polyline
        points="15,5 8,12 15,19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function UndoIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M8 6 4 10l4 4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 10h9a6 6 0 0 1 0 12h-2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M4.5 7h15M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.4 7.5 7.2 19a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.8-11.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TargetIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={12} r={6.5} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SatelliteIcon({ size = 22, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle
        cx={12}
        cy={13}
        r={6}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="2.5 2.5"
      />
      <Circle cx={12} cy={13} r={2.2} fill={color} />
      <Path
        d="M3 7.5C6 3.5 13 2 18 4.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx={19.4} cy={5} r={1.6} fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color = '#1c2a1d', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Polyline
        points="5,12.5 10,17.5 19,7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ClockIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 7.6V12l3 1.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LogOutIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M14.5 4.5h-7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.5 8.5 19 12l-3.5 3.5M19 12h-9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RefreshIcon({ size = 20, color = '#1c2a1d', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M19.6 4v4h-4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
