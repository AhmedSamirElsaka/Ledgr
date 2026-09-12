import {View} from 'react-native';

import {formatISO, startOfDay, subDays} from 'date-fns';
import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

type AddTransactionDateSectionProps = {
  occurredAt: string;
  onOccurredAt: (iso: string) => void;
};

export function AddTransactionDateSection({
  occurredAt,
  onOccurredAt,
}: AddTransactionDateSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const todayKey = formatISO(startOfDay(new Date()), {representation: 'date'});
  const yesterdayKey = formatISO(startOfDay(subDays(new Date(), 1)), {
    representation: 'date',
  });
  const occurredKey = formatISO(startOfDay(new Date(occurredAt)), {
    representation: 'date',
  });

  return (
    <>
      <Text variant="label" color="secondary">
        {t('add.date')}
      </Text>
      <View style={{flexDirection: 'row', gap: theme.space[2]}}>
        <Button
          label={t('add.today')}
          variant={occurredKey === todayKey ? 'primary' : 'secondary'}
          onPress={() => onOccurredAt(new Date().toISOString())}
        />
        <Button
          label={t('add.yesterday')}
          variant={occurredKey === yesterdayKey ? 'primary' : 'secondary'}
          onPress={() =>
            onOccurredAt(subDays(startOfDay(new Date()), 1).toISOString())
          }
        />
      </View>
    </>
  );
}
