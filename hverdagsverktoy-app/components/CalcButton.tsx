import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../lib/themes';

interface CalcButtonProps {
  title: string;
  onPress: () => void;
  theme: Theme;
  style?: ViewStyle;
}

export function CalcButton({ title, onPress, theme, style }: CalcButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.accent }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.1,
  },
});
