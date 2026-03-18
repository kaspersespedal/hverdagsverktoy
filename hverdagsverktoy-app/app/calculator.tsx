import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './_layout';
import { CalcCard } from '../components/CalcCard';
import { FormInput } from '../components/FormInput';
import { CalcButton } from '../components/CalcButton';
import { ResultSection } from '../components/ResultSection';
import { PickerSelect } from '../components/PickerSelect';
import { fmt, pct, fmtNum, parseNum } from '../lib/format';
import { calcTvm, calcMargin, calcBreakeven, calcCompound, calcDiscount } from '../lib/calculations/finance';
import { calcAga, AgaResult, calcFerie, FerieResult, calcLvu, LvuResult } from '../lib/calculations/employee';
import { calcDepreciation, DepreciationRow, DEPRECIATION_RATES } from '../lib/calculations/depreciation';
import { calcPension, PensionResult } from '../lib/calculations/pension';
import { calcEffectiveRate, EffectiveRateResult } from '../lib/calculations/effective-rate';
import { calcCurrencyGain, CurrencyGainResult } from '../lib/calculations/currency-gain';
import { calcLiquidity, LiquidityRow } from '../lib/calculations/liquidity';
import { percentOfAmount, whatPercentOf, percentChange } from '../lib/calculations/percentage';

type CalcMode = 'finance' | 'employee' | 'depreciation' | 'holiday' | 'rate' | 'percent' | 'currency' | 'liquidity' | 'pension' | 'lvu';

