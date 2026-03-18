import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { CalcCard } from '../components/CalcCard';
import { FormInput } from '../components/FormInput';
import { CalcButton } from '../components/CalcButton';
import { ResultSection } from '../components/ResultSection';
import { PickerSelect } from '../components/PickerSelect';
import { calcSalary, SalaryResult } from '../lib/calculations/salary';
import { fmt, pct, parseNum } from '../lib/format';

export default function TaxScreen() {
  const { theme, r } = useApp();

  const [gross, setGross] = useState('800 000');
  const [taxClass, setTaxClass] = useState('1');
  const [almRate, setAlmRate] = useState('0.22');
  const [result, setResult] = useState<SalaryResult | null>(null);

  const handleCalc = () => {
    const g = parseNum(gross);
    const res = calcSalary(g, taxClass, parseFloat(almRate), 'no', {
      trinn1: r.trinnLabel1,
      trinn2: r.trinnLabel2,
      trinn3: r.trinnLabel3,
      trinn4: r.trinnLabel4,
      trinn5: r.trinnLabel5,
      almSkatt: r.almSkattLabel,
    });
    setResult(res);
  };

  const classOptions = (r.salClasses || []).map(([val, label]) => ({ value: val, label }));
  const regionOptions = (r.salRegions || []).map(([val, label]) => ({ value: val, label }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CalcCard title={r.salTitle} description={r.salDesc} theme={theme}>
          <FormInput
            label={r.lGross}
            value={gross}
            onChangeText={setGross}
            keyboardType="numeric"
            theme={theme}
          />
          <PickerSelect
            label={r.lClass}
            options={classOptions}
            selectedValue={taxClass}
            onValueChange={setTaxClass}
            theme={theme}
          />
          <PickerSelect
            label={r.lReg}
            options={regionOptions}
            selectedValue={almRate}
            onValueChange={setAlmRate}
            theme={theme}
          />
          <CalcButton title={r.btnCalc} onPress={handleCalc} theme={theme} />

          {result && (
            <ResultSection
              theme={theme}
              mainLabel={r.salRNet}
              mainValue={fmt(result.net)}
              mainSub={fmt(result.monthly) + r.mo}
              tiles={[
                { label: r.salRTax, value: fmt(result.totalTax) },
                { label: r.salREff, value: pct(result.effectiveRate) },
                { label: r.salRSoc, value: fmt(result.socialSecurity) },
                { label: r.salRDay, value: fmt(result.daily) },
              ]}
            />
          )}

          {/* Trinnskatt breakdown */}
          {result && result.trinnBreakdown.length > 0 && (
            <View style={[styles.trinnSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.trinnTitle, { color: theme.ink2 }]}>
                {r.trinnLabel1 ? 'Trinnskatt / Bracket Tax' : 'Tax Breakdown'}
              </Text>
              <View style={styles.trinnGrid}>
                {result.trinnBreakdown.map((t, i) => (
                  <View
                    key={i}
                    style={[styles.trinnTile, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                  >
                    <Text style={[styles.trinnLabel, { color: theme.ink3 }]}>
                      {t.label} ({(t.rate * 100).toFixed(1)}%)
                    </Text>
                    <Text style={[styles.trinnValue, { color: theme.ink }]}>
                      {fmt(t.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </CalcCard>

        {/* Tax reference info */}
        {r.salInfoRows && r.salInfoRows.length > 0 && (
          <CalcCard title={r.salTitle + ' - Reference'} theme={theme}>
            {r.salInfoRows.map(([label, value], i) => (
              <View
                key={i}
                style={[styles.infoRow, i < r.salInfoRows.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              >
                <Text style={[styles.infoLabel, { color: theme.ink3 }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.ink }]}>{value}</Text>
              </View>
            ))}
          </CalcCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  trinnSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
  },
  trinnTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  trinnGrid: {
    gap: 8,
  },
  trinnTile: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1.5,
  },
  trinnLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  trinnValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
