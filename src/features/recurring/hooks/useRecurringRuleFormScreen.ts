import {useNavigation, useRoute} from '@react-navigation/native';

import {useRepos} from '../../../db/DatabaseProvider';

import {RECURRING_CYCLES, RECURRING_TYPES} from './recurringFormUtils';
import {useRecurringRuleFormActions} from './useRecurringRuleFormActions';
import {useRecurringRuleFormLoad} from './useRecurringRuleFormLoad';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function useRecurringRuleFormScreen() {
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'RecurringRuleForm'>>();
  const editId = route.params?.id;

  const load = useRecurringRuleFormLoad(repos, editId);
  const actions = useRecurringRuleFormActions({
    repos,
    navigation,
    editId,
    name: load.name,
    amountText: load.amountText,
    currency: load.currency,
    type: load.type,
    cycle: load.cycle,
    customDays: load.customDays,
    nextDue: load.nextDue,
    note: load.note,
    active: load.active,
    accountId: load.accountId,
    categoryId: load.categoryId,
  });

  return {
    editId,
    loading: load.loading,
    name: load.name,
    setName: load.setName,
    amountText: load.amountText,
    setAmountText: load.setAmountText,
    type: load.type,
    setType: load.setType,
    cycle: load.cycle,
    setCycle: load.setCycle,
    customDays: load.customDays,
    setCustomDays: load.setCustomDays,
    nextDue: load.nextDue,
    setNextDue: load.setNextDue,
    note: load.note,
    setNote: load.setNote,
    active: load.active,
    setActive: load.setActive,
    accountId: load.accountId,
    setAccountId: load.setAccountId,
    categoryId: load.categoryId,
    setCategoryId: load.setCategoryId,
    accounts: load.accounts,
    categories: load.categories,
    saving: actions.saving,
    onSave: actions.onSave,
    onDelete: actions.onDelete,
    cycles: RECURRING_CYCLES,
    types: RECURRING_TYPES,
  };
}