export default function CalculatorScreen() {
  const { theme, r } = useApp();
  const [mode, setMode] = useState<CalcMode>('finance');

  const modes: { key: CalcMode; label: string }[] = [
    { key: 'finance', label: r.fcLblType || 'Finance' },
    { key: 'lvu', label: r.lblLvu },
    { key: 'employee', label: r.lblAga },
    { key: 'depreciation', label: r.lblAvs },
    { key: 'holiday', label: r.lblFerie },
    { key: 'rate', label: r.lblRente },
    { key: 'percent', label: r.lblProsent },
    { key: 'currency', label: r.lblValgevinst },
    { key: 'liquidity', label: r.lblLikvid },
    { key: 'pension', label: r.lblPensjon },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mode selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeScroll} style={styles.modeBar}>
          {modes.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.modeChip,
                {
                  backgroundColor: key === mode ? theme.accent : theme.surface2,
                  borderColor: key === mode ? theme.accent : theme.border,
                },
              ]}
              onPress={() => setMode(key)}
            >
              <Text style={[styles.modeText, { color: key === mode ? '#fff' : theme.ink2 }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {mode === 'finance' && <FinancePanel />}
        {mode === 'lvu' && <LvuPanel />}
        {mode === 'employee' && <EmployeePanel />}
        {mode === 'depreciation' && <DepreciationPanel />}
        {mode === 'holiday' && <HolidayPanel />}
        {mode === 'rate' && <RatePanel />}
        {mode === 'percent' && <PercentPanel />}
        {mode === 'currency' && <CurrencyPanel />}
        {mode === 'liquidity' && <LiquidityPanel />}
        {mode === 'pension' && <PensionPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Finance Calculator ──────────────────────────
function FinancePanel() {
  const { theme, r } = useApp();
  const [fcType, setFcType] = useState('tvm');
  const [result, setResult] = useState<any>(null);

  // TVM
  const [pv, setPv] = useState('10000'); const [fcRate, setFcRate] = useState('5'); const [fcYears, setFcYears] = useState('10'); const [fcPmt, setFcPmt] = useState('0');
  // Margin
  const [cost, setCost] = useState('500'); const [sell, setSell] = useState('800');
  // Breakeven
  const [fixed, setFixed] = useState('100000'); const [priceU, setPriceU] = useState('250'); const [varCost, setVarCost] = useState('150');
  // Compound
  const [princ, setPrinc] = useState('100000'); const [cRate, setCRate] = useState('7'); const [cYears, setCYears] = useState('20'); const [cFreq, setCFreq] = useState('12');
  // Discount
  const [orig, setOrig] = useState('1000'); const [disc, setDisc] = useState('25');

  const handleCalc = () => {
    if (fcType === 'tvm') setResult({ type: 'tvm', data: calcTvm(parseNum(pv), parseFloat(fcRate), parseFloat(fcYears), parseNum(fcPmt)) });
    else if (fcType === 'margin') setResult({ type: 'margin', data: calcMargin(parseNum(cost), parseNum(sell)) });
    else if (fcType === 'breakeven') setResult({ type: 'breakeven', data: calcBreakeven(parseNum(fixed), parseNum(priceU), parseNum(varCost)) });
    else if (fcType === 'compound') setResult({ type: 'compound', data: calcCompound(parseNum(princ), parseFloat(cRate), parseFloat(cYears), parseInt(cFreq)) });
    else if (fcType === 'discount') setResult({ type: 'discount', data: calcDiscount(parseNum(orig), parseFloat(disc)) });
  };

  return (
    <CalcCard title={r.fcLblType || 'Finance Calculator'} theme={theme}>
      <PickerSelect label={r.fcLblType} options={[
        { value: 'tvm', label: r.fcTvm }, { value: 'margin', label: r.fcMargin }, { value: 'breakeven', label: r.fcBe },
        { value: 'compound', label: r.fcCompound }, { value: 'discount', label: r.fcDiscount },
      ]} selectedValue={fcType} onValueChange={(v) => { setFcType(v); setResult(null); }} theme={theme} />

      {fcType === 'tvm' && (<>
        <FormInput label={r.fcPv} value={pv} onChangeText={setPv} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcRate} value={fcRate} onChangeText={setFcRate} keyboardType="decimal-pad" theme={theme} />
        <View style={s.row}><FormInput label={r.fcYears} value={fcYears} onChangeText={setFcYears} keyboardType="numeric" theme={theme} half />
        <FormInput label={r.fcPmt} value={fcPmt} onChangeText={setFcPmt} keyboardType="numeric" theme={theme} half /></View>
      </>)}
      {fcType === 'margin' && (<>
        <FormInput label={r.fcCost} value={cost} onChangeText={setCost} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcSell} value={sell} onChangeText={setSell} keyboardType="numeric" theme={theme} />
      </>)}
      {fcType === 'breakeven' && (<>
        <FormInput label={r.fcFixed} value={fixed} onChangeText={setFixed} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcPriceU} value={priceU} onChangeText={setPriceU} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcVarCost} value={varCost} onChangeText={setVarCost} keyboardType="numeric" theme={theme} />
      </>)}
      {fcType === 'compound' && (<>
        <FormInput label={r.fcPrinc} value={princ} onChangeText={setPrinc} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcRate} value={cRate} onChangeText={setCRate} keyboardType="decimal-pad" theme={theme} />
        <View style={s.row}><FormInput label={r.fcYears} value={cYears} onChangeText={setCYears} keyboardType="numeric" theme={theme} half />
        <FormInput label={r.fcFreq} value={cFreq} onChangeText={setCFreq} keyboardType="numeric" theme={theme} half /></View>
      </>)}
      {fcType === 'discount' && (<>
        <FormInput label={r.fcOrig} value={orig} onChangeText={setOrig} keyboardType="numeric" theme={theme} />
        <FormInput label={r.fcDiscPct} value={disc} onChangeText={setDisc} keyboardType="decimal-pad" theme={theme} />
      </>)}

      <CalcButton title={r.fcBtn} onPress={handleCalc} theme={theme} />

      {result?.type === 'tvm' && result.data && (
        <ResultSection theme={theme} mainLabel={r.fcRFv} mainValue={fmt(result.data.futureValue)} mainSub={r.fcRAfter + ' ' + result.data.years + ' ' + r.fcRYr}
          tiles={[{ label: r.fcRStart, value: fmt(result.data.startingAmount) }, { label: r.fcRTotalPmt, value: fmt(result.data.totalPayments) }, { label: r.fcRInterest, value: fmt(result.data.interestEarned) }, { label: r.fcRReturn, value: pct(result.data.totalReturn) }]} />
      )}
      {result?.type === 'margin' && result.data && (
        <ResultSection theme={theme} mainLabel={r.fcRProfit} mainValue={fmt(result.data.profit)}
          tiles={[{ label: 'Margin', value: pct(result.data.margin) }, { label: 'Markup', value: pct(result.data.markup) }, { label: r.fcCost, value: fmt(result.data.cost) }, { label: r.fcSell, value: fmt(result.data.sell) }]} />
      )}
      {result?.type === 'breakeven' && result.data && (
        <ResultSection theme={theme} mainLabel={r.fcRBePoint} mainValue={result.data.units === Infinity ? 'Inf' : fmtNum(result.data.units) + ' ' + r.fcRUnits}
          tiles={[{ label: r.fcRRevenue, value: fmt(result.data.revenue) }, { label: r.fcRContrib, value: fmt(result.data.contribution) }, { label: r.fcFixed, value: fmt(result.data.fixedCosts) }, { label: r.fcRContribMarg, value: pct(result.data.contributionMargin) }]} />
      )}
      {result?.type === 'compound' && result.data && (
        <ResultSection theme={theme} mainLabel={r.fcREndVal} mainValue={fmt(result.data.finalValue)} mainSub={r.fcRAfter + ' ' + result.data.years + ' ' + r.fcRYr}
          tiles={[{ label: r.fcRStart, value: fmt(result.data.startingAmount) }, { label: r.fcRInterest, value: fmt(result.data.interestEarned) }, { label: r.fcRReturn, value: pct(result.data.totalReturn) }, { label: r.fcRDoubling, value: isFinite(result.data.doublingYears) ? result.data.doublingYears.toFixed(1) + ' ' + r.fcRYr : '-' }]} />
      )}
      {result?.type === 'discount' && result.data && (
        <ResultSection theme={theme} mainLabel={r.fcRDiscPrice} mainValue={fmt(result.data.finalPrice)}
          tiles={[{ label: r.fcOrig, value: fmt(result.data.originalPrice) }, { label: r.fcRSaved, value: fmt(result.data.saved) }, { label: r.fcRDiscount, value: pct(result.data.discountPercent) }]} />
      )}
    </CalcCard>
  );
}

