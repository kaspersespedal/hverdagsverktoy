import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Theme } from '../lib/themes';

interface FormInputProps extends TextInputProps {
  label: string;
  theme: Theme;
  half?: boolean;
}

export function FormInput({ label, theme, half, style, ...props }: FormInputProps) {
  return (
    <View style={[styles.container, half && styles.half]}>
      <Text style={[styles.label, { color: theme.ink2 }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surface2,
            borderColor: theme.border,
            color: theme.ink,
          },
          style,
        ]}
        placeholderTextColor={theme.ink3}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 9,
    padding: 10,
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: '500',
  },
});
