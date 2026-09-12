import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {Amount} from '../../../design/primitives/Amount';
import {HeroCard} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money, type CurrencyCode} from '../../../domain/money/Money';

type HomePeriodSpendCardProps = {
  baseCurrency: CurrencyCode;
  spendMinor: number;
  streak: number;
  onOpenBudgets: () => void;
};

export function HomePeriodSpendCard({
  baseCurrency,
  spendMinor,
  streak,
  onOpenBudgets,
}: HomePeriodSpendCardProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <HeroCard>
      <Text
        variant="label"
        style={{color: theme.colors.hero.muted, letterSpacing: theme.typography.label.letterSpacing}}>
        {t('home.periodSpend')}
      </Text>
      <View style={{marginTop: theme.space[3]}}>
        <Amount
          value={money(-Math.abs(spendMinor), baseCurrency)}
          size="lg"
          tone="onHero"
          signed
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.space[6],
        }}>
        <View
          accessible
          accessibilityLabel={
            streak > 0
              ? t('home.streakDays', {count: streak})
              : t('home.streakEmpty')
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space[2],
            backgroundColor: theme.colors.hero.chip,
            paddingHorizontal: theme.space[3],
            paddingVertical: theme.space[2],
            borderRadius: theme.radius.full,
          }}>
          <Icon name="Flame" color={theme.colors.semantic.warning} size={16} />
          <Text variant="caption" style={{color: theme.colors.hero.text}}>
            {streak > 0
              ? t('home.streakDays', {count: streak})
              : t('home.streakEmpty')}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('home.budgets')}
          onPress={onOpenBudgets}
          minSize={false}
          style={{
            paddingVertical: theme.space[2],
            paddingHorizontal: theme.space[3],
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.hero.chip,
          }}>
          <Text variant="caption" style={{color: theme.colors.hero.text}}>
            {t('home.budgets')}
          </Text>
        </Pressable>
      </View>
    </HeroCard>
  );
}
