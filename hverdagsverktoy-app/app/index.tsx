import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { ThemePicker } from '../components/ThemePicker';
import { LanguagePicker } from '../components/LanguagePicker';

export default function DashboardScreen() {
  const { theme, themeKey, setThemeKey, region, setRegionKey, r } = useApp();
  const router = useRouter();

  const tools = [
    { name: r.tabBasic, desc: r.dashDescBasic, route: '/calculator' as const },
    { name: r.tabMor, desc: r.dashDescMor, route: '/mortgage' as const },
    { name: r.tabSal, desc: r.dashDescSal, route: '/tax' as const },
    { name: r.tabVat, desc: r.dashDescVat, route: '/vat' as const },
    { name: r.tabNpv, desc: r.dashDescNpv, route: '/analysis' as const },
  ];

  const taxRates = [
    [r.drTax1, '22 %'],
    [r.drTax2, '7,6 %'],
    [r.drTax3, '1,7 %'],
    [r.drTax4, '4,0 %'],
    [r.drTax5, '13,7 %'],
  ];

  const vatRates = [
    [r.drVat1, '25 %'],
    [r.drVat2, '15 %'],
    [r.drVat3, '12 %'],
    [r.drVat4, '0 %'],
  ];

  const deductions = [
    [r.drDed1, '114 540 kr'],
    [r.drDed2, '95 700 kr'],
    [r.drDed3, '7 700 kr'],
    [r.drDed4, '22 %'],
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.ink }]}>Hverdagsverktoy</Text>
          <LanguagePicker
            currentRegion={region}
            onSelect={setRegionKey}
            theme={theme}
          />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroRule, { backgroundColor: theme.accentLight }]} />
          <Text style={[styles.heroTitle, { color: theme.ink }]}>
            Hverdagsverktoy
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.ink3 }]}>
            {r.tabBasic}, {r.tabMor}, {r.tabSal}, {r.tabVat}
          </Text>
          <View style={[styles.heroRule, { backgroundColor: theme.accentLight }]} />
        </View>

        {/* Theme Picker */}
        <ThemePicker
          currentTheme={themeKey}
          onSelect={setThemeKey}
          theme={theme}
          r={r}
        />

        {/* Tools Grid */}
        <Text style={[styles.sectionTitle, { color: theme.ink3 }]}>
          {r.dashToolsTitle}
        </Text>
        <View style={styles.toolsGrid}>
          {tools.map((tool, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(tool.route)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolName, { color: theme.ink }]}>{tool.name}</Text>
              <Text style={[styles.toolDesc, { color: theme.ink3 }]}>{tool.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Reference */}
        <View style={styles.refSection}>
          <RefCard title={r.dashRefTax} rows={taxRates} theme={theme} />
          <RefCard title={r.dashRefVat} rows={vatRates} theme={theme} />
          <RefCard title={r.dashRefDed} rows={deductions} theme={theme} />
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.ink3 }]}>
          {r.footerCopy}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RefCard({ title, rows, theme }: { title: string; rows: string[][]; theme: any }) {
  return (
    <View style={[styles.refCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.refHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.border }]}>
        <Text style={[styles.refHeaderText, { color: theme.ink2 }]}>{title}</Text>
      </View>
      {rows.map(([label, value], i) => (
        <View
          key={i}
          style={[styles.refRow, i < rows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
        >
          <Text style={[styles.refLabel, { color: theme.ink2 }]}>{label}</Text>
          <Text style={[styles.refValue, { color: theme.ink }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  heroRule: {
    width: 48,
    height: 2,
    borderRadius: 2,
    opacity: 0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginVertical: 12,
  },
  heroSubtitle: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  toolsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  toolCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  toolDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  refSection: {
    gap: 14,
    marginBottom: 24,
  },
  refCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  refHeader: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  refHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  refLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  refValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