// ─── LVU: Salary vs Dividend ──────────────────────────
function LvuPanel() {
  const { theme, r } = useApp();
  const [gross, setGross] = useState('600 000');
  const [zone, setZone] = useState('0.141');
  const [result, setResult] = useState<LvuResult | null>(null);

  return (
    <CalcCard title={r.lblLvu} theme={theme}>
      <FormInput label={r.lvuGross} value={gross} onChangeText={setGross} keyboardType="numeric" theme={theme} />
      <PickerSelect label={r.lvuZone} options={(r.lvuZoneOpts || []).map((label, i) => ({ value: ['0.141','0.106','0.064','0'][i], label }))} selectedValue={zone} onValueChange={setZone} theme={theme} />
      <CalcButton title={r.lvuBtn} onPress={() => setResult(calcLvu(parseNum(gross), parseFloat(zone)))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.lvuRDiff} mainValue={fmt(result.difference)} mainSub={result.cheaperOption === 'salary' ? r.lvuRSal : r.lvuRDiv}
        tiles={[{ label: r.lvuRSal, value: fmt(result.salaryCost) }, { label: r.lvuRDiv, value: fmt(result.dividendCost) }]} />}
    </CalcCard>
  );
}

// ─── Employee Cost ──────────────────────────
function EmployeePanel() {
  const { theme, r } = useApp();
  const [sal, setSal] = useState('600 000');
  const [zone, setZone] = useState('0.141');
  const [ferie, setFerie] = useState('0.102');
  const [otp, setOtp] = useState('0.02');
  const [result, setResult] = useState<AgaResult | null>(null);

  return (
    <CalcCard title={r.lblAga} theme={theme}>
      <FormInput label={r.agaSal} value={sal} onChangeText={setSal} keyboardType="numeric" theme={theme} />
      <PickerSelect label={r.agaZone} options={(r.agaZoneOpts || []).map((label, i) => ({ value: ['0.141','0.106','0.064','0.051','0'][i], label }))} selectedValue={zone} onValueChange={setZone} theme={theme} />
      <PickerSelect label={r.agaFerie} options={(r.agaFerieOpts || []).map((label, i) => ({ value: ['0.102','0.12'][i], label }))} selectedValue={ferie} onValueChange={setFerie} theme={theme} />
      <PickerSelect label={r.agaOtp} options={(r.agaOtpOpts || []).map((label, i) => ({ value: ['0.02','0.05','0.07'][i], label }))} selectedValue={otp} onValueChange={setOtp} theme={theme} />
      <CalcButton title={r.agaBtn} onPress={() => setResult(calcAga(parseNum(sal), parseFloat(zone), parseFloat(ferie), parseFloat(otp)))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.agaRTotal} mainValue={fmt(result.totalCost)} mainSub={fmt(result.monthlyTotal) + r.agaPerMonth}
        tiles={[{ label: r.agaRAga, value: fmt(result.agaAmount) }, { label: r.agaRFerie, value: fmt(result.ferieAmount) }, { label: r.agaROtp, value: fmt(result.otpAmount) }, { label: r.agaRPct, value: pct(result.percentOfGross) }]} />}
    </CalcCard>
  );
}

