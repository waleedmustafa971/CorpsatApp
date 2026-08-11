import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '../../src/components/BrandMark';
import { Button, IconButton } from '../../src/components/Button';
import { ChevronLeftIcon } from '../../src/components/Icons';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/lib/session';
import { colors, fonts, radius, space, type } from '../../src/lib/theme';
import { ApiError, requestOtp } from '../../src/services/api';

const CODE_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (value = code) => {
    if (!phone) {
      router.replace('/(auth)/login');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await signIn(phone, value);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code did not work. Try again.');
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!phone || cooldown > 0) return;
    setNotice(undefined);
    try {
      await requestOtp(phone);
      setNotice('Code sent again.');
      setCooldown(30);
    } catch {
      setNotice('Could not resend right now.');
    }
  };

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(undefined);
    if (digits.length === CODE_LENGTH) {
      // Auto-submit the moment the code is complete.
      void handleVerify(digits);
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
            { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconButton label="Go back" onPress={() => router.back()}>
            <ChevronLeftIcon color={colors.text} />
          </IconButton>

          <View style={styles.header}>
            <BrandMark size={48} />
            <View style={styles.headerText}>
              <Text style={type.title}>Enter your code</Text>
              <Text style={styles.subtitle}>
                We sent a {CODE_LENGTH}-digit code to{'\n'}
                <Text style={styles.phone}>{phone ?? 'your phone'}</Text>
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter verification code"
            onPress={() => inputRef.current?.focus()}
            style={styles.boxes}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const char = code[index];
              const isCursor = focused && index === code.length;
              return (
                <View
                  key={index}
                  style={[
                    styles.box,
                    (isCursor || !!char) && styles.boxActive,
                    !!error && styles.boxError,
                  ]}
                >
                  <Text style={styles.boxText}>{char ?? ''}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            caretHidden
            style={styles.hiddenInput}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Verify"
            onPress={() => handleVerify()}
            loading={submitting}
            disabled={code.length === 0}
          />

          <View style={styles.resendRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handleResend}
              disabled={cooldown > 0}
              hitSlop={8}
            >
              <Text style={[styles.resend, cooldown > 0 && styles.resendDisabled]}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </Text>
            </Pressable>
            {notice ? <Text style={type.small}>{notice}</Text> : null}
          </View>

          <View style={styles.spacer} />

          <View style={styles.demoNote}>
            <Text style={type.small}>Demo: any code works.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space.xl, gap: space.xl },
  header: { gap: space.lg, marginTop: space.md },
  headerText: { gap: space.sm },
  subtitle: { ...type.body, color: colors.textMuted },
  phone: { fontFamily: fonts.bodySemi, color: colors.text },
  boxes: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, maxWidth: 420 },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    maxWidth: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.accent },
  boxError: { borderColor: colors.rejectedFg },
  boxText: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.text },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
    top: 0,
    left: 0,
  },
  error: { ...type.small, color: colors.rejectedFg },
  resendRow: { alignItems: 'center', gap: space.xs },
  resend: { ...type.bodyStrong, fontSize: 14, color: colors.accentDark },
  resendDisabled: { color: colors.textFaint },
  spacer: { flex: 1, minHeight: space.lg },
  demoNote: { alignItems: 'center' },
});
