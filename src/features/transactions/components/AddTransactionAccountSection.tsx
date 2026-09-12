import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {AccountRow} from '../../../db/repositories/accountsRepository';

type AddTransactionAccountSectionProps = {
  accounts: AccountRow[];
  accountId: string | null;
  onAccountId: (id: string) => void;
};

export function AddTransactionAccountSection({
  accounts,
  accountId,
  onAccountId,
}: AddTransactionAccountSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <>
      <Text variant="label" color="secondary">
        {t('add.account')}
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
        {accounts.map(acc => (
          <Button
            key={acc.id}
            label={acc.name}
            variant={accountId === acc.id ? 'primary' : 'secondary'}
            onPress={() => onAccountId(acc.id)}
          />
        ))}
      </View>
    </>
  );
}
