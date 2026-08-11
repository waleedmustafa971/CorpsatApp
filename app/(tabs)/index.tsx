import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '../../src/components/Banner';
import { BrandMark } from '../../src/components/BrandMark';
import { Button } from '../../src/components/Button';
import { Card, SectionLabel } from '../../src/components/Card';
import { FarmCard } from '../../src/components/FarmCard';
import { FieldIcon } from '../../src/components/Icons';
import { EmptyState, LoadingState, Screen } from '../../src/components/Screen';
import { useSession } from '../../src/lib/session';
import { colors, space, type } from '../../src/lib/theme';
import { useAsync } from '../../src/lib/useAsync';
import { relativeDate } from '../../src/lib/util';
import { getLatestNdvi, getMyFarms } from '../../src/services/api';
import { Farm } from '../../src/types';

export default function MyFarmsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const farms = await getMyFarms();
    const ndvi = await getLatestNdvi(farms.map((farm) => farm.id));
    return { farms, ndvi };
  }, []);

  // A farm submitted on the Add tab should be visible the moment we come back.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 600);
  }, [reload]);

  const farms = data?.farms ?? [];
  const summary = useMemo(() => {
    const pending = farms.filter((farm) => farm.status === 'submitted');
    const active = farms.filter((farm) => farm.status === 'active');
    return { pending, active, total: farms.length };
  }, [farms]);

  const firstName = farmer?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: space['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={type.label}>Cropsat</Text>
            <Text style={type.display}>Hello, {firstName}</Text>
          </View>
          <BrandMark size={44} />
        </View>

        {loading && !data ? (
          <LoadingState label="Loading your fields…" />
        ) : (
          <>
            <SummaryStrip total={summary.total} pending={summary.pending.length} active={summary.active.length} />

            {summary.pending.length > 0 ? (
              <Banner
                tone="pending"
                title={
                  summary.pending.length === 1
                    ? '1 farm awaiting your insurer’s review.'
                    : `${summary.pending.length} farms awaiting your insurer’s review.`
                }
                message={
                  summary.pending.length === 1
                    ? `${summary.pending[0].name} was submitted ${relativeDate(summary.pending[0].submittedAt)}. Monitoring starts once it is approved.`
                    : 'Monitoring starts on each field once your insurer approves it.'
                }
                style={styles.banner}
              />
            ) : null}

            <SectionLabel style={styles.sectionLabel}>Your fields</SectionLabel>

            {farms.length === 0 ? (
              <EmptyState
                icon={<FieldIcon size={30} color={colors.textFaint} />}
                title="No farms yet"
                message="Register your first field and your insurer will start monitoring it from space."
                action={<Button label="Add farm" onPress={() => router.push('/(tabs)/add')} />}
              />
            ) : (
              <View style={styles.list}>
                {farms.map((farm: Farm) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    ndvi={data?.ndvi[farm.id]}
                    onPress={() => router.push({ pathname: '/farm/[id]', params: { id: farm.id } })}
                  />
                ))}
              </View>
            )}

            {farms.length > 0 ? (
              <Button
                label="Add another farm"
                variant="secondary"
                block
                onPress={() => router.push('/(tabs)/add')}
                style={styles.addButton}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function SummaryStrip({ total, pending, active }: { total: number; pending: number; active: number }) {
  const items = [
    { label: 'Fields', value: total, tone: colors.text },
    { label: 'Pending', value: pending, tone: colors.pendingFg },
    { label: 'Active', value: active, tone: colors.accentDark },
  ];

  return (
    <Card style={styles.summary}>
      <View style={styles.summaryRow}>
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 ? <View style={styles.summaryDivider} /> : null}
            <View style={styles.summaryItem}>
              <Text style={[type.numeric, { color: item.tone }]}>{item.value}</Text>
              <Text style={type.label}>{item.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, gap: space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.lg,
    marginBottom: space.xs,
  },
  headerText: { gap: space.sm, flex: 1 },
  summary: { paddingVertical: space.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 6 },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
  banner: { marginTop: space.xs },
  sectionLabel: { marginTop: space.md, marginBottom: 0 },
  list: { gap: space.md },
  addButton: { marginTop: space.sm },
});
