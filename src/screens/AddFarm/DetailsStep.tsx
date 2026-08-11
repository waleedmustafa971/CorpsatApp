import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Select } from '../../components/Select';
import { areaInAcres } from '../../lib/geo';
import { colors, space, type } from '../../lib/theme';
import { formatNumber } from '../../lib/util';
import {
  CROP_TYPES,
  CropType,
  IRRIGATION_TYPES,
  IrrigationType,
  LatLng,
  SOIL_TYPES,
  SoilType,
  STATES,
  StateName,
} from '../../types';

export interface FarmDetailsForm {
  name: string;
  landSizeAcres: string;
  state: StateName | null;
  cropType: CropType | null;
  irrigationType: IrrigationType | null;
  soilType: SoilType | null;
}

export type DetailsErrors = Partial<Record<keyof FarmDetailsForm, string>>;

interface Props {
  form: FarmDetailsForm;
  errors: DetailsErrors;
  boundary: LatLng[];
  onChange: <K extends keyof FarmDetailsForm>(key: K, value: FarmDetailsForm[K]) => void;
  onContinue: () => void;
}

export function DetailsStep({ form, errors, boundary, onChange, onContinue }: Props) {
  const measured = areaInAcres(boundary);

  return (
    <View style={styles.container}>
      <Field
        label="Farm name"
        value={form.name}
        onChangeText={(value) => onChange('name', value)}
        placeholder="e.g. North Gedaref Block"
        error={errors.name}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <Field
        label="Land size (acres)"
        value={form.landSizeAcres}
        onChangeText={(value) => onChange('landSizeAcres', value.replace(/[^\d.]/g, ''))}
        placeholder="0.0"
        keyboardType="decimal-pad"
        error={errors.landSizeAcres}
        suffix={
          measured > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Use the measured area, ${formatNumber(measured, 1)} acres`}
              onPress={() => onChange('landSizeAcres', measured.toFixed(1))}
              hitSlop={8}
            >
              <Text style={styles.autoFill}>Use {formatNumber(measured, 1)}</Text>
            </Pressable>
          ) : undefined
        }
        hint={
          measured > 0
            ? `Measured from your boundary: ${formatNumber(measured, 1)} acres.`
            : undefined
        }
      />

      <Select
        label="Region / State"
        value={form.state}
        options={STATES}
        onChange={(value) => onChange('state', value)}
        error={errors.state}
      />

      <Select
        label="Crop type"
        value={form.cropType}
        options={CROP_TYPES}
        onChange={(value) => onChange('cropType', value)}
        error={errors.cropType}
      />

      <Select
        label="Irrigation"
        value={form.irrigationType}
        options={IRRIGATION_TYPES}
        onChange={(value) => onChange('irrigationType', value)}
        error={errors.irrigationType}
      />

      <Select
        label="Soil type"
        value={form.soilType}
        options={SOIL_TYPES}
        onChange={(value) => onChange('soilType', value)}
        error={errors.soilType}
      />

      <Button label="Review submission" onPress={onContinue} style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xl },
  autoFill: { ...type.bodyStrong, fontSize: 13, color: colors.accentDark },
  submit: { marginTop: space.xs },
});
