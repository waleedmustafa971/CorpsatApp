import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useSession } from '../../src/lib/session';
import { colors } from '../../src/lib/theme';

export default function AuthLayout() {
  const { session } = useSession();

  // Already signed in — never show the auth stack.
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
