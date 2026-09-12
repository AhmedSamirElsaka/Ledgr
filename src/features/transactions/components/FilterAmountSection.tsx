import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Input} from '../../../design/primitives/Input';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type TxFilterState} from '../transactionFilters';

type FilterAmountSectionProps = {
  draft: TxFilterState;
  amountCurrencyLabel: string;
  onChange: (next: TxFilterState) => void;
};

export function FilterAmountSection({
  draft,
  amountCurrencyLabel,
  onChange,
}: FilterAmountSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const set = <K extends keyof TxFilterState>(key: K, value: TxFilterState[K]) => {
    onChange({...draft, [key]: value});
  };

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {t('activity.amountRange', {currency: amountCurrencyLabel})}
      </Text>
      <View style={{flexDirection: 'row', gap: theme.space[2]}}>
        <View style={{flex: 1}}>
          <Input
            label={t('activity.minAmount')}
            value={draft.minAmountMajor}
            onChangeText={v => set('minAmountMajor', v)}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        <View style={{flex: 1}}>
          <Input
            label={t('activity.maxAmount')}
            value={draft.maxAmountMajor}
            onChangeText={v => set('maxAmountMajor', v)}
            keyboardType="decimal-pad"
            placeholder={t('activity.any')}
          />
        </View>
      </View>
    </View>
  );
}
