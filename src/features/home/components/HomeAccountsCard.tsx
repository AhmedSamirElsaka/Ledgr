import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Amount} from '../../../design/primitives/Amount';
import {Card} from '../../../design/primitives/Card';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';
import {useIsRtl} from '../../../i18n/useTextInputAlign';

import type {AccountWithBalance} from '../../../db/repositories/accountsRepository';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

type HomeAccountsCardProps = {
  accounts: AccountWithBalance[];
  onOpenAccounts: () => void;
  onOpenAccount: (id: string) => void;
};

export function HomeAccountsCard({
  accounts,
  onOpenAccounts,
  onOpenAccount,
}: HomeAccountsCardProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const isRtl = useIsRtl();

  return (
    <Card elevated>
      <Pressable
        onPress={onOpenAccounts}
        accessibilityLabel={t('home.accountsOpenA11y')}
        accessibilityHint={t('home.accountsOpenHint')}
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: theme.space[3],
          minHeight: theme.touchTarget,
        }}>
        <Text variant="headline">{t('home.accounts')}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.space[1]}}>
          <Text variant="caption" color="tertiary">
            {accounts.length === 0
              ? t('common.noneYet')
              : t('home.accountsCount', {count: accounts.length})}
          </Text>
          <Icon
            name={isRtl ? 'ChevronLeft' : 'ChevronRight'}
            color={theme.colors.text.tertiary}
            size={16}
          />
        </View>
      </Pressable>
      {accounts.length === 0 ? (
        <EmptyState
          title={t('home.accountsEmptyTitle')}
          description={t('home.accountsEmpty')}
          actionLabel={t('home.accountsEmptyAction')}
          onAction={onOpenAccounts}
          illustration={
            <EmptyIllustration name="Wallet" secondaryName="Plus" />
          }
        />
      ) : (
        <View style={{gap: theme.space[3]}}>
          {accounts.map((acc, index) => (
            <Pressable
              key={acc.id}
              onPress={() => onOpenAccount(acc.id)}
              accessibilityLabel={t('home.accountOpenA11y', {name: acc.name})}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: theme.touchTarget,
                paddingTop: index === 0 ? 0 : theme.space[3],
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border.subtle,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.space[3]}}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: theme.radius.full,
                    backgroundColor: acc.color || theme.colors.accent.primary,
                  }}
                />
                <Text variant="bodyStrong">{acc.name}</Text>
              </View>
              <Amount
                value={money(acc.balance_minor, asCurrency(String(acc.currency)))}
                size="sm"
              />
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}
