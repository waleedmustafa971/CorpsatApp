import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { CheckIcon } from '../../src/components/Icons';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/lib/session';
import { colors, radius, space, type } from '../../src/lib/theme';
import { BoundaryStep } from '../../src/screens/AddFarm/BoundaryStep';
import {
  DetailsErrors,
  DetailsStep,
  FarmDetailsForm,
} from '../../src/screens/AddFarm/DetailsStep';
import { ReviewStep } from '../../src/screens/AddFarm/ReviewStep';
import { StepHeader } from '../../src/screens/AddFarm/StepHeader';
import { ApiError, createFarmSubmission } from '../../src/services/api';
import { Farm, LatLng, STATE_CENTERS, StateName } from '../../src/types';

const STEP_COPY = [
  { title: 'Draw your field', subtitle: 'Mark the corners of the field you want insured.' },
  { title: 'Field details', subtitle: 'Tell your insurer what you grow and how you water it.' },
  { title: 'Review & submit', subtitle: 'Check everything before it goes for review.' },
];

const EMPTY_FORM: FarmDetailsForm = {
  name: '',
  landSizeAcres: '',
  state: null,
  cropType: null,
  irrigationType: null,
  soilType: null,
};

export default function AddFarmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { farmer } = useSession();
  const scrollRef = useRef<ScrollView>(null);

  const farmerState = (farmer?.state as StateName) ?? 'Gedaref';

  const [step, setStep] = useState(0);
  const [boundary, setBoundary] = useState<LatLng[]>([]);
  const [center, setCenter] = useState<LatLng>(STATE_CENTERS[farmerState] ?? STATE_CENTERS.Gedaref);
  const [form, setForm] = useState<FarmDetailsForm>({ ...EMPTY_FORM, state: farmerState });
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState<Farm | null>(null);

  const reset = useCallback(() => {
    setStep(0);
    setBoundary([]);
    setForm({ ...EMPTY_FORM, state: farmerState });
    setErrors({});
    setSubmitError(undefined);
    setSubmitted(null);
  }, [farmerState]);

  // Coming back to the tab after a submission starts a fresh draft. The flag
  // lives in a ref so it stays out of the focus effect's deps — including it
  // would re-run the effect (and wipe the success panel) the instant we submit.
  const hasSubmitted = useRef(false);
  useEffect(() => {
    hasSubmitted.current = submitted !== null;
  }, [submitted]);

  useFocusEffect(
    useCallback(() => {
      if (hasSubmitted.current) reset();
    }, [reset]),
  );

  const goToStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleChange = <K extends keyof FarmDetailsForm>(key: K, value: FarmDetailsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateDetails = (): boolean => {
    const next: DetailsErrors = {};
    if (!form.name.trim()) next.name = 'Give this field a name.';
    const acres = Number(form.landSizeAcres);
    if (!form.landSizeAcres.trim()) next.landSizeAcres = 'Enter the land size.';
    else if (!Number.isFinite(acres) || acres <= 0) next.landSizeAcres = 'Enter a number greater than 0.';
    if (!form.state) next.state = 'Choose a region.';
    if (!form.cropType) next.cropType = 'Choose a crop.';
    if (!form.irrigationType) next.irrigationType = 'Choose an irrigation method.';
    if (!form.soilType) next.soilType = 'Choose a soil type.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!farmer) return;
    setSubmitError(undefined);
    setSubmitting(true);
    try {
      const farm = await createFarmSubmission({
        name: form.name.trim(),
        boundary,
        landSizeAcres: Number(form.landSizeAcres),
        state: form.state!,
        cropType: form.cropType!,
        soilType: form.soilType!,
        irrigationType: form.irrigationType!,
        farmerId: farmer.id,
        source: 'app',
      });
      setSubmitted(farm);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Could not submit right now. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + space.lg, paddingBottom: space['4xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitted ? (
            <SuccessPanel
              farm={submitted}
              onViewFarm={() => {
                const id = submitted.id;
                reset();
                router.push({ pathname: '/farm/[id]', params: { id } });
              }}
              onDone={() => {
                reset();
                router.push('/(tabs)');
              }}
            />
          ) : (
            <>
              <StepHeader
                step={step}
                total={3}
                title={STEP_COPY[step].title}
                subtitle={STEP_COPY[step].subtitle}
                onBack={step > 0 ? () => goToStep(step - 1) : undefined}
              />

              {step === 0 ? (
                <BoundaryStep
                  boundary={boundary}
                  center={center}
                  onAddPoint={(point) => setBoundary((prev) => [...prev, point])}
                  onSetBoundary={setBoundary}
                  onUndo={() => setBoundary((prev) => prev.slice(0, -1))}
                  onClear={() => setBoundary([])}
                  onCenterChange={setCenter}
                  onContinue={() => goToStep(1)}
                />
              ) : null}

              {step === 1 ? (
                <DetailsStep
                  form={form}
                  errors={errors}
                  boundary={boundary}
                  onChange={handleChange}
                  onContinue={() => {
                    if (validateDetails()) goToStep(2);
                  }}
                />
              ) : null}

              {step === 2 ? (
                <ReviewStep
                  form={form}
                  boundary={boundary}
                  submitting={submitting}
                  error={submitError}
                  onSubmit={handleSubmit}
                  onEditDetails={() => goToStep(1)}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SuccessPanel({
  farm,
  onViewFarm,
  onDone,
}: {
  farm: Farm;
  onViewFarm: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.success}>
      <View style={styles.successMark}>
        <CheckIcon size={34} color={colors.white} strokeWidth={2.4} />
      </View>
      <Text style={[type.title, styles.successTitle]}>Submitted!</Text>
      <Text style={styles.successBody}>
        Your insurer will review <Text style={styles.successName}>{farm.name}</Text>. You will see
        the status update here — monitoring begins once it is approved.
      </Text>

      <Card style={styles.successCard}>
        <Text style={type.label}>What happens next</Text>
        <View style={styles.steps}>
          <SuccessStep index={1} text="Your insurer reviews the boundary and details." />
          <SuccessStep index={2} text="If approved, the field switches to Active." />
          <SuccessStep index={3} text="Satellite health scores start appearing." last />
        </View>
      </Card>

      <View style={styles.successActions}>
        <Button label="View this field" onPress={onViewFarm} />
        <Button label="Back to my farms" variant="secondary" block onPress={onDone} />
      </View>
    </View>
  );
}

function SuccessStep({ index, text, last = false }: { index: number; text: string; last?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepMarker}>
        <Text style={styles.stepIndex}>{index}</Text>
        {!last ? <View style={styles.stepLine} /> : null}
      </View>
      <Text style={[type.small, styles.stepText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, gap: space.xl },
  success: { alignItems: 'center', gap: space.md, paddingTop: space['3xl'] },
  successMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  successTitle: { textAlign: 'center' },
  successBody: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  successName: { color: colors.text },
  successCard: { alignSelf: 'stretch', marginTop: space.lg, gap: space.lg },
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: space.md },
  stepMarker: { alignItems: 'center', width: 24 },
  stepIndex: {
    ...type.badge,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    color: colors.accentDark,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  stepLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginVertical: 4 },
  stepText: { flex: 1, paddingBottom: space.lg, marginTop: 3 },
  successActions: { alignSelf: 'stretch', gap: space.md, marginTop: space.lg },
  successPlaceholder: { borderRadius: radius.lg },
});
