import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { CalcCard } from '../components/CalcCard';
import { FormInput } from '../components/FormInput';
import { CalcButton } from '../components/CalcButton';
import { ResultSection } from '../components/ResultSection';
import { calcNpv, NpvResult } from '../lib/calculations/npv';
import { fmt, pct, parseNum } from '../lib/format';

export default function AnalysisScreen() {
  const { theme, r } = useApp();

  const [investment, setInvestment] = useState('1 000 000');
  const [discountRate, setDiscountRate] = useState('10');
  const [cf1, setCf1] = useState('300 000');
  const [cf2, setCf2] = useState('350 000');
  const [cf3, setCf3] = useState('400 000');
  const [cf4, setCf4] = useState('400 000');
  const [cf5, setCf5] = useState('500 000');
  const [result, setResult] = useState<NpvResult | null>(null);

  const handleCalc = () => {
    const res = calcNpv(
      parseNum(investment),
      parseFloat(discountRate) || 0,
      [parseNum(cf1), parseNum(cf2), parseNum(cf3), parseNum(cf4), parseNum(cf5)]
    );
    setResult(res);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CalcCard title={r.npvTitle} description={r.npvDesc} theme={theme}>
          <View style={styles.row}>
            <FormInput label={r.lInv} value={investment} onChangeText={setInvestment} keyboardType="numeric" theme={theme} half />
            <FormInput label={r.lRateD} value={discountRate} onChangeText={setDiscountRate} keyboardType="decimal-pad" theme={theme} half />
          </View>
          <View style={styles.row}>
            <FormInput label={r.lCF1} value={cf1} onChangeText={setCf1} keyboardType="numeric" theme={theme} half />
            <FormInput label={r.lCF2} value={cf2} onChangeText={setCf2} keyboardType="numeric" theme={theme} half />
          </View>
          <View style={styles.row}>
            <FormInput label={r.lCF3} value={cf3} onChangeText={setCf3} keyboardType="numeric" theme={theme} half />
            <FormInput label={r.lCF4} value={cf4} onChangeText={setCf4} keyboardType="numeric" theme={theme} half />
          </View>
          <FormInput label={r.lCF5} value={cf5} onChangeText={setCf5} keyboardType="numeric" theme={theme} />
          <CalcButton title={r.btnCalc} onPress={handleCalc} theme={theme} />

          {result && (
            <ResultSection
              theme={theme}
              mainLabel={r.npvRLbl}
              mainValue={fmt(result.npv)}
              mainSub={result.isProfitable ? r.npvPos : r.npvNeg}
              tiles={[
                { label: 'IRR', value: result.irr !== null ? pct(result.irr) : 'N/A' },
                { label: r.npvRPay, value: result.payback !== null ? result.payback.toFixed(1) + ' ' + r.yr : '>5 ' + r.yr },
                { label: r.npvRSum, value: fmt(result.sum) },
                { label: r.npvRPi, value: result.pi.toFixed(2) + 'x' },
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
