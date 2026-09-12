import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {HeroCard} from '../../../design/primitives/Card';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money, type CurrencyCode} from '../../../domain/money/Money';

import type {SmsReviewDirection} from '../hooks/useSmsQuickReviewLoad';

type Props = {
  sender: string;
  body: string;
  merchant: string | null;
  cardLast4: string | null;
  amountMinor: number | null;
  currency: CurrencyCode;
  direction: SmsReviewDirection;
  showMessage: boolean;
  onToggleMessage: () => void;
};

export function SmsQuickReviewHero({
  sender,
  body,
  merchant,
  cardLast4,
  amountMinor,
  currency,
  direction,
  showMessage,
  onToggleMessage,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const isIncome = direction === 'income';
  const isTransfer = direction === 'transfer';
  const trimmedBody = body.trim();
  const bodyPreview =
    trimmedBody.length > 110 ? `${trimmedBody.slice(0, 107)}…` : trimmedBody;

  const directionLabel = isIncome
    ? t('smsReview.directionIncoming')
    : isTransfer
      ? t('smsReview.directionInternal')
      : t('smsReview.directionOutgoing');

  return (
    <HeroCard>
      <View style={{gap: theme.space[4]}}>
        <View style={{gap: theme.space[1]}}>
          <Text variant="label" style={{color: theme.colors.hero.muted}}>
            {directionLabel}
          </Text>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={{color: theme.colors.hero.text}}>
            {merchant ?? t('smsReview.merchantMissing')}
          </Text>
          <Text
            variant="caption"
            numberOfLines={1}
            style={{color: theme.colors.hero.muted}}>
            {t('smsReview.from', {sender})}
            {cardLast4 ? ` · ••${cardLast4}` : ''}
          </Text>
        </View>

        {amountMinor != null ? (
          <Amount
            value={money(isIncome ? amountMinor : -Math.abs(amountMinor), currency)}
            size="lg"
            tone="onHero"
            signed
          />
        ) : (
          <Text variant="headline" style={{color: theme.colors.semantic.warning}}>
            {t('smsReview.amountMissing')}
          </Text>
        )}

        <Pressable
          accessibilityLabel={t('smsReview.message')}
          minSize={false}
          onPress={onToggleMessage}
          style={{gap: theme.space[1]}}>
          <Text
            variant="caption"
            numberOfLines={showMessage ? undefined : 2}
            style={{color: theme.colors.hero.muted}}>
            {showMessage ? trimmedBody : bodyPreview}
          </Text>
          <Text variant="label" style={{color: theme.colors.hero.text}}>
            {showMessage ? t('smsReview.hideMessage') : t('smsReview.showMessage')}
          </Text>
        </Pressable>
      </View>
    </HeroCard>
  );
}
