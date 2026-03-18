import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../lib/themes';

interface ResultTile {
  label: string;
  value: string;
  type?: 'positive' | 'negative' | 'neutral';
}

interface ResultSectionProps {
  theme: Theme;
  mainLabel: string;
  mainValue: string;
  mainSub?: string;
  tiles?: ResultTile[];
  visible?: boolean;
}

export function ResultSection({ theme, mainLabel, mainValue, mainSub, tiles, visible = true }: ResultSectionProps) {
  if (!visible) return null;

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      {/* Main result header */}
      <View style={[styles.mainResult, { backgroundColor: theme.accent }]}>
        <Text style={styles.mainLabel}>{mainLabel}</Text>
        <Text style={styles.mainValue}>{mainValue}</Text>
        {mainSub ? <Text style={styles.mainSub}>{mainSub}</Text> : null}
      </View>

      {/* Result tiles grid */}
      {tiles && tiles.length > 0 && (
        <View style={styles.tilesGrid}>
          {tiles.map((tile, i) => (
            <View
              key={i}
              style={[styles.tile, { backgroundColor: theme.surface2, borderColor: theme.border }]}
            >
              <Text style={[styles.tileLabel, { color: theme.ink3 }]}>{tile.label}</Text>
              <Text
                style={[
                  styles.tileValue,
                  {
                    color:
                      tile.type === 'positive'
                        ? theme.green
                        : tile.type === 'negative'
                        ? theme.red
                        : theme.ink,
                  },
                ]}
              >
                {tile.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    borderTopWidth: 1.5,
    paddingTop: 20,
  },
  mainResult: {
    borderRadius: 11,
    padding: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mainLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
  },
  mainValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  mainSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    fontWeight: '500',
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    minWidth: '47%',
    flexGrow: 1,
    flexBasis: '47%',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  tileValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
