import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '../lib/theme';
import { FieldIcon, PlusIcon, UserIcon } from './Icons';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  index: FieldIcon,
  add: PlusIcon,
  profile: UserIcon,
};

/**
 * Structural subset of @react-navigation/bottom-tabs' BottomTabBarProps. Typed
 * here because the package is a transitive dep of expo-router and its types are
 * not resolvable from the app's own module graph.
 */
interface TabRoute {
  key: string;
  name: string;
}

export interface TabBarProps {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: unknown } }>;
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

/**
 * Custom bottom bar: the active tab gets a soft accent pill behind its icon,
 * which reads more clearly outdoors than a colour change alone.
 */
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
        const focused = state.index === index;
        const Icon = ICONS[route.name] ?? FieldIcon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (focused || event.defaultPrevented) return;
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync().catch(() => undefined);
          }
          navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon size={22} color={focused ? colors.accentDark : colors.textFaint} />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  iconWrap: {
    paddingHorizontal: space.lg,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  iconWrapActive: { backgroundColor: colors.accentSoft },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    letterSpacing: 0.1,
    color: colors.textFaint,
  },
  labelActive: { fontFamily: fonts.bodySemi, color: colors.accentDark },
});
