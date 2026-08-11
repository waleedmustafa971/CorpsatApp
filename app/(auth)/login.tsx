import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '../../src/components/Banner';
import { BrandMark } from '../../src/components/BrandMark';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { SatelliteIcon } from '../../src/components/Icons';
import { Screen } from '../../src/components/Screen';
import { colors, radius, space, type } from '../../src/lib/theme';
import { formatPhoneInput } from '../../src/lib/util';
import { ApiError, requestOtp } from '../../src/services/api';
import { DEMO_PHONE } from '../../src/services/seed';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('+249 ');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const digits = phone.replace(/[^\d]/g, '');
  const canSubmit = digits.length >= 9 && !submitting;

  const handleSubmit = async () => {
    setError(undefined);
    setSubmitting(true);
    try {
      await requestOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + space['4xl'], paddingBottom: insets.bottom + space['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandMark size={56} />
            <View style={styles.headerText}>
              <Text style={type.display}>Sign in to Cropsat</Text>
              <Text style={styles.subtitle}>Enter your registered phone number</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Field
              label="Phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(formatPhoneInput(text));
                if (error) setError(undefined);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              placeholder="+249 900 000 000"
              error={error}
              hint={error ? undefined : 'The number your insurer registered for you.'}
              returnKeyType="go"
              onSubmitEditing={() => canSubmit && handleSubmit()}
            />

            <Button
              label="Send code"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Use the demo number ${DEMO_PHONE}`}
            onPress={() => {
              setPhone(DEMO_PHONE);
              setError(undefined);
            }}
            style={({ pressed }) => [styles.demo, pressed && { backgroundColor: colors.accentSoft }]}
          >
            <SatelliteIcon size={20} color={colors.accentDark} />
            <View style={styles.demoText}>
              <Text style={styles.demoTitle}>Demo account</Text>
              <Text style={type.small}>Tap to fill {DEMO_PHONE}</Text>
            </View>
          </Pressable>

          <View style={styles.spacer} />

          <Banner
            tone="info"
            title="Satellite-verified fields"
            message="Register your field once and your insurer monitors its health from space — no field visit needed."
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    gap: space['2xl'],
  },
  header: { gap: space.xl },
  headerText: { gap: space.sm },
  subtitle: { ...type.body, color: colors.textMuted },
  form: { gap: space.xl },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  demoText: { flex: 1, gap: 2 },
  demoTitle: { ...type.bodyStrong, fontSize: 14 },
  spacer: { flex: 1, minHeight: space.xl },
});
