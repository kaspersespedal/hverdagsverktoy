import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../lib/themes';

interface CalcCardProps {
  title: string;
  description?: string;
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CalcCard({ title, description, theme, children, style }: CalcCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
        {description ? (
          <Text style={[styles.desc, { color: theme.ink3 }]}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  body: {
    padding: 20,
  },
});