// ─── Depreciation ──────────────────────────
function DepreciationPanel() {
  const { theme, r } = useApp();
  const [price, setPrice] = useState('500 000');
  const [group, setGroup] = useState('0.30');
  const [rows, setRows] = useState<DepreciationRow[]>([]);

  return (
    <CalcCard title={r.lblAvs} theme={theme}>
      <FormInput label={r.avsPriceLabel} value={price} onChangeText={setPrice} keyboardType="numeric" theme={theme} />
      <PickerSelect label={r.avsGroupLabel} options={(r.avsGroupOpts || []).map((label, i) => ({ value: String([0.30,0.20,0.24,0.20,0.14,0.12,0.05,0.04,0.02,0.10][i]), label }))} selectedValue={group} onValueChange={setGroup} theme={theme} />
      <CalcButton title={r.avsBtn} onPress={() => setRows(calcDepreciation(parseNum(price), parseFloat(group)))} theme={theme} />
      {rows.length > 0 && (
        <View style={[s.table, { borderColor: theme.border }]}>
          <View style={[s.tableRow, { backgroundColor: theme.surface2 }]}>
            <Text style={[s.tableH, { color: theme.ink }]}>{r.avsColYear}</Text>
            <Text style={[s.tableH, s.tableRight, { color: theme.ink }]}>{r.avsColStart}</Text>
            <Text style={[s.tableH, s.tableRight, { color: theme.ink }]}>{r.avsColDepr}</Text>
            <Text style={[s.tableH, s.tableRight, { color: theme.ink }]}>{r.avsColEnd}</Text>
          </View>
          {rows.map((row) => (
            <View key={row.year} style={[s.tableRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <Text style={[s.tableCell, { color: theme.ink }]}>{row.year}</Text>
              <Text style={[s.tableCell, s.tableRight, { color: theme.ink }]}>{fmtNum(row.startValue)}</Text>
              <Text style={[s.tableCell, s.tableRight, { color: theme.ink }]}>{fmtNum(row.depreciation)}</Text>
              <Text style={[s.tableCell, s.tableRight, { color: theme.ink }]}>{fmtNum(row.endValue)}</Text>
            </View>
          ))}
        </View>
      )}
    </CalcCard>
  );
}

// ─── Holiday Pay ──────────────────────────
function HolidayPanel() {
  const { theme, r } = useApp();
  const [sal, setSal] = useState('600 000');
  const [ferieType, setFerieType] = useState('0.102');
  const [over60, setOver60] = useState(false);
  const [result, setResult] = useState<FerieResult | null>(null);

  return (
    <CalcCard title={r.lblFerie} theme={theme}>
      <FormInput label={r.ferieAnnualLabel} value={sal} onChangeText={setSal} keyboardType="numeric" theme={theme} />
      <PickerSelect label={r.ferieTypeLabel} options={(r.ferieTypeOpts || []).map((label, i) => ({ value: ['0.102','0.12'][i], label }))} selectedValue={ferieType} onValueChange={setFerieType} theme={theme} />
      <TouchableOpacity onPress={() => setOver60(!over60)} style={[s.checkbox, { borderColor: theme.border }]}>
        <View style={[s.checkboxInner, over60 && { backgroundColor: theme.accent }]} />
        <Text style={[s.checkboxLabel, { color: theme.ink }]}>{r.ferieOver60Label}</Text>
      </TouchableOpacity>
      <CalcButton title={r.ferieBtn} onPress={() => setResult(calcFerie(parseNum(sal), parseFloat(ferieType), over60))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.ferieAmtLabel} mainValue={fmt(result.amount)}
        tiles={[{ label: r.ferieDailyLabel, value: fmt(result.dailyRate) }, ...(result.withBonus ? [{ label: r.ferieOver60Result, value: fmt(result.withBonus) }] : [])]} />}
    </CalcCard>
  );
}

// ─── Effective Interest Rate ──────────────────────────
function RatePanel() {
  const { theme, r } = useApp();
  const [amt, setAmt] = useState('2 000 000');
  const [nom, setNom] = useState('5.1');
  const [est, setEst] = useState('5 000');
  const [monthly, setMonthly] = useState('50');
  const [years, setYears] = useState('25');
  const [result, setResult] = useState<EffectiveRateResult | null>(null);

  return (
    <CalcCard title={r.lblRente} theme={theme}>
      <FormInput label={r.renteAmountLabel} value={amt} onChangeText={setAmt} keyboardType="numeric" theme={theme} />
      <FormInput label={r.renteNomLabel} value={nom} onChangeText={setNom} keyboardType="decimal-pad" theme={theme} />
      <View style={s.row}><FormInput label={r.renteEstLabel} value={est} onChangeText={setEst} keyboardType="numeric" theme={theme} half />
      <FormInput label={r.renteMonthlyLabel} value={monthly} onChangeText={setMonthly} keyboardType="numeric" theme={theme} half /></View>
      <FormInput label={r.renteYearsLabel} value={years} onChangeText={setYears} keyboardType="numeric" theme={theme} />
      <CalcButton title={r.renteBtn} onPress={() => setResult(calcEffectiveRate(parseNum(amt), parseFloat(nom), parseNum(est), parseNum(monthly), parseInt(years)))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.renteEffLabel} mainValue={result.effectiveRate.toFixed(2) + ' %'}
        tiles={[{ label: r.renteTotalLabel, value: fmt(result.totalCost) }, { label: r.renteFeesLabel, value: fmt(result.totalFees) }]} />}
    </CalcCard>
  );
}

