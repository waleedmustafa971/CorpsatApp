import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, radius, space, type } from '../lib/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  suffix?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Field({
  label,
  hint,
  error,
  suffix,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          {...inputProps}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, inputStyle]}
        />
        {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  label: { marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    minHeight: 50,
  },
  focused: { borderColor: colors.accent, backgroundColor: colors.white },
  errored: { borderColor: colors.rejectedFg },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: space.md,
  },
  suffix: { marginLeft: space.sm },
  hint: { ...type.small, marginLeft: 2 },
  error: { ...type.small, color: colors.rejectedFg, marginLeft: 2 },
});
