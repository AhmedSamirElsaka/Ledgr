import {useNavigation, useRoute} from '@react-navigation/native';

import {useRepos} from '../../../db/DatabaseProvider';

import {BUDGET_PERIODS} from './budgetFormUtils';
import {useBudgetFormActions} from './useBudgetFormActions';
import {useBudgetFormLoad} from './useBudgetFormLoad';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function useBudgetFormScreen() {
  const repos = useRepos();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<RouteProp<MoreStackParamList, 'BudgetForm'>>();
  const editId = route.params?.id;

  const load = useBudgetFormLoad(repos, editId);
  const actions = useBudgetFormActions({
    repos,
    navigation,
    editId,
    categoryId: load.categoryId,
    period: load.period,
    amountText: load.amountText,
    currency: load.currency,
    rollover: load.rollover,
  });

  return {
    editId,
    categories: load.categories,
    categoryId: load.categoryId,
    setCategoryId: load.setCategoryId,
    period: load.period,
    setPeriod: load.setPeriod,
    amountText: load.amountText,
    setAmountText: load.setAmountText,
    rollover: load.rollover,
    setRollover: load.setRollover,
    saving: actions.saving,
    onSave: actions.onSave,
    onDeactivate: actions.onDeactivate,
    periods: BUDGET_PERIODS,
  };
}
