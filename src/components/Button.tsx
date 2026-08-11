import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, ink, radius, space } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Stretches to the container width — the default for primary actions. */
  block?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const HEIGHTS: Record<Size, number> = { sm: 36, md: 46, lg: 54 };
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  block = variant === 'primary',
  icon,
  style,
}: Props) {
  const inactive = disabled || loading;

  const handlePress = () => {
    if (inactive || !onPress) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={label}
      onPress={handlePress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size], paddingHorizontal: size === 'sm' ? space.md : space.xl },
        block && styles.block,
        variantStyle(variant),
        pressed && !inactive && pressedStyle(variant),
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor(variant)} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            numberOfLines={1}
            style={[styles.label, { color: labelColor(variant), fontSize: FONT_SIZES[size] }]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: Variant): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.accent };
    case 'secondary':
      return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border };
    case 'danger':
      return { backgroundColor: colors.rejectedBg };
    case 'ghost':
    default:
      return { backgroundColor: 'transparent' };
  }
}

function pressedStyle(variant: Variant): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.accentDark };
    case 'danger':
      return { opacity: 0.8 };
    case 'secondary':
    case 'ghost':
    default:
      return { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft };
  }
}

function labelColor(variant: Variant): string {
  switch (variant) {
    case 'primary':
      return colors.white;
    case 'danger':
      return colors.rejectedFg;
    case 'secondary':
    case 'ghost':
    default:
      return colors.accentDark;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch', width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  icon: { marginTop: -1 },
  label: { fontFamily: fonts.bodySemi, letterSpacing: 0.1 },
  inactive: { opacity: 0.45 },
});

/** A compact icon-only control used for map tools and headers. */
export function IconButton({
  label,
  onPress,
  disabled,
  children,
  tone = 'surface',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tone?: 'surface' | 'imagery';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        iconStyles.base,
        tone === 'imagery' ? iconStyles.imagery : iconStyles.surface,
        pressed && { backgroundColor: colors.accentSoft },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const iconStyles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  imagery: { backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: ink(0.06) },
});
