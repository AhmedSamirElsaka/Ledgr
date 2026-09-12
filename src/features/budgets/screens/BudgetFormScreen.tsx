import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useBudgetFormScreen} from '../hooks/useBudgetFormScreen';

import type {BudgetPeriod} from '../../../db/repositories/budgetsRepository';

function periodLabel(period: BudgetPeriod, t: (key: string) => string): string {
  if (period === 'weekly') {
    return t('budgetForm.periodWeekly');
  }
  if (period === 'monthly') {
    return t('budgetForm.periodMonthly');
  }
  return t('budgetForm.periodCustom');
}

export function BudgetFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    editId,
    categories,
    categoryId,
    setCategoryId,
    period,
    setPeriod,
    amountText,
    setAmountText,
    rollover,
    setRollover,
    saving,
    onSave,
    onDeactivate,
    periods,
  } = useBudgetFormScreen();

  return (
    <ScreenBackdrop washHeight={220}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[4],
        }}
        keyboardShouldPersistTaps="handled">
        <Input
          label={t('budgetForm.amount')}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
        />
        <Text variant="label" color="secondary">
          {t('budgetForm.period')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {periods.map(p => (
            <Button
              key={p}
              label={periodLabel(p, t)}
              variant={period === p ? 'primary' : 'secondary'}
              onPress={() => setPeriod(p)}
            />
          ))}
        </View>
        <Text variant="label" color="secondary">
          {t('budgetForm.category')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {categories.map(cat => (
            <Button
              key={cat.id}
              label={cat.name}
              variant={categoryId === cat.id ? 'primary' : 'secondary'}
              onPress={() => setCategoryId(cat.id)}
            />
          ))}
        </View>
        <Button
          label={rollover ? t('budgetForm.rolloverOn') : t('budgetForm.rolloverOff')}
          variant={rollover ? 'primary' : 'secondary'}
          onPress={() => setRollover(v => !v)}
        />
        <Button
          label={t('common.save')}
          fullWidth
          loading={saving}
          onPress={() => {
            onSave().catch(() => undefined);
          }}
        />
        {editId ? (
          <Button
            label={t('budgetForm.deactivate')}
            variant="danger"
            fullWidth
            onPress={onDeactivate}
          />
        ) : null}
      </ScrollView>
    </ScreenBackdrop>
  );
}
