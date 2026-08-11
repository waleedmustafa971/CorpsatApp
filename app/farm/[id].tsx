import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, RiskBadge, StatusBadge } from '../../src/components/Badge';
import { Banner } from '../../src/components/Banner';
import { Button, IconButton } from '../../src/components/Button';
import { Card, DetailRow, SectionLabel } from '../../src/components/Card';
import { FarmMap, MapOverlayPill } from '../../src/components/FarmMap';
import { HealthRing } from '../../src/components/HealthRing';
import { ChevronLeftIcon, ClockIcon, SatelliteIcon } from '../../src/components/Icons';
import { IndexTile } from '../../src/components/IndexTile';
import { EmptyState, LoadingState, Screen } from '../../src/components/Screen';
import { Sparkline } from '../../src/components/Sparkline';
import { colors, layout, radius, space, type } from '../../src/lib/theme';
import { useAsync } from '../../src/lib/useAsync';
import {
  formatDate,
  formatNumber,
  healthClassOf,
  healthScoreOf,
  ndviColor,
  relativeDate,
} from '../../src/lib/util';
import { getFarm, getSnapshots, mockApprove } from '../../src/services/api';
import { HealthClass, Snapshot } from '../../src/types';

export default function FarmDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [approving, setApproving] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    if (!id) return null;
    const farm = await getFarm(id);
    if (!farm) return null;
    const snapshots = await getSnapshots(farm.id);
    return { farm, snapshots };
  }, [id]);

  const farm = data?.farm;
  const snapshots = data?.snapshots ?? [];
  const latest: Snapshot | undefined = snapshots[snapshots.length - 1];
  const ndvi = latest?.indices.ndvi;
  const tone = ndvi !== undefined ? ndviColor(ndvi) : colors.accent;
  const chartWidth = width - layout.screenPadding * 2 - space.lg * 2;

  const handleSimulateApproval = async () => {
    if (!farm) return;
    setApproving(true);
    try {
      await mockApprove(farm.id);
      reload();
    } finally {
      setApproving(false);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <IconButton label="Back to my farms" onPress={() => router.back()}>
          <ChevronLeftIcon color={colors.text} />
        </IconButton>

        {loading && !data ? (
          <LoadingState label="Loading field..." />
        ) : !farm ? (
          <EmptyState
            title="Field not found"
            message="This field is no longer available on your account."
            action={<Button label="Back to my farms" onPress={() => router.replace('/(tabs)')} />}
            style={styles.notFound}
          />
        ) : (
          <>
            <View style={styles.titleBlock}>
              <Text style={type.display}>{farm.name}</Text>
              <Text style={styles.subtitle}>
                {farm.state} · {farm.cropType} · {formatNumber(farm.landSizeAcres, 1)} acres ·{' '}
                {farm.irrigationType} on {farm.soilType}
              </Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={farm.status} />
                {farm.status === 'active' ? <RiskBadge level={farm.riskLevel} /> : null}
              </View>
            </View>

            {farm.status === 'submitted' ? (
              <Banner
                tone="pending"
                title={`Submitted ${formatDate(farm.submittedAt)} — waiting for your insurer to review.`}
                message={`Sent ${relativeDate(farm.submittedAt)}. Satellite monitoring starts once this field is approved.`}
              />
            ) : null}

            {farm.status === 'rejected' ? (
              <Banner
                tone="rejected"
                title="Your insurer did not approve this field."
                message={
                  farm.reviewNote
                    ? `Reason: ${farm.reviewNote}\n\nContact your insurer to discuss it, or submit the field again with corrected details.`
                    : 'Contact your insurer to find out why, or submit the field again with corrected details.'
                }
              />
            ) : null}

            {farm.status === 'active' && latest && ndvi !== undefined ? (
              <>
                <Card style={styles.healthCard}>
                  <View style={styles.healthRow}>
                    <HealthRing score={healthScoreOf(ndvi)} />
                    <View style={styles.healthText}>
                      <Text style={type.label}>Health score</Text>
                      <Text style={styles.healthHeadline}>
                        {describeHealth(healthClassOf(ndvi))}
                      </Text>
                      <Text style={type.small}>
                        From the latest satellite pass on {formatDate(latest.captureDate)}.
                      </Text>
                    </View>
                  </View>
                </Card>

                <SectionLabel>Satellite view</SectionLabel>
                <Card flush>
                  <FarmMap
                    boundary={farm.boundary}
                    fillColor={tone}
                    strokeColor={colors.white}
                    height={240}
                  >
                    <View style={styles.mapOverlay} pointerEvents="box-none">
                      <MapOverlayPill>NDVI {ndvi.toFixed(2)}</MapOverlayPill>
                    </View>
                  </FarmMap>
                  <View style={styles.mapFooter}>
                    <SatelliteIcon size={18} color={colors.textMuted} />
                    <Text style={type.small}>
                      {latest.source} · updated {relativeDate(farm.lastImageUpdate)}
                    </Text>
                  </View>
                </Card>

                <SectionLabel>Vegetation indices</SectionLabel>
                <Card>
                  <View style={styles.tiles}>
                    <IndexTile
                      label="NDVI"
                      value={latest.indices.ndvi}
                      caption="Overall greenness and vigour"
                      tone={ndviColor(latest.indices.ndvi)}
                    />
                    <IndexTile
                      label="NDWI"
                      value={latest.indices.ndwi}
                      caption="Water content in the canopy"
                      tone="#3f83c4"
                    />
                    <IndexTile
                      label="NDRE"
                      value={latest.indices.ndre}
                      caption="Nitrogen and crop maturity"
                      tone="#7a5bb5"
                    />
                    <IndexTile
                      label="Soil"
                      value={latest.indices.soil}
                      caption="Exposed soil in the field"
                      tone="#b5541c"
                    />
                  </View>
                </Card>

                {snapshots.length > 1 && chartWidth > 0 ? (
                  <>
                    <SectionLabel>Season so far</SectionLabel>
                    <Card>
                      <Text style={[type.small, styles.chartCaption]}>
                        NDVI across {snapshots.length} satellite passes.
                      </Text>
                      <Sparkline snapshots={snapshots} width={chartWidth} />
                    </Card>
                  </>
                ) : null}

                <SectionLabel>Recent passes</SectionLabel>
                <Card>
                  {[...snapshots]
                    .reverse()
                    .slice(0, 5)
                    .map((snapshot, index, list) => (
                      <DetailRow
                        key={snapshot.id}
                        label={formatDate(snapshot.captureDate)}
                        last={index === list.length - 1}
                        value={
                          <View style={styles.snapshotValue}>
                            <Chip>{snapshot.source}</Chip>
                            <Text
                              style={[type.bodyStrong, { color: ndviColor(snapshot.indices.ndvi) }]}
                            >
                              {snapshot.indices.ndvi.toFixed(2)}
                            </Text>
                          </View>
                        }
                      />
                    ))}
                </Card>
              </>
            ) : null}

            {farm.status !== 'active' ? (
              <>
                <SectionLabel>Your boundary</SectionLabel>
                <Card flush>
                  <FarmMap
                    boundary={farm.boundary}
                    fillColor={colors.accent}
                    strokeColor={colors.white}
                    height={220}
                  />
                </Card>

                <EmptyState
                  icon={<ClockIcon size={28} color={colors.textFaint} />}
                  title="Monitoring begins after approval"
                  message="Once your insurer approves this field, satellite health scores and vegetation indices appear here."
                  style={styles.monitoringEmpty}
                />
              </>
            ) : null}

            <SectionLabel>Field details</SectionLabel>
            <Card>
              <DetailRow label="Crop" value={farm.cropType} />
              <DetailRow label="Soil" value={farm.soilType} />
              <DetailRow label="Irrigation" value={farm.irrigationType} />
              <DetailRow label="Land size" value={`${formatNumber(farm.landSizeAcres, 1)} acres`} />
              <DetailRow label="Boundary" value={`${farm.boundary.length} points`} />
              <DetailRow label="Submitted" value={formatDate(farm.submittedAt)} />
              <DetailRow
                label="Reviewed"
                value={farm.reviewedAt ? formatDate(farm.reviewedAt) : 'Not yet'}
                last
              />
            </Card>

            {farm.status === 'submitted' ? (
              <View style={styles.demoTools}>
                <Text style={styles.demoLabel}>Demo tool</Text>
                <Text style={type.small}>
                  In the real system your insurer approves this field from the admin panel. This
                  button stands in for that so you can see what happens next.
                </Text>
                <Button
                  label="Simulate insurer approval"
                  variant="secondary"
                  block
                  loading={approving}
                  onPress={handleSimulateApproval}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function describeHealth(healthClass: HealthClass): string {
  if (healthClass === 'Health') return 'This field is growing well.';
  if (healthClass === 'Distress') return 'This field is showing some stress.';
  return 'This field needs attention.';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, gap: space.md },
  notFound: { marginTop: space['3xl'] },
  titleBlock: { gap: space.sm, marginTop: space.md },
  subtitle: { ...type.body, color: colors.textMuted },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  healthCard: { marginTop: space.sm },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  healthText: { flex: 1, gap: space.sm },
  healthHeadline: { ...type.heading, fontSize: 16, lineHeight: 21 },
  mapOverlay: { ...StyleSheet.absoluteFill, padding: space.md },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  chartCaption: { marginBottom: space.md },
  snapshotValue: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  monitoringEmpty: { marginTop: space.md },
  demoTools: {
    marginTop: space['2xl'],
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  demoLabel: { ...type.label },
});
