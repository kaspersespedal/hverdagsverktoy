import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { CalcCard } from '../components/CalcCard';
import { FormInput } from '../components/FormInput';
import { CalcButton } from '../components/CalcButton';
import { ResultSection } from '../components/ResultSection';
import { PickerSelect } from '../components/PickerSelect';
import { calcVat, VatResult, calcAdjustment, AdjResult } from '../lib/calculations/vat';
import { fmt, pct, parseNum } from '../lib/format';

export default function VatScreen() {
  const { theme, r } = useApp();

  // VAT calculator
  const [vatAmount, setVatAmount] = useState('10 000');
  const [vatRate, setVatRate] = useState('25');
  const [vatType, setVatType] = useState<'ex' | 'inc'>('ex');
  const [vatResult, setVatResult] = useState<VatResult | null>(null);

  // Adjustment calculator
  const [adjType, setAdjType] = useState<'eiendom' | 'maskin'>('eiendom');
  const [adjMva, setAdjMva] = useState('500 000');
  const [adjYears, setAdjYears] = useState('3');
  const [adjOld, setAdjOld] = useState('100');
  const [adjNew, setAdjNew] = useState('50');
  const [adjResult, setAdjResult] = useState<AdjResult | null>(null);

  const handleCalcVat = () => {
    const res = calcVat(parseNum(vatAmount), parseFloat(vatRate), vatType);
    setVatResult(res);
  };

  const handleCalcAdj = () => {
    const res = calcAdjustment(
      adjType,
      parseNum(adjMva),
      parseInt(adjYears) || 0,
      parseNum(adjOld),
      parseNum(adjNew)
    );
    setAdjResult(res);
  };

  const getAdjMainLabel = (res: AdjResult) => {
    switch (res.status) {
      case 'under': return r.adjUnder;
      case 'expired': return r.adjExpired;
      case 'repay': return r.adjRepay;
      case 'increase': return r.adjIncrease;
      case 'bagatell': return 'Under bagatellgrensen';
      default: return '';
    }
  };

  const getAdjMainSub = (res: AdjResult) => {
    switch (res.status) {
      case 'under': return r.adjUnderSub.replace('{t}', fmt(res.threshold));
      case 'expired': return r.adjExpiredSub.replace('{p}', String(res.period));
      case 'repay': return r.adjRepaySub.replace('{a}', fmt(res.adjustmentAmount));
      case 'increase': return r.adjIncreaseSub.replace('{a}', fmt(res.adjustmentAmount));
      default: return '';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* VAT Calculator */}
        <CalcCard title={r.vatTitle} description={r.vatDesc} theme={theme}>
          <FormInput label={r.lVatAmount} value={vatAmount} onChangeText={setVatAmount} keyboardType="numeric" theme={theme} />
          <PickerSelect
            label={r.lVatRate}
            options={[
              { value: '25', label: '25 % (Standard)' },
              { value: '15', label: '15 % (' + r.drVat2 + ')' },
              { value: '12', label: '12 % (' + r.drVat3 + ')' },
              { value: '0', label: '0 % (' + r.drVat4 + ')' },
            ]}
            selectedValue={vatRate}
            onValueChange={setVatRate}
            theme={theme}
          />
          <PickerSelect
            label={r.lVatType}
            options={[
              { value: 'ex', label: r.vatOptEx },
              { value: 'inc', label: r.vatOptInc },
            ]}
            selectedValue={vatType}
            onValueChange={(v) => setVatType(v as 'ex' | 'inc')}
            theme={theme}
          />
          <CalcButton title={r.btnCalc} onPress={handleCalcVat} theme={theme} />

          {vatResult && (
            <ResultSection
              theme={theme}
              mainLabel={vatType === 'ex' ? r.vatRInclCalc : r.vatRExclCalc}
              mainValue={fmt(vatType === 'ex' ? vatResult.inclusive : vatResult.exclusive)}
              tiles={[
                { label: vatType === 'ex' ? (r.vatRExclCalc + ' ' + r.vatRInputTag) : (r.vatRInclCalc + ' ' + r.vatRInputTag), value: fmt(vatType === 'ex' ? vatResult.exclusive : vatResult.inclusive) },
                { label: r.vatRTax, value: fmt(vatResult.vatAmount) },
                { label: r.vatRPct, value: pct(vatResult.rate) },
              ]}
            />
          )}
        </CalcCard>

        {/* Adjustment Calculator */}
        <CalcCard title={r.adjTitle} description={r.adjDesc} theme={theme}>
          <PickerSelect
            label={r.adjLType}
            options={[
              { value: 'eiendom', label: r.adjOptProp },
              { value: 'maskin', label: r.adjOptMach },
            ]}
            selectedValue={adjType}
            onValueChange={(v) => setAdjType(v as 'eiendom' | 'maskin')}
            theme={theme}
          />
          <FormInput label={r.adjLMva} value={adjMva} onChangeText={setAdjMva} keyboardType="numeric" theme={theme} />
          <FormInput label={r.adjLYears} value={adjYears} onChangeText={setAdjYears} keyboardType="numeric" theme={theme} />
          <View style={styles.row}>
            <FormInput label={r.adjLOld} value={adjOld} onChangeText={setAdjOld} keyboardType="numeric" theme={theme} half />
            <FormInput label={r.adjLNew} value={adjNew} onChangeText={setAdjNew} keyboardType="numeric" theme={theme} half />
          </View>
          <CalcButton title={r.adjBtn} onPress={handleCalcAdj} theme={theme} />

          {adjResult && (
            <ResultSection
              theme={theme}
              mainLabel={getAdjMainLabel(adjResult)}
              mainValue={fmt(adjResult.adjustmentAmount)}
              mainSub={getAdjMainSub(adjResult)}
              tiles={[
                { label: r.adjRlBase, value: fmt(adjResult.annualBase) },
                { label: r.adjRlAnnual, value: fmt(adjResult.annualAdjustment) },
                { label: r.adjRlRemain, value: adjResult.remainingYears + ' / ' + adjResult.period },
                { label: r.adjRlChange, value: pct(adjResult.shareChange) },
              ]}
            />
          )}
        </CalcCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
});
