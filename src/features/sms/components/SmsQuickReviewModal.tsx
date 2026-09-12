/**
 * Truecaller-style SMS track popup — compact bottom sheet over the app.
 * Primary path when a bank/wallet SMS is detected while Ledgr is usable.
 */

import {Modal, Pressable as RNPressable, ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Icon} from '../../../design/icons/Icon';
import {Input} from '../../../design/primitives/Input';
import {Pressable} from '../../../design/primitives/Pressable';
import {SegmentedControl} from '../../../design/primitives/SegmentedControl';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useSmsQuickReview} from '../hooks/useSmsQuickReview';
import {useSmsQuickReviewChrome} from '../hooks/useSmsQuickReviewChrome';

import {SmsQuickReviewAccountPicker} from './SmsQuickReviewAccountPicker';
import {SmsQuickReviewActions} from './SmsQuickReviewActions';
import {SmsQuickReviewCategoryPicker} from './SmsQuickReviewCategoryPicker';
import {SmsQuickReviewHero} from './SmsQuickReviewHero';

export function SmsQuickReviewModal() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const review = useSmsQuickReview();
  const {
    current,
    saving,
    amountMinor,
    accountId,
    direction,
    onIgnore,
    onTrack,
  } = review;

  const chrome = useSmsQuickReviewChrome({
    current,
    autoAction: current?.autoAction,
    saving,
    amountMinor,
    accountId,
    direction,
    onIgnore,
    onTrack,
  });

  if (!current) {
    return null;
  }

  const isTransfer = direction === 'transfer';
  const isIncome = direction === 'income';
  const canTrack = isTransfer
    ? amountMinor != null &&
      accountId != null &&
      review.toAccountId != null &&
      accountId !== review.toAccountId
    : amountMinor != null && accountId != null;
  const canSave = isTransfer ? canTrack : canTrack && review.categoryId != null;

  const title = isIncome
    ? t('smsReview.popupTitleIncome')
    : isTransfer
      ? t('smsReview.popupTitleTransfer')
      : t('smsReview.popupTitleExpense');

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        review.onSnooze();
      }}
      accessibilityViewIsModal>
      <View style={{flex: 1, justifyContent: 'flex-end'}}>
        <RNPressable
          accessibilityRole="button"
          accessibilityLabel={t('smsReview.snooze')}
          onPress={() => review.onSnooze()}
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: theme.colors.overlay.scrim,
          }}
        />

        <View
          style={{
            backgroundColor: theme.colors.surface.overlay,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingHorizontal: theme.space[4],
            paddingTop: theme.space[3],
            paddingBottom: insets.bottom + theme.space[4],
            maxHeight: '92%',
            gap: theme.space[3],
            ...theme.elevation[3],
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: theme.space[10],
              height: theme.space[1],
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.border.default,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{flex: 1, gap: theme.space[1]}}>
              <Text variant="label" color="tertiary">
                {title}
              </Text>
              <Text variant="headline">{t('smsReview.popupAsk')}</Text>
            </View>
            <Pressable
              accessibilityLabel={t('smsReview.snooze')}
              minSize={false}
              onPress={() => review.onSnooze()}
              style={{
                width: theme.touchTarget,
                height: theme.touchTarget,
                borderRadius: theme.radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface.sunken,
              }}>
              <Icon name="X" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{gap: theme.space[3], paddingBottom: theme.space[2]}}>
            <SmsQuickReviewHero
              sender={current.sender}
              body={current.body}
              merchant={review.merchant}
              cardLast4={review.cardLast4}
              amountMinor={amountMinor}
              currency={review.currency}
              direction={direction}
              showMessage={chrome.showMessage}
              onToggleMessage={() => chrome.setShowMessage(v => !v)}
            />

            <SegmentedControl
              accessibilityLabel={t('smsReview.directionLabel')}
              value={direction}
              onChange={review.setDirection}
              options={[
                {id: 'expense', label: t('smsReview.directionOutgoing')},
                {id: 'income', label: t('smsReview.directionIncoming')},
                {id: 'transfer', label: t('smsReview.directionInternal')},
              ]}
            />

            {!isTransfer ? (
              <SmsQuickReviewCategoryPicker
                leafCategories={review.leafCategories}
                categoryId={review.categoryId}
                onCategoryChange={review.setCategoryId}
                categorySuggestion={review.categorySuggestion}
              />
            ) : (
              <View style={{gap: theme.space[3]}}>
                <SmsQuickReviewAccountPicker
                  label={t('smsReview.fromAccount')}
                  accounts={review.accounts}
                  accountId={accountId}
                  onAccountChange={review.setAccountId}
                />
                <SmsQuickReviewAccountPicker
                  label={t('smsReview.toAccount')}
                  accounts={review.accounts.filter(a => a.id !== accountId)}
                  accountId={review.toAccountId}
                  onAccountChange={review.setToAccountId}
                />
              </View>
            )}

            {!chrome.showNote ? (
              <Pressable
                accessibilityLabel={t('smsReview.addNote')}
                minSize={false}
                onPress={() => chrome.setShowNote(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space[2],
                  minHeight: theme.touchTarget,
                  paddingVertical: theme.space[2],
                }}>
                <Icon name="Plus" size={16} color={theme.colors.text.secondary} />
                <Text variant="body" color="secondary">
                  {t('smsReview.addNote')}
                </Text>
              </Pressable>
            ) : (
              <Input
                label={t('smsReview.note')}
                value={review.note}
                onChangeText={review.setNote}
                placeholder={t('smsReview.notePlaceholder')}
                autoFocus
              />
            )}

            <Pressable
              accessibilityLabel={t('smsReview.moreOptions')}
              minSize={false}
              onPress={() => chrome.setShowMore(v => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: theme.touchTarget,
                paddingVertical: theme.space[1],
              }}>
              <Text variant="label" color="secondary">
                {chrome.showMore ? t('smsReview.hideOptions') : t('smsReview.moreOptions')}
              </Text>
              <Icon
                name={chrome.showMore ? 'ChevronUp' : 'ChevronDown'}
                size={18}
                color={theme.colors.text.tertiary}
              />
            </Pressable>

            {chrome.showMore ? (
              <View style={{gap: theme.space[3]}}>
                <Input
                  label={t('smsReview.amountLabel')}
                  value={review.amountText}
                  onChangeText={review.setAmountText}
                  placeholder={t('smsReview.amountPlaceholder')}
                  keyboardType="decimal-pad"
                  invalid={
                    review.detectedAmountMinor == null && review.amountText.trim().length === 0
                  }
                />
                {!isTransfer ? (
                  <SmsQuickReviewAccountPicker
                    accounts={review.accounts}
                    accountId={accountId}
                    onAccountChange={review.setAccountId}
                  />
                ) : null}
                {review.decision ? (
                  <Text variant="caption" color="tertiary">
                    {t('smsReview.parseConfidence', {
                      detail: review.decision.highConfidence
                        ? t('smsReview.parseConfidenceHigh', {
                            score: review.decision.confidence,
                          })
                        : t('smsReview.parseConfidenceReview', {
                            score: review.decision.confidence,
                            classification: review.decision.classification,
                          }),
                    })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {review.error ? (
              <Text variant="caption" color="negative">
                {review.error}
              </Text>
            ) : null}
          </ScrollView>

          <SmsQuickReviewActions
            saving={saving}
            canTrack={canTrack}
            canSave={canSave}
            hasCategory={review.categoryId != null}
            isTransfer={isTransfer}
            onTrack={() => {
              onTrack().catch(() => undefined);
            }}
            onSave={() => {
              review.onSave().catch(() => undefined);
            }}
            onSnooze={() => review.onSnooze()}
            onIgnore={() => {
              onIgnore().catch(() => undefined);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