// ─── Percentage ──────────────────────────
function PercentPanel() {
  const { theme, r } = useApp();
  const [mode, setMode] = useState('1');
  const [val1, setVal1] = useState('25');
  const [val2, setVal2] = useState('1000');
  const [result, setResult] = useState<string | null>(null);

  const handleCalc = () => {
    const a = parseNum(val1), b = parseNum(val2);
    if (mode === '1') setResult(fmtNum(percentOfAmount(a, b), 2));
    else if (mode === '2') setResult(whatPercentOf(a, b).toFixed(2) + ' %');
    else setResult(percentChange(a, b).toFixed(2) + ' %');
  };

  const label1 = mode === '1' ? r.prosentPct : mode === '2' ? r.prosentAmount : r.prosentStartValue;
  const label2 = mode === '1' ? r.prosentAmount : mode === '2' ? r.prosentTotal : r.prosentEndValue;

  return (
    <CalcCard title={r.lblProsent} theme={theme}>
      <PickerSelect label={r.prosentModeLabel} options={[
        { value: '1', label: r.prosentOpt1 }, { value: '2', label: r.prosentOpt2 }, { value: '3', label: r.prosentOpt3 },
      ]} selectedValue={mode} onValueChange={(v) => { setMode(v); setResult(null); }} theme={theme} />
      <FormInput label={label1} value={val1} onChangeText={setVal1} keyboardType="decimal-pad" theme={theme} />
      <FormInput label={label2} value={val2} onChangeText={setVal2} keyboardType="decimal-pad" theme={theme} />
      <CalcButton title={r.prosentBtn} onPress={handleCalc} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.prosentResultLabel} mainValue={result} tiles={[]} />}
    </CalcCard>
  );
}

