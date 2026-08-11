import { Redirect } from 'expo-router';
import React from 'react';

import { useSession } from '../src/lib/session';

/** Entry gate: send the farmer to the app or to sign-in. */
export default function Index() {
  const { session } = useSession();
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
