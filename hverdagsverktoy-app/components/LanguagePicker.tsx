import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Pressable } from 'react-native';
import { REGIONS, regionKeys } from '../lib/i18n/regions';
import { Theme } from '../lib/themes';

interface LanguagePickerProps {
  currentRegion: string;
  onSelect: (key: string) => void;
  theme: Theme;
}

const mainLanguages = ['no', 'en'];
const norwayLanguages = ['pl', 'uk', 'ar', 'lt', 'so', 'ti'];
const intlLanguages = ['zh', 'fr'];

export function LanguagePicker({ currentRegion, onSelect, theme }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const current = REGIONS[currentRegion];

  const renderSection = (title: string, keys: string[]) => (
    <View key={title}>
      <Text style={[styles.groupLabel, { color: theme.ink3 }]}>{title}</Text>
      {keys.filter(k => REGIONS[k]).map((key) => {
        const r = REGIONS[key];
        const isActive = key === currentRegion;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              isActive && { backgroundColor: theme.surface2 },
            ]}
            onPress={() => {
              onSelect(key);
              setOpen(false);
            }}
          >
            <Text style={styles.flag}>{r.flag}</Text>
            <Text
              style={[
                styles.optionText,
                { color: isActive ? theme.accent : theme.ink },
                isActive && { fontWeight: '700' },
              ]}
            >
              {r.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.surface2, borderColor: theme.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectorFlag}>{current?.flag}</Text>
        <Text style={[styles.selectorText, { color: theme.ink }]}>{current?.name}</Text>
        <Text style={[styles.chevron, { color: theme.ink3 }]}>{'  \u25BC'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <FlatList
              data={[
                { title: 'Main', keys: mainLanguages },
                { title: 'Languages in Norway', keys: norwayLanguages },
                { title: 'International', keys: intlLanguages },
              ]}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => renderSection(item.title, item.keys)}
              ItemSeparatorComponent={() => (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  selectorFlag: {
    fontSize: 15,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1.5,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 300,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  flag: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
