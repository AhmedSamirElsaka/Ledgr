import {useCallback, useEffect, useMemo} from 'react';

import {Platform, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {FlashList, type ListRenderItem} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {ListItemSeparator} from '../../../design/primitives/ListItemSeparator';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {SectionHeader} from '../../../design/primitives/SectionHeader';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useSmsReviewStore} from '../../../store/smsReviewStore';
import {SmsInboxBulkBar} from '../components/SmsInboxBulkBar';
import {SmsInboxListRow} from '../components/SmsInboxListRow';
import {SmsInboxPeriodChips} from '../components/SmsInboxPeriodChips';
import {useSmsInbox} from '../hooks/useSmsInbox';
import {registerSmsGenerateRuleHandler} from '../smsGenerateRuleBridge';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {SmsInboxListItem} from '../hooks/useSmsInboxList';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function SmsInboxScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const openReview = useSmsReviewStore(s => s.openReview);
  const inbox = useSmsInbox();

  useEffect(() => {
    registerSmsGenerateRuleHandler(payload => {
      navigation.navigate('SmsGenerateRule', payload);
    });
    return () => registerSmsGenerateRuleHandler(null);
  }, [navigation]);

  const onPressItem = useCallback(
    (id: string) => {
      if (inbox.selectionMode) {
        inbox.toggleSelected(id);
        return;
      }
      const item = inbox.items.find(row => row.id === id);
      if (!item) {
        return;
      }
      openReview({
        messageId: item.id,
        sender: item.sender,
        body: item.body,
        receivedAt: Date.parse(item.received_at) || Date.now(),
      });
    },
    [inbox, openReview],
  );

  const onLongPressItem = useCallback(
    (id: string) => {
      if (!inbox.selectionMode) {
        inbox.enterSelectionMode();
      }
      inbox.toggleSelected(id);
    },
    [inbox],
  );

  const listExtraData = useMemo(
    () => ({
      selectedIds: inbox.selectedIds,
      selectionMode: inbox.selectionMode,
    }),
    [inbox.selectedIds, inbox.selectionMode],
  );

  const renderItem = useCallback<ListRenderItem<SmsInboxListItem>>(
    ({item}) => {
      const selected = inbox.selectedIds.has(item.id);
      return (
        <SmsInboxListRow
          item={item}
          selectionMode={inbox.selectionMode}
          selected={selected}
          onLongPress={onLongPressItem}
          onPress={onPressItem}
        />
      );
    },
    [inbox.selectedIds, inbox.selectionMode, onLongPressItem, onPressItem],
  );

  const listEmpty =
    inbox.listState === 'loading' ? (
      <View style={{gap: theme.space[2], paddingVertical: theme.space[4]}}>
        <Skeleton height={72} radius="lg" />
        <Skeleton height={72} radius="lg" />
        <Skeleton height={72} radius="lg" />
      </View>
    ) : inbox.listState === 'error' ? (
      <ErrorState
        title={t('smsInbox.loadErrorTitle')}
        message={inbox.listError ?? t('smsInbox.loadErrorBody')}
        onRetry={() => {
          inbox.refreshList().catch(() => undefined);
        }}
        retryLabel={t('common.retry')}
      />
    ) : (
      <EmptyState
        title={t('smsInbox.emptyTitle')}
        description={t('smsInbox.emptyBody')}
        illustration={
          <EmptyIllustration name="MessageSquare" secondaryName="Sparkles" />
        }
      />
    );

  const hasItems = inbox.listState === 'ready' && inbox.items.length > 0;

  return (
    <ScreenBackdrop washHeight={280}>
      <FlashList
        style={{flex: 1}}
        data={inbox.listState === 'ready' ? inbox.items : []}
        extraData={listExtraData}
        keyExtractor={item => item.id}
        drawDistance={250}
        ItemSeparatorComponent={ListItemSeparator}
        contentContainerStyle={{
          paddingTop: theme.space[4],
          paddingHorizontal: theme.space[4],
          paddingBottom:
            insets.bottom + theme.space[8] + (inbox.selectionMode ? 120 : 0),
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{gap: theme.space[3], marginBottom: theme.space[3]}}>
            <SectionHeader
              title={t('smsInbox.subtitle')}
              size="section"
            />

            {inbox.feedback ? (
              <FeedbackBanner
                message={inbox.feedback.message}
                tone={inbox.feedback.tone}
                actionLabel={t('common.close')}
                onAction={inbox.clearFeedback}
              />
            ) : null}

            {Platform.OS === 'android' ? (
              <SmsInboxPeriodChips
                periodId={inbox.periodId}
                onPeriodChange={inbox.setPeriodId}
                isCustom={inbox.isCustom}
                customFrom={inbox.customFrom}
                onCustomFromChange={inbox.setCustomFrom}
                customTo={inbox.customTo}
                onCustomToChange={inbox.setCustomTo}
                fromError={inbox.fromError}
                toError={inbox.toError}
                periodSummary={inbox.periodSummary}
                scanning={inbox.scanning}
                canImport={!inbox.isCustom || inbox.selectedPeriod != null}
                onImport={() => {
                  inbox.onImport().catch(() => undefined);
                }}
              />
            ) : (
              <FeedbackBanner message={t('smsInbox.iosHint')} tone="info" />
            )}

            {hasItems ? (
              <View style={{flexDirection: 'row', gap: theme.space[2]}}>
                <View style={{flex: 1}}>
                  <Button
                    label={
                      inbox.selectionMode
                        ? t('smsInbox.cancelSelect')
                        : t('smsInbox.select')
                    }
                    variant="secondary"
                    onPress={() => {
                      if (inbox.selectionMode) {
                        inbox.exitSelectionMode();
                      } else {
                        inbox.enterSelectionMode();
                      }
                    }}
                    fullWidth
                  />
                </View>
                <View style={{flex: 1}}>
                  <Button
                    label={t('smsInbox.selectAll')}
                    variant="secondary"
                    onPress={() => {
                      inbox.selectAll();
                    }}
                    fullWidth
                  />
                </View>
              </View>
            ) : null}

            {inbox.selectionMode && inbox.selectedCount > 0 ? (
              <Button
                label={
                  inbox.tracking
                    ? t('smsInbox.tracking')
                    : inbox.pendingSummary
                      ? t('smsInbox.trackConfirmReady', {
                          count: inbox.pendingSummary.ready.length,
                        })
                      : t('smsInbox.trackSelected', {count: inbox.selectedCount})
                }
                onPress={() => {
                  inbox.trackSelected().catch(() => undefined);
                }}
                disabled={inbox.tracking}
                fullWidth
              />
            ) : null}

            <Button
              label={t('smsInbox.pasteMessage')}
              variant="secondary"
              onPress={() => navigation.navigate('PasteImport')}
              fullWidth
            />
            <Button
              label={t('smsInbox.ruleTester')}
              variant="ghost"
              onPress={() => navigation.navigate('SmsRuleTester')}
              fullWidth
            />
            <Button
              label={t('smsInbox.manageRules')}
              variant="ghost"
              onPress={() => navigation.navigate('SmsRules')}
              fullWidth
            />
          </View>
        }
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
      />

      {inbox.selectionMode ? (
        <SmsInboxBulkBar
          bottomInset={insets.bottom}
          selectedCount={inbox.selectedCount}
          allSelected={inbox.allSelected}
          tracking={inbox.tracking}
          onSelectAll={inbox.selectAll}
          onClear={inbox.clearSelection}
          onTrack={() => {
            inbox.trackSelected().catch(() => undefined);
          }}
          onCancel={inbox.exitSelectionMode}
        />
      ) : null}
    </ScreenBackdrop>
  );
}
