import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {HeroCard} from '../../../design/primitives/Card';
import {ErrorState} from '../../../design/primitives/ErrorState';
import {Pressable} from '../../../design/primitives/Pressable';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {SegmentedControl} from '../../../design/primitives/SegmentedControl';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {CURRENCIES, money} from '../../../domain/money/Money';
import {AddTransactionDetails} from '../components/AddTransactionDetails';
import {AddTransactionTemplates} from '../components/AddTransactionTemplates';
import {applyKeypadDigit, NumericKeypad} from '../components/NumericKeypad';
import {useAddTransactionScreen} from '../hooks/useAddTransactionScreen';

export function AddTransactionScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const screen = useAddTransactionScreen();

  const typeOptions = [
    {id: 'expense' as const, label: t('add.typeExpense')},
    {id: 'income' as const, label: t('add.typeIncome')},
    {id: 'transfer' as const, label: t('add.typeTransfer')},
  ];

  const showEditActions = screen.isEditing;

  if (screen.loadError && screen.editId) {
    return (
      <ScreenBackdrop>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + theme.space[4],
            paddingHorizontal: theme.space[4],
          }}>
          <ErrorState
            title={t('common.errorTitle')}
            message={t('common.loadFailed')}
            retryLabel={t('common.close')}
            onRetry={() => screen.navigation.goBack()}
          />
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.space[4],
          paddingBottom: insets.bottom + theme.space[6],
          paddingHorizontal: theme.space[4],
          gap: theme.space[5],
        }}
        keyboardShouldPersistTaps="handled">
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{gap: theme.space[1]}}>
            <Text variant="label" color="tertiary">
              {showEditActions ? t('add.eyebrowEdit') : t('add.eyebrowNew')}
            </Text>
            <Text variant="title">
              {showEditActions ? t('add.titleEdit') : t('add.titleNew')}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t('common.close')}
            onPress={() => screen.navigation.goBack()}
            style={{
              paddingHorizontal: theme.space[3],
              paddingVertical: theme.space[2],
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surface.sunken,
            }}>
            <Text variant="bodyStrong" color="secondary">
              {t('common.close')}
            </Text>
          </Pressable>
        </View>

        <SegmentedControl
          options={typeOptions}
          value={screen.type}
          onChange={screen.setType}
          accessibilityLabel={t('add.titleNew')}
        />

        <HeroCard>
          <Text variant="label" style={{color: theme.colors.hero.muted}}>
            {t('add.amount')}
          </Text>
          <View style={{marginTop: theme.space[3], alignItems: 'center'}}>
            <Amount
              value={money(
                screen.type === 'expense'
                  ? -Math.abs(screen.amountMinor || 0)
                  : screen.type === 'income'
                    ? Math.abs(screen.amountMinor || 0)
                    : screen.amountMinor || 0,
                screen.currency,
              )}
              size="lg"
              tone="onHero"
              signed={screen.type === 'income' || screen.type === 'expense'}
            />
            <Text
              variant="caption"
              style={{color: theme.colors.hero.muted, marginTop: theme.space[2]}}>
              {CURRENCIES[screen.currency].code}
            </Text>
          </View>
        </HeroCard>

        {screen.step === 'amount' ? (
          <>
            {!showEditActions ? (
              <AddTransactionTemplates
                templates={screen.templates.templates}
                canSave={screen.templates.canSave}
                onApply={screen.templates.onApply}
                onSaveCurrent={screen.templates.onSaveCurrent}
                onDelete={screen.templates.onDelete}
              />
            ) : null}
            <NumericKeypad
              onKey={key =>
                screen.setAmountText(prev =>
                  applyKeypadDigit(prev, key, screen.exponent),
                )
              }
            />
            <Button
              label={t('add.continue')}
              fullWidth
              size="lg"
              disabled={screen.amountMinor <= 0}
              onPress={() => screen.setStep('details')}
            />
            {showEditActions ? (
              <View style={{gap: theme.space[2]}}>
                <Button
                  label={t('add.duplicate')}
                  variant="secondary"
                  fullWidth
                  onPress={screen.onDuplicate}
                />
                <Button
                  label={screen.isSmsSource ? t('add.reject') : t('add.delete')}
                  variant="danger"
                  fullWidth
                  onPress={screen.onDelete}
                />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <AddTransactionDetails
              type={screen.type}
              accounts={screen.accounts}
              categories={screen.categories}
              tags={screen.tags}
              selectedTagIds={screen.selectedTagIds}
              newTagName={screen.newTagName}
              accountId={screen.accountId}
              toAccountId={screen.toAccountId}
              categoryId={screen.categoryId}
              categorySuggestion={screen.categorySuggestion}
              note={screen.note}
              occurredAt={screen.occurredAt}
              budgetHint={screen.budgetHint}
              receipt={screen.receipt}
              onAccountId={screen.setAccountId}
              onToAccountId={screen.setToAccountId}
              onCategoryId={screen.setCategoryId}
              onToggleTag={screen.onToggleTag}
              onNewTagName={screen.setNewTagName}
              onCreateTag={() => {
                screen.onCreateTag();
              }}
              onNote={screen.setNote}
              onOccurredAt={screen.setOccurredAt}
              onReceiptChange={screen.setReceipt}
              onEditAmount={() => screen.setStep('amount')}
            />
            {!showEditActions ? (
              <Button
                label={t('templates.saveCurrent')}
                variant="secondary"
                fullWidth
                disabled={!screen.templates.canSave}
                onPress={screen.templates.onSaveCurrent}
              />
            ) : null}
            <Button
              label={screen.saving ? t('common.saving') : t('add.save')}
              fullWidth
              size="lg"
              disabled={screen.saving || screen.amountMinor <= 0 || !screen.accountId}
              onPress={() => {
                screen.onSave().catch(() => undefined);
              }}
            />
            <Button
              label={t('add.backToAmount')}
              variant="ghost"
              fullWidth
              onPress={() => screen.setStep('amount')}
            />
            {showEditActions ? (
              <View style={{gap: theme.space[2]}}>
                <Button
                  label={t('add.duplicate')}
                  variant="secondary"
                  fullWidth
                  onPress={screen.onDuplicate}
                />
                <Button
                  label={screen.isSmsSource ? t('add.reject') : t('add.delete')}
                  variant="danger"
                  fullWidth
                  onPress={screen.onDelete}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenBackdrop>
  );
}
