import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { themes, themeKeys, Theme } from '../lib/themes';
import { RegionStrings } from '../lib/i18n/regions';

interface ThemePickerProps {
  currentTheme: string;
  onSelect: (key: string) => void;
  theme: Theme;
  r: RegionStrings;
}

const themeNameMap: Record<string, keyof RegionStrings> = {
  frost: 'themeFrost',
  blue: 'themeBlue',
  dark: 'themeDark',
  glass: 'themeGlass',
  corporate: 'themeCorporate',
  pink: 'themePink',
  purple: 'themePurple',
  green: 'themeGreen',
  peach: 'themePeach',
  minimal: 'themeFrost',
};

export function ThemePicker({ currentTheme, onSelect, theme, r }: ThemePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.ink3 }]}>
        {r.themeLabel || 'Theme'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {themeKeys.map((key) => {
          const t = themes[key];
          const isActive = key === currentTheme;
          const nameKey = themeNameMap[key] || 'themeFrost';
          const displayName = (r as any)[nameKey] || key;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelect(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? t.accent : theme.surface2,
                  borderColor: isActive ? t.accent : theme.border,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: t.accent }]} />
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#fff' : theme.ink2 },
                ]}
              >
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
