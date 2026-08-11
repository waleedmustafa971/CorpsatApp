import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Card, DetailRow } from '../../components/Card';
import { FarmMap } from '../../components/FarmMap';
import { colors, space, type } from '../../lib/theme';
import { formatNumber } from '../../lib/util';
import { LatLng } from '../../types';
import { FarmDetailsForm } from './DetailsStep';

interface Props {
  form: FarmDetailsForm;
  boundary: LatLng[];
  submitting: boolean;
  error?: string;
  onSubmit: () => void;
  onEditDetails: () => void;
}

export function ReviewStep({ form, boundary, submitting, error, onSubmit, onEditDetails }: Props) {
  return (
    <View style={styles.container}>
      <Card flush>
        <FarmMap
          boundary={boundary}
          fillColor={colors.accent}
          strokeColor={colors.white}
          height={190}
          interactive={false}
          showVertices={false}
        />
        <View style={styles.mapFooter}>
          <Text style={type.label}>Boundary</Text>
          <Text style={type.small}>{boundary.length} points</Text>
        </View>
      </Card>

      <Card>
        <DetailRow label="Farm name" value={form.name.trim()} />
        <DetailRow label="Land size" value={`${formatNumber(Number(form.landSizeAcres) || 0, 1)} acres`} />
        <DetailRow label="Region" value={form.state ?? '—'} />
        <DetailRow label="Crop" value={form.cropType ?? '—'} />
        <DetailRow label="Irrigation" value={form.irrigationType ?? '—'} />
        <DetailRow label="Soil" value={form.soilType ?? '—'} last />
      </Card>

      <Button label="Edit details" variant="secondary" block onPress={onEditDetails} />

      <Banner
        tone="pending"
        title="This goes to your insurer for review."
        message="Once approved, satellite monitoring begins and you will see a health score for this field."
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Submit for review" onPress={onSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.lg },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  error: { ...type.small, color: colors.rejectedFg },
});