// ─── Currency Gain/Loss ──────────────────────────
function CurrencyPanel() {
  const { theme, r } = useApp();
  const [units, setUnits] = useState('1000');
  const [buyRate, setBuyRate] = useState('10.50');
  const [sellRate, setSellRate] = useState('11.20');
  const [result, setResult] = useState<CurrencyGainResult | null>(null);

  return (
    <CalcCard title={r.lblValgevinst} theme={theme}>
      <FormInput label={r.valgevinUnitsLabel} value={units} onChangeText={setUnits} keyboardType="numeric" theme={theme} />
      <View style={s.row}>
        <FormInput label={r.valgevinCostLabel + ' (/enh)'} value={buyRate} onChangeText={setBuyRate} keyboardType="decimal-pad" theme={theme} half />
        <FormInput label={r.valgevinSaleLabel + ' (/enh)'} value={sellRate} onChangeText={setSellRate} keyboardType="decimal-pad" theme={theme} half />
      </View>
      <CalcButton title={r.valgevinBtn} onPress={() => setResult(calcCurrencyGain(parseNum(units), parseFloat(buyRate), parseFloat(sellRate)))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.valgevinResultLabel} mainValue={fmt(result.gain)} mainSub={result.isGain ? r.valgevinGain : r.valgevinLoss}
        tiles={[{ label: r.valgevinCostLabel, value: fmt(result.costNok) }, { label: r.valgevinSaleLabel, value: fmt(result.saleNok) }, { label: r.valgevinTaxLabel, value: fmt(result.tax) }, { label: r.valgevinNetLabel, value: fmt(result.netAfterTax) }]} />}
    </CalcCard>
  );
}

