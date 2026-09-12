import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {Skeleton} from '../../../design/primitives/Skeleton';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {useRecurringRuleFormScreen} from '../hooks/useRecurringRuleFormScreen';

export function RecurringRuleFormScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {
    editId,
    loading,
    name,
    setName,
    amountText,
    setAmountText,
    type,
    setType,
    cycle,
    setCycle,
    customDays,
    setCustomDays,
    nextDue,
    setNextDue,
    note,
    setNote,
    active,
    setActive,
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    accounts,
    categories,
    saving,
    onSave,
    onDelete,
    cycles,
    types,
  } = useRecurringRuleFormScreen();

  if (loading) {
    return (
      <ScreenBackdrop washHeight={220}>
        <View
          style={{
            padding: theme.space[4],
            gap: theme.space[3],
          }}>
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop washHeight={220}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[3],
        }}
        keyboardShouldPersistTaps="handled">
        <Input
          label={t('recurringForm.name')}
          value={name}
          onChangeText={setName}
        />
        <Input
          label={t('recurringForm.amount')}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
        />
        <Text variant="label" color="tertiary">
          {t('recurringForm.type')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {types.map(item => (
            <Button
              key={item}
              label={t(`recurringScreen.type.${item}`)}
              variant={type === item ? 'primary' : 'secondary'}
              onPress={() => setType(item)}
            />
          ))}
        </View>
        <Text variant="label" color="tertiary">
          {t('recurringForm.cycle')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {cycles.map(item => (
            <Button
              key={item}
              label={t(`recurringScreen.cycle.${item}`)}
              variant={cycle === item ? 'primary' : 'secondary'}
              onPress={() => setCycle(item)}
            />
          ))}
        </View>
        {cycle === 'custom' ? (
          <Input
            label={t('recurringForm.customDays')}
            value={customDays}
            onChangeText={setCustomDays}
            keyboardType="number-pad"
          />
        ) : null}
        <Input
          label={t('recurringForm.nextDue')}
          value={nextDue}
          onChangeText={setNextDue}
        />
        <Text variant="label" color="tertiary">
          {t('recurringForm.account')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {accounts.map(account => (
            <Button
              key={account.id}
              label={account.name}
              variant={accountId === account.id ? 'primary' : 'secondary'}
              onPress={() => setAccountId(account.id)}
            />
          ))}
        </View>
        <Text variant="label" color="tertiary">
          {t('recurringForm.category')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          <Button
            label={t('recurringForm.noCategory')}
            variant={categoryId == null ? 'primary' : 'secondary'}
            onPress={() => setCategoryId(null)}
          />
          {categories.map(cat => (
            <Button
              key={cat.id}
              label={cat.name}
              variant={categoryId === cat.id ? 'primary' : 'secondary'}
              onPress={() => setCategoryId(cat.id)}
            />
          ))}
        </View>
        <Input
          label={t('recurringForm.note')}
          value={note}
          onChangeText={setNote}
        />
        <Button
          label={active ? t('recurringScreen.active') : t('recurringScreen.paused')}
          variant={active ? 'primary' : 'secondary'}
          onPress={() => setActive(v => !v)}
          fullWidth
        />
        <Button
          label={t('common.save')}
          loading={saving}
          onPress={() => {
            onSave().catch(() => undefined);
          }}
          fullWidth
        />
        {editId ? (
          <Button
            label={t('recurringForm.delete')}
            variant="danger"
            onPress={onDelete}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </ScreenBackdrop>
  );
}
