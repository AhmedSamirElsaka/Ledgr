import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {AccountRow} from '../../../db/repositories/accountsRepository';

type Props = {
  accounts: AccountRow[];
  accountId: string | null;
  onAccountChange: (id: string) => void;
  label?: string;
};

export function SmsQuickReviewAccountPicker({
  accounts,
  accountId,
  onAccountChange,
  label,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  if (accounts.length === 0) {
    return null;
  }

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {label ?? t('smsReview.account')}
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
        {accounts.map(account => {
          const selected = accountId === account.id;
          return (
            <Pressable
              key={account.id}
              accessibilityLabel={account.name}
              accessibilityState={{selected}}
              minSize={false}
              onPress={() => onAccountChange(account.id)}
              style={{
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.space[3],
                justifyContent: 'center',
                borderRadius: theme.radius.full,
                backgroundColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.surface.raised,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              <Text variant="bodyStrong" color={selected ? 'inverse' : 'primary'}>
                {account.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