// ─── Liquidity Budget ──────────────────────────
function LiquidityPanel() {
  const { theme, r } = useApp();
  const [start, setStart] = useState('100 000');
  const [income, setIncome] = useState('50 000');
  const [expense, setExpense] = useState('45 000');
  const [rows, setRows] = useState<LiquidityRow[]>([]);

  return (
    <CalcCard title={r.lblLikvid} theme={theme}>
      <FormInput label={r.likvidStartLabel} value={start} onChangeText={setStart} keyboardType="numeric" theme={theme} />
      <View style={s.row}><FormInput label={r.likvidIncomeLabel} value={income} onChangeText={setIncome} keyboardType="numeric" theme={theme} half />
      <FormInput label={r.likvidExpenseLabel} value={expense} onChangeText={setExpense} keyboardType="numeric" theme={theme} half /></View>
      <CalcButton title={r.likvidBtn} onPress={() => setRows(calcLiquidity(parseNum(start), parseNum(income), parseNum(expense)))} theme={theme} />
      {rows.length > 0 && (
        <View style={[s.table, { borderColor: theme.border }]}>
          <View style={[s.tableRow, { backgroundColor: theme.surface2 }]}>
            <Text style={[s.tableH, { color: theme.ink }]}>{r.likvidColMonth}</Text>
            <Text style={[s.tableH, s.tableRight, { color: theme.ink }]}>{r.likvidColStart}</Text>
            <Text style={[s.tableH, s.tableRight, { color: theme.ink }]}>{r.likvidColEnd}</Text>
          </View>
          {rows.map((row) => (
            <View key={row.month} style={[s.tableRow, { borderTopColor: theme.border, borderTopWidth: 1 }, row.endBalance < 0 && { backgroundColor: 'rgba(255,0,0,0.05)' }]}>
              <Text style={[s.tableCell, { color: theme.ink }]}>{r.likvidMnd} {row.month}</Text>
              <Text style={[s.tableCell, s.tableRight, { color: theme.ink }]}>{fmtNum(row.startBalance)}</Text>
              <Text style={[s.tableCell, s.tableRight, { color: row.endBalance < 0 ? theme.red : theme.ink, fontWeight: '600' }]}>{fmtNum(row.endBalance)}</Text>
            </View>
          ))}
        </View>
      )}
    </CalcCard>
  );
}

// ─── Pension ──────────────────────────
function PensionPanel() {
  const { theme, r } = useApp();
  const [age, setAge] = useState('30');
  const [retire, setRetire] = useState('67');
  const [sal, setSal] = useState('600 000');
  const [otp, setOtp] = useState('0.02');
  const [ret, setRet] = useState('6');
  const [result, setResult] = useState<PensionResult | null>(null);

  return (
    <CalcCard title={r.lblPensjon} theme={theme}>
      <View style={s.row}><FormInput label={r.pensjonAgeLabel} value={age} onChangeText={setAge} keyboardType="numeric" theme={theme} half />
      <FormInput label={r.pensjonRetireLabel} value={retire} onChangeText={setRetire} keyboardType="numeric" theme={theme} half /></View>
      <FormInput label={r.pensjonSalaryLabel} value={sal} onChangeText={setSal} keyboardType="numeric" theme={theme} />
      <PickerSelect label={r.pensjonOtpLabel} options={(r.pensjonOtpOpts || []).map((label, i) => ({ value: ['0.02','0.05','0.07'][i], label }))} selectedValue={otp} onValueChange={setOtp} theme={theme} />
      <FormInput label={r.pensjonReturnLabel} value={ret} onChangeText={setRet} keyboardType="decimal-pad" theme={theme} />
      <CalcButton title={r.pensjonBtn} onPress={() => setResult(calcPension(parseInt(age), parseInt(retire), parseNum(sal), parseFloat(otp), parseFloat(ret)))} theme={theme} />
      {result && <ResultSection theme={theme} mainLabel={r.pensjonPotLabel} mainValue={fmt(result.pot)}
        tiles={[{ label: r.pensjonAnnualLabel, value: fmt(result.annualPension) }, { label: r.pensjonMonthlyLabel, value: fmt(result.monthlyPension) }, { label: r.pensjonRealLabel, value: fmt(result.realMonthly) }]} />}
      {result && <Text style={[s.disclaimer, { color: theme.ink3 }]}>{r.pensjonDisclaimer}</Text>}
    </CalcCard>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  table: { marginTop: 16, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6 },
  tableH: { flex: 1, fontSize: 11, fontWeight: '700' },
  tableCell: { flex: 1, fontSize: 12 },
  tableRight: { textAlign: 'right' },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingVertical: 8 },
  checkboxInner: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#ccc' },
  checkboxLabel: { fontSize: 13 },
  disclaimer: { fontSize: 11, marginTop: 12, lineHeight: 16 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  modeBar: { marginBottom: 16, maxHeight: 44 },
  modeScroll: { gap: 6, paddingHorizontal: 2 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  modeText: { fontSize: 12, fontWeight: '600' },
});
