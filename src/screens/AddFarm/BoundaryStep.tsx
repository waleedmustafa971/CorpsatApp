import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../../components/Banner';
import { Button, IconButton } from '../../components/Button';
import { FarmMap, NATIVE_MAPS_AVAILABLE } from '../../components/FarmMap';
import { Field } from '../../components/Field';
import { TargetIcon, TrashIcon, UndoIcon } from '../../components/Icons';
import { areaInAcres, boundaryToText, parseBoundaryText } from '../../lib/geo';
import { colors, radius, space, type } from '../../lib/theme';
import { formatNumber } from '../../lib/util';
import { LatLng } from '../../types';

interface Props {
  boundary: LatLng[];
  center: LatLng;
  onAddPoint: (point: LatLng) => void;
  onSetBoundary: (boundary: LatLng[]) => void;
  onUndo: () => void;
  onClear: () => void;
  onCenterChange: (center: LatLng) => void;
  onContinue: () => void;
}

export function BoundaryStep({
  boundary,
  center,
  onAddPoint,
  onSetBoundary,
  onUndo,
  onClear,
  onCenterChange,
  onContinue,
}: Props) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualError, setManualError] = useState<string | undefined>();
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | undefined>();

  const enough = boundary.length >= 3;
  const acres = enough ? areaInAcres(boundary) : 0;
  const remaining = Math.max(0, 3 - boundary.length);

  const handleLocate = async () => {
    setLocating(true);
    setLocationNote(undefined);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationNote('Location permission denied. Pan the map to your field instead.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onCenterChange([position.coords.longitude, position.coords.latitude]);
      setLocationNote('Map centred on your current location.');
    } catch {
      setLocationNote('Could not read your location right now.');
    } finally {
      setLocating(false);
    }
  };

  const handleManualApply = () => {
    const { boundary: parsed, error } = parseBoundaryText(manualText);
    if (error) {
      setManualError(error);
      return;
    }
    setManualError(undefined);
    onSetBoundary(parsed);
    setManualOpen(false);
  };

  const openManual = () => {
    setManualText(boundary.length ? boundaryToText(boundary) : '');
    setManualError(undefined);
    setManualOpen(true);
  };

  return (
    <View style={styles.container}>
      <Banner
        tone="info"
        title="Tap the map to place the corners of your field."
        message={
          NATIVE_MAPS_AVAILABLE
            ? 'Place a point at each corner, going around the field in order. At least 3 points.'
            : 'Satellite imagery is unavailable here, so the map shows a coordinate grid. Tapping still records real coordinates.'
        }
      />

      <View style={styles.mapWrap}>
        <FarmMap
          boundary={boundary}
          center={center}
          fillColor={colors.accent}
          strokeColor={colors.white}
          editable
          onAddPoint={onAddPoint}
          height={340}
        >
          <View style={styles.mapOverlay} pointerEvents="box-none">
            <View style={styles.counter}>
              <Text style={styles.counterValue}>{boundary.length}</Text>
              <Text style={styles.counterLabel}>
                {boundary.length === 1 ? 'point' : 'points'}
                {enough ? ` · ${formatNumber(acres, 1)} acres` : ''}
              </Text>
            </View>

            <View style={styles.tools}>
              <IconButton
                label="Undo last point"
                onPress={onUndo}
                disabled={boundary.length === 0}
                tone="imagery"
              >
                <UndoIcon color={colors.text} />
              </IconButton>
              <IconButton
                label="Clear all points"
                onPress={onClear}
                disabled={boundary.length === 0}
                tone="imagery"
              >
                <TrashIcon color={colors.text} />
              </IconButton>
              <IconButton
                label="Use my current location"
                onPress={handleLocate}
                disabled={locating}
                tone="imagery"
              >
                <TargetIcon color={colors.text} />
              </IconButton>
            </View>
          </View>
        </FarmMap>
      </View>

      {locationNote ? <Text style={type.small}>{locationNote}</Text> : null}

      {manualOpen ? (
        <View style={styles.manual}>
          <Field
            label="Paste coordinates"
            value={manualText}
            onChangeText={(text) => {
              setManualText(text);
              if (manualError) setManualError(undefined);
            }}
            placeholder="35.38,14.03 | 35.39,14.03 | 35.39,14.04"
            multiline
            numberOfLines={3}
            autoCapitalize="none"
            error={manualError}
            hint="Format: lon,lat separated by | - same as the web panel."
            inputStyle={styles.manualInput}
          />
          <View style={styles.manualActions}>
            <Button label="Cancel" variant="ghost" size="sm" onPress={() => setManualOpen(false)} />
            <Button label="Use these points" size="sm" block={false} onPress={handleManualApply} />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={openManual}
          hitSlop={8}
          style={styles.manualLink}
        >
          <Text style={styles.manualLinkText}>Enter coordinates manually instead</Text>
        </Pressable>
      )}

      <Button
        label={enough ? 'Continue' : `Place ${remaining} more point${remaining === 1 ? '' : 's'}`}
        onPress={onContinue}
        disabled={!enough}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.lg },
  mapWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    padding: space.md,
    justifyContent: 'space-between',
  },
  counter: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  counterValue: { ...type.bodyStrong, fontSize: 15 },
  counterLabel: { ...type.small, fontSize: 12 },
  tools: { flexDirection: 'row', gap: space.sm, alignSelf: 'flex-start' },
  manual: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  manualInput: { minHeight: 72, textAlignVertical: 'top' },
  manualActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  manualLink: { alignSelf: 'flex-start' },
  manualLinkText: { ...type.bodyStrong, fontSize: 14, color: colors.accentDark },
});
