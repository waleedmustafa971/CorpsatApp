import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { TabBar } from '../../src/components/TabBar';
import { useSession } from '../../src/lib/session';
import { colors } from '../../src/lib/theme';

export default function TabsLayout() {
  const { session } = useSession();

  // Everything under (tabs) requires a farmer session.
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'My Farms' }} />
      <Tabs.Screen name="add" options={{ title: 'Add Farm' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
