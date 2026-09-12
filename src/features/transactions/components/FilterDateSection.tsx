import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {type DatePreset, type TxFilterState} from '../transactionFilters';

import {FilterChipRow} from './FilterChipRow';
import {DATE_PRESETS} from './filterSheetConstants';

type FilterDateSectionProps = {
  draft: TxFilterState;
  onChange: (next: TxFilterState) => void;
};

export function FilterDateSection({draft, onChange}: FilterDateSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const set = <K extends keyof TxFilterState>(key: K, value: TxFilterState[K]) => {
    onChange({...draft, [key]: value});
  };

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {t('activity.dateRange')}
      </Text>
      <FilterChipRow>
        {DATE_PRESETS.map(id => (
          <Button
            key={id}
            label={t(`activity.datePreset.${id}`)}
            variant={draft.datePreset === id ? 'primary' : 'secondary'}
            onPress={() => set('datePreset', id as DatePreset)}
          />
        ))}
      </FilterChipRow>
      {draft.datePreset === 'custom' ? (
        <View style={{gap: theme.space[2]}}>
          <Input
            label={t('insights.from')}
            value={draft.customFrom}
            onChangeText={v => set('customFrom', v)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="2026-01-01"
          />
          <Input
            label={t('insights.to')}
            value={draft.customTo}
            onChangeText={v => set('customTo', v)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="2026-12-31"
          />
        </View>
      ) : null}
    </View>
  );
}
