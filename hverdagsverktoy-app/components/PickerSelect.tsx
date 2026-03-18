import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Theme } from '../lib/themes';

interface Option {
  label: string;
  value: string;
}

interface PickerSelectProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  theme: Theme;
}

export function PickerSelect({ label, options, selectedValue, onValueChange, theme }: PickerSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === selectedValue);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.ink2 }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.surface2, borderColor: theme.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.selectorText, { color: theme.ink }]} numberOfLines={1}>
          {selected?.label || 'Select...'}
        </Text>
        <Text style={[styles.chevron, { color: theme.ink3 }]}>{'\u25BC'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === selectedValue && { backgroundColor: theme.surface2 },
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: item.value === selectedValue ? theme.accent : theme.ink },
                    ]}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 9,
    padding: 10,
    paddingHorizontal: 13,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 10,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1.5,
    maxHeight: '60%',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
