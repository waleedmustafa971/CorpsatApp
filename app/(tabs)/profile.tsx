import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { Card, DetailRow, SectionLabel } from '../../src/components/Card';
import { ConfirmSheet } from '../../src/components/ConfirmSheet';
import { CheckIcon, LogOutIcon, RefreshIcon } from '../../src/components/Icons';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/lib/session';
import { colors, fonts, radius, space, type } from '../../src/lib/theme';
import { formatDate, initialsOf } from '../../src/lib/util';
import { resetDemoData } from '../../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer, signOut, refresh } = useSession();
  const [resetting, setResetting] = useState(false);
  const [confirming, setConfirming] = useState<'reset' | 'logout' | null>(null);

  if (!farmer) return null;

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      await refresh();
      setConfirming(null);
      router.replace('/(tabs)');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setConfirming(null);
    router.replace('/(auth)/login');
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: space['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={type.label}>Profile</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initialsOf(farmer.name)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={type.title} numberOfLines={1}>
              {farmer.name}
            </Text>
            <Text style={styles.phone}>{farmer.phone}</Text>
          </View>
        </View>

        {farmer.canLogin ? (
          <View style={styles.loginPill}>
            <CheckIcon size={16} color={colors.accentDark} />
            <Text style={styles.loginPillText}>App login enabled by your insurer</Text>
          </View>
        ) : null}

        <SectionLabel>Details</SectionLabel>
        <Card>
          <DetailRow label="Region" value={farmer.state} />
          <DetailRow label="Country" value={farmer.country} />
          <DetailRow label="Address" value={farmer.address} />
          <DetailRow label="Email" value={farmer.email} />
          <DetailRow label="Fields registered" value={String(farmer.farmIds.length)} />
          <DetailRow label="Member since" value={formatDate(farmer.createdAt)} last />
        </Card>

        <SectionLabel>Account</SectionLabel>
        <View style={styles.actions}>
          <Button
            label="Reset demo data"
            variant="secondary"
            block
            onPress={() => setConfirming('reset')}
            icon={<RefreshIcon size={18} color={colors.accentDark} />}
          />
          <Button
            label="Log out"
            variant="danger"
            block
            onPress={() => setConfirming('logout')}
            icon={<LogOutIcon size={18} color={colors.rejectedFg} />}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cropsat Farmer v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
          <Text style={styles.footerText}>
            Mock environment — data is stored locally on this device.
          </Text>
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={confirming === 'reset'}
        title="Reset demo data?"
        message="This restores the seeded farms and removes anything you submitted on this device."
        confirmLabel="Reset"
        destructive
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmSheet
        visible={confirming === 'logout'}
        title="Log out?"
        message="You will need your phone number and a code to sign back in."
        confirmLabel="Log out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setConfirming(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, gap: space.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.xs },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.accentDark },
  identityText: { flex: 1, gap: space.xs },
  phone: { ...type.body, color: colors.textMuted },
  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    marginTop: space.sm,
  },
  loginPillText: { ...type.small, color: colors.accentDark, fontFamily: fonts.bodySemi },
  actions: { gap: space.md },
  footer: { marginTop: space['3xl'], gap: space.xs, alignItems: 'center' },
  footerText: { ...type.small, fontSize: 12, textAlign: 'center' },
});
