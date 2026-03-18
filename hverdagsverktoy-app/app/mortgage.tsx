import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { CalcCard } from '../components/CalcCard';
import { FormInput } from '../components/FormInput';
import { CalcButton } from '../components/CalcButton';
import { ResultSection } from '../components/ResultSection';
import { PickerSelect } from '../components/PickerSelect';
import { calcMortgage, MortgageResult, calcInterestOnly, IoResult } from '../lib/calculations/mortgage';
import { fmt, parseNum } from '../lib/format';

export default function MortgageScreen() {
  const { theme, r } = useApp();

  // Standard mortgage
  const [amount, setAmount] = useState('3 000 000');
  const [rate, setRate] = useState('5.1');
  const [years, setYears] = useState('25');
  const [loanType, setLoanType] = useState<'annuity' | 'serial'>('annuity');
  const [result, setResult] = useState<MortgageResult | null>(null);

  // Interest-only
  const [ioAmount, setIoAmount] = useState('3 000 000');
  const [ioRate, setIoRate] = useState('5.1');
  const [ioFree, setIoFree] = useState('5');
  const [ioTotal, setIoTotal] = useState('25');
  const [ioResult, setIoResult] = useState<IoResult | null>(null);

  const handleCalc = () => {
    const res = calcMortgage(
      parseNum(amount),
      parseFloat(rate) || 0,
      parseInt(years) || 25,
      loanType
    );
    setResult(res);
  };

  const handleCalcIo = () => {
    const res = calcInterestOnly(
      parseNum(ioAmount),
      parseFloat(ioRate) || 0,
      parseInt(ioFree) || 5,
      parseInt(ioTotal) || 25
    );
    setIoResult(res);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Standard Mortgage */}
        <CalcCard title={r.morTitle} description={r.morDesc} theme={theme}>
          <PickerSelect
            label={r.morLType}
            options={[
              { value: 'annuity', label: r.morAnnuity },
              { value: 'serial', label: r.morSerial },
            ]}
            selectedValue={loanType}
            onValueChange={(v) => setLoanType(v as 'annuity' | 'serial')}
            theme={theme}
          />
          <FormInput label={r.lAmount} value={amount} onChangeText={setAmount} keyboardType="numeric" theme={theme} />
          <View style={styles.row}>
            <FormInput label={r.lRate} value={rate} onChangeText={setRate} keyboardType="decimal-pad" theme={theme} half />
            <FormInput label={r.lYears} value={years} onChangeText={setYears} keyboardType="numeric" theme={theme} half />
          </View>
          <CalcButton title={r.btnCalc} onPress={handleCalc} theme={theme} />

          {result && (
            <ResultSection
              theme={theme}
              mainLabel={r.morRMth}
              mainValue={fmt(result.monthly)}
              mainSub={fmt(result.total) + ' / ' + years + ' ' + r.yr}
              tiles={[
                { label: r.morRTot, value: fmt(result.total) },
                { label: r.morRInt, value: fmt(result.totalInterest) },
                { label: r.morRY1i, value: fmt(result.year1Interest) },
                { label: r.morRY1p, value: fmt(result.year1Principal) },
                ...(loanType === 'serial'
                  ? [
                      { label: r.morRFirst, value: fmt(result.firstPayment) },
                      { label: r.morRLast, value: fmt(result.lastPayment) },
                    ]
                  : []),
              ]}
            />
          )}
        </CalcCard>

        {/* Interest-Only Mortgage */}
        <CalcCard title={r.morIoTitle} description={r.morIoDesc} theme={theme}>
          <FormInput label={r.ioLAmount} value={ioAmount} onChangeText={setIoAmount} keyboardType="numeric" theme={theme} />
          <FormInput label={r.ioLRate} value={ioRate} onChangeText={setIoRate} keyboardType="decimal-pad" theme={theme} />
          <View style={styles.row}>
            <FormInput label={r.ioLIoFree} value={ioFree} onChangeText={setIoFree} keyboardType="numeric" theme={theme} half />
            <FormInput label={r.ioLTotal} value={ioTotal} onChangeText={setIoTotal} keyboardType="numeric" theme={theme} half />
          </View>
          <CalcButton title={r.btnCalc} onPress={handleCalcIo} theme={theme} />

          {ioResult && (
            <ResultSection
              theme={theme}
              mainLabel={r.ioRlDiff}
              mainValue={'+ ' + fmt(ioResult.diff)}
              mainSub={r.ioRSub}
              tiles={[
                { label: r.ioRlMthFree, value: fmt(ioResult.mthFree) },
                { label: r.ioRlTotFree, value: fmt(ioResult.totFreePeriodInt) },
                { label: r.ioRlMthAfter, value: fmt(ioResult.mthAfter) },
                { label: r.ioRlIntAfter, value: fmt(ioResult.intAfterPeriod) },
                { label: r.ioRlTotIntIo, value: fmt(ioResult.totIntIo) },
                { label: r.ioRlTotIntAnn, value: fmt(ioResult.totIntAnn) },
                { label: r.ioRlAnnMth, value: fmt(ioResult.annMth) },
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
